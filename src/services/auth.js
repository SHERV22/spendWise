// Amazon Cognito & Demo Authentication Service for SpendWise

const AUTH_STORAGE_KEYS = {
  USER: 'spendwise_user',
  TOKEN: 'spendwise_jwt_token',
  CONFIG: 'spendwise_aws_config',
};

// Default Demo User for Instant Viva / Lab Testing
export const DEMO_USER = {
  id: 'demo-student-user',
  email: 'student.demo@spendwise.edu',
  name: 'Student Demo Account',
  isDemo: true,
};

// Retrieve configured AWS settings from localStorage or Vite environment variables
export function getAwsConfig() {
  const saved = localStorage.getItem(AUTH_STORAGE_KEYS.CONFIG);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  return {
    apiEndpoint: import.meta.env.VITE_API_ENDPOINT || '',
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    region: import.meta.env.VITE_AWS_REGION || 'ap-south-1',
  };
}

export function saveAwsConfig(config) {
  localStorage.setItem(AUTH_STORAGE_KEYS.CONFIG, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('spendwise:config-changed', { detail: config }));
}

export function isAwsConfigured() {
  const cfg = getAwsConfig();
  return Boolean(cfg.apiEndpoint && cfg.userPoolId && cfg.clientId);
}

// -------------------------------------------------------------
// Amazon Cognito Identity Provider Direct REST Calls
// -------------------------------------------------------------
async function callCognitoIdp(action, payload) {
  const { region } = getAwsConfig();
  const endpoint = `https://cognito-idp.${region || 'ap-south-1'}.amazonaws.com/`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || data.__type || 'Cognito authentication error');
    error.code = data.__type ? data.__type.split('#').pop() : 'CognitoError';
    throw error;
  }
  return data;
}

// -------------------------------------------------------------
// Auth Actions (Cognito + Demo Fallback)
// -------------------------------------------------------------

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (!raw) return isAwsConfigured() ? null : DEMO_USER;
    const user = JSON.parse(raw);
    // When AWS is configured, clear any legacy demo session
    if (isAwsConfigured() && user?.isDemo) {
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
      return null;
    }
    return user;
  } catch {
    return isAwsConfigured() ? null : DEMO_USER;
  }
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN) || null;
}

export function setSession(user, token) {
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
  if (token) {
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  }
  window.dispatchEvent(new CustomEvent('spendwise:auth-changed', { detail: { user, token } }));
}

/**
 * Sign In with Email & Password
 */
export async function signIn(email, password, useDemoMode = false) {
  if (useDemoMode || !isAwsConfigured()) {
    const user = {
      id: 'demo-student-user',
      email: email || 'student.demo@spendwise.edu',
      name: email ? email.split('@')[0] : 'Demo Student',
      isDemo: true,
    };
    setSession(user, null);
    return user;
  }

  const { clientId } = getAwsConfig();

  // Call Cognito InitiateAuth
  const authResponse = await callCognitoIdp('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  if (authResponse.AuthenticationResult) {
    const idToken = authResponse.AuthenticationResult.IdToken;
    const accessToken = authResponse.AuthenticationResult.AccessToken;

    // Decode payload claims safely
    let sub = '';
    try {
      const parts = idToken.split('.');
      const payload = JSON.parse(atob(parts[1]));
      sub = payload.sub;
    } catch {
      sub = email;
    }

    const user = {
      id: sub,
      email,
      name: email.split('@')[0],
      isDemo: false,
    };

    setSession(user, idToken || accessToken);
    return user;
  }

  throw new Error('Unexpected Cognito authentication response');
}

/**
 * Sign Up with Cognito
 */
export async function signUp(email, password, name = '') {
  if (!isAwsConfigured()) {
    throw new Error('AWS Cognito is not yet configured. Please configure in Settings or use Demo Mode.');
  }

  const { clientId } = getAwsConfig();

  const userAttributes = [{ Name: 'email', Value: email }];
  if (name) {
    userAttributes.push({ Name: 'name', Value: name });
  }

  const res = await callCognitoIdp('SignUp', {
    ClientId: clientId,
    Username: email,
    Password: password,
    UserAttributes: userAttributes,
  });

  return res;
}

/**
 * Confirm Sign Up with verification code sent to email
 */
export async function confirmSignUp(email, confirmationCode) {
  if (!isAwsConfigured()) {
    throw new Error('AWS Cognito is not configured.');
  }

  const { clientId } = getAwsConfig();

  return await callCognitoIdp('ConfirmSignUp', {
    ClientId: clientId,
    Username: email,
    ConfirmationCode: confirmationCode,
  });
}

/**
 * Sign Out
 */
export function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  window.dispatchEvent(new CustomEvent('spendwise:auth-changed', { detail: { user: null, token: null } }));
}
