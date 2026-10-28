import {
  QueryCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { TRANSACTIONS_TABLE } from './db.js';

export const VALID_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Education',
  'Bills',
  'Health',
  'Entertainment',
  'Salary',
  'Investment',
  'Other',
];

export const VALID_TYPES = ['income', 'expense'];

export function validateTransactionInput(input) {
  const errors = [];

  if (!input || typeof input !== 'object') {
    return ['Request body must be a JSON object'];
  }

  const { type, amount, category, description, transactionDate } = input;

  if (!VALID_TYPES.includes(type)) {
    errors.push(`Invalid type "${type}". Allowed: ${VALID_TYPES.join(', ')}`);
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0 || !isFinite(numAmount)) {
    errors.push('Amount must be a positive number greater than 0');
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.push(`Invalid category "${category}". Allowed: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required');
  } else if (description.trim().length > 250) {
    errors.push('Description cannot exceed 250 characters');
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!transactionDate || !dateRegex.test(transactionDate)) {
    errors.push('Transaction date is required in YYYY-MM-DD format');
  }

  return errors;
}

export async function listTransactions(userId, queryParams = {}, client) {
  const { category, type, startDate, endDate, limit = 50 } = queryParams;

  const params = {
    TableName: TRANSACTIONS_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: {
      ':uid': userId,
    },
    ScanIndexForward: false, // newest first if sorted
  };

  const filterExpressions = [];

  if (category && VALID_CATEGORIES.includes(category)) {
    filterExpressions.push('category = :category');
    params.ExpressionAttributeValues[':category'] = category;
  }

  if (type && VALID_TYPES.includes(type)) {
    filterExpressions.push('#t = :type');
    params.ExpressionAttributeNames = { '#t': 'type' };
    params.ExpressionAttributeValues[':type'] = type;
  }

  if (startDate) {
    filterExpressions.push('transactionDate >= :startDate');
    params.ExpressionAttributeValues[':startDate'] = startDate;
  }

  if (endDate) {
    filterExpressions.push('transactionDate <= :endDate');
    params.ExpressionAttributeValues[':endDate'] = endDate;
  }

  if (filterExpressions.length > 0) {
    params.FilterExpression = filterExpressions.join(' AND ');
  }

  const result = await client.send(new QueryCommand(params));
  const items = result.Items || [];

  // Sort by transactionDate descending in memory to ensure consistent order
  items.sort((a, b) => {
    const dDiff = new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
    if (dDiff !== 0) return dDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  return items.slice(0, parsedLimit);
}

export async function createTransaction(userId, body, client) {
  const validationErrors = validateTransactionInput(body);
  if (validationErrors.length > 0) {
    const error = new Error(validationErrors.join('; '));
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const id = body.id || randomUUID();
  const amountInPaise = Math.round(Number(body.amount) * 100);

  const item = {
    userId,
    transactionId: id,
    id,
    type: body.type,
    amount: amountInPaise, // stored in paise
    category: body.category,
    description: body.description.trim(),
    transactionDate: body.transactionDate,
    createdAt: now,
    updatedAt: now,
  };

  await client.send(
    new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: item,
    })
  );

  return item;
}

export async function getTransaction(userId, transactionId, client) {
  const result = await client.send(
    new GetCommand({
      TableName: TRANSACTIONS_TABLE,
      Key: {
        userId,
        transactionId,
      },
    })
  );

  if (!result.Item) {
    const error = new Error('Transaction not found or not authorized');
    error.statusCode = 404;
    throw error;
  }

  return result.Item;
}

export async function updateTransaction(userId, transactionId, body, client) {
  // Verify transaction exists and belongs to user
  const existing = await getTransaction(userId, transactionId, client);

  const validationErrors = validateTransactionInput({
    type: body.type || existing.type,
    amount: body.amount !== undefined ? body.amount : existing.amount / 100,
    category: body.category || existing.category,
    description: body.description !== undefined ? body.description : existing.description,
    transactionDate: body.transactionDate || existing.transactionDate,
  });

  if (validationErrors.length > 0) {
    const error = new Error(validationErrors.join('; '));
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const amountInPaise =
    body.amount !== undefined ? Math.round(Number(body.amount) * 100) : existing.amount;

  const updatedItem = {
    ...existing,
    type: body.type || existing.type,
    amount: amountInPaise,
    category: body.category || existing.category,
    description: (body.description !== undefined ? body.description : existing.description).trim(),
    transactionDate: body.transactionDate || existing.transactionDate,
    updatedAt: now,
  };

  await client.send(
    new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: updatedItem,
    })
  );

  return updatedItem;
}

export async function deleteTransaction(userId, transactionId, client) {
  // Ensure transaction exists and belongs to user first
  await getTransaction(userId, transactionId, client);

  await client.send(
    new DeleteCommand({
      TableName: TRANSACTIONS_TABLE,
      Key: {
        userId,
        transactionId,
      },
    })
  );

  return { success: true, message: 'Transaction deleted successfully', transactionId };
}
