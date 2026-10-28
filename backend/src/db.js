import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-south-1';

const client = new DynamoDBClient({ region: REGION });

export const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

export const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE || 'SpendWiseTransactions';
export const BUDGETS_TABLE = process.env.BUDGETS_TABLE || 'SpendWiseBudgets';
