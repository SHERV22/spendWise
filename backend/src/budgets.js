import {
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { BUDGETS_TABLE } from './db.js';
import { VALID_CATEGORIES } from './transactions.js';

export function validateBudgetInput(input) {
  const errors = [];

  if (!input || typeof input !== 'object') {
    return ['Request body must be a JSON object'];
  }

  const { month, category, amount } = input;

  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!month || !monthRegex.test(month)) {
    errors.push('Month is required in YYYY-MM format (e.g. 2026-10)');
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.push(`Invalid category "${category}". Allowed: ${VALID_CATEGORIES.join(', ')}`);
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0 || !isFinite(numAmount)) {
    errors.push('Budget amount must be a positive number or zero');
  }

  return errors;
}

export async function listBudgets(userId, month = null, client) {
  const params = {
    TableName: BUDGETS_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: {
      ':uid': userId,
    },
  };

  if (month) {
    params.FilterExpression = '#m = :month';
    params.ExpressionAttributeNames = { '#m': 'month' };
    params.ExpressionAttributeValues[':month'] = month;
  }

  const result = await client.send(new QueryCommand(params));
  return result.Items || [];
}

export async function setBudget(userId, body, client) {
  const validationErrors = validateBudgetInput(body);
  if (validationErrors.length > 0) {
    const error = new Error(validationErrors.join('; '));
    error.statusCode = 400;
    throw error;
  }

  const { month, category, amount } = body;
  const now = new Date().toISOString();
  const amountInPaise = Math.round(Number(amount) * 100);

  const item = {
    userId,
    monthCategory: `${month}#${category}`,
    month,
    category,
    amount: amountInPaise, // stored in paise
    createdAt: now,
    updatedAt: now,
  };

  await client.send(
    new PutCommand({
      TableName: BUDGETS_TABLE,
      Item: item,
    })
  );

  return item;
}

export async function deleteBudget(userId, month, category, client) {
  if (!month || !category) {
    const error = new Error('Month and category are required to delete a budget');
    error.statusCode = 400;
    throw error;
  }

  await client.send(
    new DeleteCommand({
      TableName: BUDGETS_TABLE,
      Key: {
        userId,
        monthCategory: `${month}#${category}`,
      },
    })
  );

  return { success: true, message: `Budget for ${category} (${month}) removed` };
}
