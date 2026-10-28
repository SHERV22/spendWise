import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Cloud,
} from 'lucide-react';
import {
  signIn,
  signUp,
  confirmSignUp,
  isAwsConfigured,
  DEMO_USER,
  setSession,
} from '../services/auth.js';

export default function AuthModal({ isOpen, onClose, onSuccess, showToast }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup' | 'confirm'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const awsConfigured = isAwsConfigured();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await signIn(email, password, !awsConfigured);
      showToast(`Welcome back, ${user.name || user.email}!`, 'success');
      onSuccess(user);
      onClose();
    } catch (err) {
      if (err.code === 'UserNotConfirmedException') {
        setTab('confirm');
        setErrorMsg('Please enter the confirmation code sent to your email.');
      } else {
        setErrorMsg(err.message || 'Failed to authenticate');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!awsConfigured) {
      setErrorMsg('AWS Cognito credentials must be configured in Settings to create cloud accounts. You can also sign in instantly using Demo Mode.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      showToast('Account registered! Enter the verification code sent to your email.', 'success');
      setTab('confirm');
    } catch (err) {
      setErrorMsg(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await confirmSignUp(email, confirmationCode);
      showToast('Email verified! You can now sign in.', 'success');
      setTab('signin');
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = () => {
    setSession(DEMO_USER, null);
    showToast('Signed in with Demo Student profile', 'info');
    onSuccess(DEMO_USER);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>AUTHENTICATION</span>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Close auth modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-bar">
          <button
            type="button"
            className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); setErrorMsg(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setErrorMsg(''); }}
          >
            Create Account
          </button>
          {tab === 'confirm' && (
            <button
              type="button"
              className="auth-tab active"
            >
              Verify Code
            </button>
          )}
        </div>

        {/* AWS vs Demo notice */}
        {!awsConfigured && (
          <div className="auth-demo-notice">
            <Laptop size={15} />
            <span>AWS Cognito not connected. Using local sandbox authentication.</span>
          </div>
        )}

        {errorMsg && (
          <div className="auth-error-box">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="modal-form mt-16">
            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                placeholder="student@spendwise.edu"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="modal-actions mt-20">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                <LogIn size={15} />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </div>

            {!awsConfigured && (
              <>
                <div className="auth-divider">
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  className="btn-secondary w-full btn-demo-shortcut"
                  onClick={handleInstantDemoLogin}
                >
                  <Laptop size={15} />
                  <span>Use Instant Demo Student Profile</span>
                </button>
              </>
            )}
          </form>
        )}

        {/* SIGN UP FORM */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="modal-form mt-16">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                placeholder="e.g. Rahul Sharma"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                placeholder="user@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password (min 8 chars, uppercase & numbers)
              </label>
              <input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="modal-actions mt-20">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                <UserPlus size={15} />
                <span>{loading ? 'Creating Cognito Account...' : 'Register Account'}</span>
              </button>
            </div>
          </form>
        )}

        {/* CONFIRM CODE FORM */}
        {tab === 'confirm' && (
          <form onSubmit={handleConfirm} className="modal-form mt-16">
            <p className="text-slate text-sm mb-12">
              Amazon Cognito sent a 6-digit confirmation code to <strong>{email}</strong>.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-code">
                Confirmation Code
              </label>
              <input
                id="auth-code"
                type="text"
                placeholder="123456"
                className="form-input"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="modal-actions mt-20">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                <CheckCircle2 size={15} />
                <span>{loading ? 'Verifying...' : 'Confirm Account'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
