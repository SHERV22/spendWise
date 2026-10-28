import { ddbDocClient } from './db.js';
import {
  listTransactions,
  createTransaction,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from './transactions.js';
import { listBudgets, setBudget, deleteBudget } from './budgets.js';
import { getAnalytics } from './analytics.js';

function buildResponse(statusCode, body, customHeaders = {}) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-user-id',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...customHeaders,
    },
    body: JSON.stringify(body),
  };
}

function extractUserId(event) {
  // 1. API Gateway REST API with Cognito User Pool Authorizer
  const cognitoSub =
    event.requestContext?.authorizer?.claims?.sub ||
    event.requestContext?.authorizer?.claims?.['cognito:username'] ||
    event.requestContext?.authorizer?.jwt?.claims?.sub;

  if (cognitoSub) {
    return cognitoSub;
  }

  // 2. Dev mode bypass only if explicitly enabled in environment variables
  if (process.env.DEV_ALLOW_MOCK_USER === 'true') {
    const devUserHeader =
      event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
    if (devUserHeader) {
      return devUserHeader;
    }
  }

  return null;
}

export async function handler(event, context, injectedClient) {
  // In AWS Lambda runtime, the 3rd argument is the callback function (event, context, callback).
  // Only treat injectedClient as a DB client if it actually exposes a .send function (e.g. In unit tests).
  const client =
    injectedClient && typeof injectedClient.send === 'function'
      ? injectedClient
      : ddbDocClient;

  // Normalize HTTP method and path for both REST API and HTTP API v2 formats
  const httpMethod = (event.httpMethod || event.requestContext?.http?.method || '').toUpperCase();
  const rawPath = event.path || event.requestContext?.http?.path || '';

  // Clean trailing slashes and prefix
  const path = rawPath.replace(/\/+$/, '') || '/';

  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return buildResponse(200, { message: 'CORS OK' });
  }

  // Public health check endpoint
  if (httpMethod === 'GET' && (path === '/health' || path === '')) {
    return buildResponse(200, {
      status: 'healthy',
      app: 'SpendWise API',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
    });
  }

  // Security Check: Authenticate user from Cognito JWT Authorizer claims
  const userId = extractUserId(event);
  if (!userId) {
    return buildResponse(401, {
      error: 'Unauthorized',
      message:
        'Missing or invalid Cognito authorization token. Please sign in via Amazon Cognito.',
    });
  }

  // Parse query parameters and request body
  const queryParams = event.queryStringParameters || {};
  let body = {};
  if (event.body) {
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch {
      return buildResponse(400, {
        error: 'BadRequest',
        message: 'Invalid JSON request payload',
      });
    }
  }

  try {
    // ----------------------------------------------------
    // ROUTE: /transactions
    // ----------------------------------------------------
    if (path === '/transactions') {
      if (httpMethod === 'GET') {
        const transactions = await listTransactions(userId, queryParams, client);
        return buildResponse(200, { data: transactions, count: transactions.length });
      }

      if (httpMethod === 'POST') {
        const newTransaction = await createTransaction(userId, body, client);
        return buildResponse(201, {
          data: newTransaction,
          message: 'Transaction recorded successfully',
        });
      }
    }

    // Match /transactions/{id}
    const transactionIdMatch = path.match(/^\/transactions\/([a-zA-Z0-9_-]+)$/);
    if (transactionIdMatch) {
      const transactionId = transactionIdMatch[1];

      if (httpMethod === 'GET') {
        const item = await getTransaction(userId, transactionId, client);
        return buildResponse(200, { data: item });
      }

      if (httpMethod === 'PUT') {
        const updated = await updateTransaction(userId, transactionId, body, client);
        return buildResponse(200, {
          data: updated,
          message: 'Transaction updated successfully',
        });
      }

      if (httpMethod === 'DELETE') {
        const res = await deleteTransaction(userId, transactionId, client);
        return buildResponse(200, res);
      }
    }

    // ----------------------------------------------------
    // ROUTE: /budgets
    // ----------------------------------------------------
    if (path === '/budgets') {
      if (httpMethod === 'GET') {
        const budgets = await listBudgets(userId, queryParams.month || null, client);
        return buildResponse(200, { data: budgets, count: budgets.length });
      }

      if (httpMethod === 'POST' || httpMethod === 'PUT') {
        const updatedBudget = await setBudget(userId, body, client);
        return buildResponse(200, {
          data: updatedBudget,
          message: 'Budget allocated successfully',
        });
      }
    }

    // Match /budgets/{month}/{category} for DELETE
    const budgetDeleteMatch = path.match(/^\/budgets\/(\d{4}-\d{2})\/([^/]+)$/);
    if (budgetDeleteMatch && httpMethod === 'DELETE') {
      const [, month, category] = budgetDeleteMatch;
      const res = await deleteBudget(userId, month, decodeURIComponent(category), client);
      return buildResponse(200, res);
    }

    // ----------------------------------------------------
    // ROUTE: /analytics
    // ----------------------------------------------------
    if (path === '/analytics' && httpMethod === 'GET') {
      const analytics = await getAnalytics(userId, queryParams.month || null, client);
      return buildResponse(200, { data: analytics });
    }

    // ----------------------------------------------------
    // ROUTE NOT FOUND
    // ----------------------------------------------------
    return buildResponse(404, {
      error: 'NotFound',
      message: `Endpoint ${httpMethod} ${path} does not exist on SpendWise API`,
    });
  } catch (err) {
    console.error('LAMBDA_ERROR:', err.name, err.message, err.stack);
    const statusCode = err.statusCode || 500;
    const safeMessage = err.message || 'An unexpected internal server error occurred while processing your request';

    return buildResponse(statusCode, {
      error: statusCode === 400 ? 'ValidationError' : statusCode === 404 ? 'NotFound' : 'InternalServerError',
      message: safeMessage,
      details: err.name,
    });
  }
}
