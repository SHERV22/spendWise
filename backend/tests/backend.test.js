import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTransactionInput,
  createTransaction,
  listTransactions,
} from '../src/transactions.js';
import { validateBudgetInput, setBudget } from '../src/budgets.js';
import { getAnalytics } from '../src/analytics.js';
import { handler } from '../src/handler.js';

describe('SpendWise Backend Tests', () => {
  describe('Transaction Validation & Paise Calculations', () => {
    it('should reject invalid amount', () => {
      const errors = validateTransactionInput({
        type: 'expense',
        amount: -100,
        category: 'Food',
        description: 'Lunch',
        transactionDate: '2026-10-27',
      });
      assert.ok(errors.some((e) => e.includes('positive number')));
    });

    it('should reject invalid category', () => {
      const errors = validateTransactionInput({
        type: 'expense',
        amount: 250,
        category: 'CryptoGambling',
        description: 'Test',
        transactionDate: '2026-10-27',
      });
      assert.ok(errors.some((e) => e.includes('Invalid category')));
    });

    it('should reject empty description', () => {
      const errors = validateTransactionInput({
        type: 'income',
        amount: 5000,
        category: 'Salary',
        description: '   ',
        transactionDate: '2026-10-27',
      });
      assert.ok(errors.some((e) => e.includes('Description is required')));
    });

    it('should reject invalid date format', () => {
      const errors = validateTransactionInput({
        type: 'income',
        amount: 5000,
        category: 'Salary',
        description: 'Bonus',
        transactionDate: '27-10-2026',
      });
      assert.ok(errors.some((e) => e.includes('YYYY-MM-DD')));
    });

    it('should accept valid transaction and convert amount to integer paise', async () => {
      const recordedItems = [];
      const mockClient = {
        send: async (cmd) => {
          recordedItems.push(cmd.input.Item);
          return {};
        },
      };

      const result = await createTransaction(
        'user-abc-123',
        {
          type: 'expense',
          amount: '149.50',
          category: 'Food',
          description: 'South Indian Thali',
          transactionDate: '2026-10-27',
        },
        mockClient
      );

      assert.equal(result.userId, 'user-abc-123');
      assert.equal(result.amount, 14950); // 149.50 * 100 = 14950 paise
      assert.equal(result.category, 'Food');
      assert.equal(result.type, 'expense');
    });
  });

  describe('Budget Validation', () => {
    it('should reject invalid month format', () => {
      const errors = validateBudgetInput({
        month: '2026/10',
        category: 'Food',
        amount: 5000,
      });
      assert.ok(errors.some((e) => e.includes('YYYY-MM format')));
    });

    it('should accept valid budget and store amount in paise', async () => {
      const recordedItems = [];
      const mockClient = {
        send: async (cmd) => {
          recordedItems.push(cmd.input.Item);
          return {};
        },
      };

      const result = await setBudget(
        'user-abc-123',
        {
          month: '2026-10',
          category: 'Food',
          amount: 8000,
        },
        mockClient
      );

      assert.equal(result.userId, 'user-abc-123');
      assert.equal(result.monthCategory, '2026-10#Food');
      assert.equal(result.amount, 800000); // 8000 * 100 paise
    });
  });

  describe('Analytics Calculations', () => {
    it('should accurately compute income, expenses, net balance, and savings rate', async () => {
      const sampleTransactions = [
        {
          userId: 'user-1',
          transactionId: 't1',
          type: 'income',
          amount: 10000000, // ₹1,00,000 (10000000 paise)
          category: 'Salary',
          transactionDate: '2026-10-01',
          createdAt: '2026-10-01T00:00:00Z',
        },
        {
          userId: 'user-1',
          transactionId: 't2',
          type: 'expense',
          amount: 3000000, // ₹30,000 (3000000 paise)
          category: 'Food',
          transactionDate: '2026-10-05',
          createdAt: '2026-10-05T00:00:00Z',
        },
        {
          userId: 'user-1',
          transactionId: 't3',
          type: 'expense',
          amount: 1000000, // ₹10,000 (1000000 paise)
          category: 'Transport',
          transactionDate: '2026-10-10',
          createdAt: '2026-10-10T00:00:00Z',
        },
      ];

      const sampleBudgets = [
        {
          userId: 'user-1',
          month: '2026-10',
          category: 'Food',
          amount: 3500000, // ₹35,000
        },
      ];

      const mockClient = {
        send: async (cmd) => {
          if (cmd.input.TableName.includes('Transactions')) {
            return { Items: sampleTransactions };
          }
          if (cmd.input.TableName.includes('Budgets')) {
            return { Items: sampleBudgets };
          }
          return { Items: [] };
        },
      };

      const analytics = await getAnalytics('user-1', '2026-10', mockClient);

      assert.equal(analytics.totalIncomeInPaise, 10000000);
      assert.equal(analytics.totalExpenseInPaise, 4000000);
      assert.equal(analytics.netBalanceInPaise, 6000000);
      // Savings rate: (10,000,000 - 4,000,000) / 10,000,000 = 60%
      assert.equal(analytics.savingsRate, 60);

      const foodBreakdown = analytics.categoryBreakdown.find((c) => c.category === 'Food');
      assert.ok(foodBreakdown);
      assert.equal(foodBreakdown.spentInPaise, 3000000);
      assert.equal(foodBreakdown.budgetInPaise, 3500000);
      assert.equal(foodBreakdown.remainingInPaise, 500000);
      assert.equal(foodBreakdown.isOverBudget, false);
    });
  });

  describe('Handler & Security Gateway', () => {
    it('returns healthy status on /health without auth', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/health',
      };
      const response = await handler(event, {});
      assert.equal(response.statusCode, 200);
      const data = JSON.parse(response.body);
      assert.equal(data.status, 'healthy');
    });

    it('returns 401 Unauthorized when request lacks Cognito authorizer claims', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/transactions',
        requestContext: {},
      };
      const response = await handler(event, {});
      assert.equal(response.statusCode, 401);
      const data = JSON.parse(response.body);
      assert.equal(data.error, 'Unauthorized');
    });

    it('scopes transactions to Cognito sub when authenticated', async () => {
      const calls = [];
      const mockClient = {
        send: async (cmd) => {
          calls.push(cmd);
          return { Items: [] };
        },
      };

      const event = {
        httpMethod: 'GET',
        path: '/transactions',
        requestContext: {
          authorizer: {
            claims: {
              sub: 'cognito-user-999',
            },
          },
        },
      };

      const response = await handler(event, {}, mockClient);
      assert.equal(response.statusCode, 200);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].input.ExpressionAttributeValues[':uid'], 'cognito-user-999');
    });
  });
});
