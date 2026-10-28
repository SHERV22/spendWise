// SpendWise API Service
// Manages requests to AWS API Gateway in Cloud Mode or Local Storage in Demo Mode.
// Maintains a strict boundary: AWS mode NEVER silently falls back to mock data on network errors.

import { getAwsConfig, isAwsConfigured, getAuthToken, getCurrentUser } from './auth.js';
import {
  loadDemoTransactions,
  saveDemoTransactions,
  loadDemoBudgets,
  saveDemoBudgets,
} from './mockData.js';
import { getCurrentMonthString } from './formatters.js';

export function isCloudModeActive() {
  return isAwsConfigured();
}

// -------------------------------------------------------------
// Live AWS API Gateway Client
// -------------------------------------------------------------
async function callAwsApi(path, options = {}) {
  const { apiEndpoint } = getAwsConfig();
  if (!apiEndpoint) {
    throw new Error('API Gateway endpoint is not configured in Settings.');
  }

  const token = getAuthToken();
  const url = `${apiEndpoint.replace(/\/+$/, '')}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP error ${response.status}`);
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

// -------------------------------------------------------------
// Transactions API
// -------------------------------------------------------------

export async function fetchTransactions(filters = {}) {
  if (isCloudModeActive()) {
    const token = getAuthToken();
    if (!token) return [];
    const query = new URLSearchParams();
    if (filters.category) query.set('category', filters.category);
    if (filters.type) query.set('type', filters.type);
    if (filters.startDate) query.set('startDate', filters.startDate);
    if (filters.endDate) query.set('endDate', filters.endDate);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await callAwsApi(`/transactions${queryString}`, { method: 'GET' });
    return res.data || [];
  }

  // Demo Mode
  const all = loadDemoTransactions();
  return all.filter((t) => {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.type && t.type !== filters.type) return false;
    if (filters.startDate && t.transactionDate < filters.startDate) return false;
    if (filters.endDate && t.transactionDate > filters.endDate) return false;
    return true;
  }).sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
}

export async function createTransaction(payload) {
  if (isCloudModeActive()) {
    const res = await callAwsApi('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  // Demo Mode
  const current = loadDemoTransactions();
  const newTx = {
    id: `tx-demo-${Date.now()}`,
    userId: 'demo-student-user',
    type: payload.type,
    amount: Math.round(Number(payload.amount) * 100),
    category: payload.category,
    description: payload.description.trim(),
    transactionDate: payload.transactionDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  current.unshift(newTx);
  saveDemoTransactions(current);
  return newTx;
}

export async function updateTransaction(id, payload) {
  if (isCloudModeActive()) {
    const res = await callAwsApi(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  // Demo Mode
  const current = loadDemoTransactions();
  const index = current.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('Transaction not found in demo storage');
  }

  const updated = {
    ...current[index],
    type: payload.type || current[index].type,
    amount: payload.amount !== undefined ? Math.round(Number(payload.amount) * 100) : current[index].amount,
    category: payload.category || current[index].category,
    description: payload.description !== undefined ? payload.description.trim() : current[index].description,
    transactionDate: payload.transactionDate || current[index].transactionDate,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updated;
  saveDemoTransactions(current);
  return updated;
}

export async function deleteTransaction(id) {
  if (isCloudModeActive()) {
    return await callAwsApi(`/transactions/${id}`, { method: 'DELETE' });
  }

  // Demo Mode
  const current = loadDemoTransactions();
  const filtered = current.filter((t) => t.id !== id);
  saveDemoTransactions(filtered);
  return { success: true, transactionId: id };
}

// -------------------------------------------------------------
// Budgets API
// -------------------------------------------------------------

export async function fetchBudgets(month = null) {
  const targetMonth = month || getCurrentMonthString();

  if (isCloudModeActive()) {
    const token = getAuthToken();
    if (!token) return [];
    const res = await callAwsApi(`/budgets?month=${targetMonth}`, { method: 'GET' });
    return res.data || [];
  }

  // Demo Mode
  const allBudgets = loadDemoBudgets();
  return allBudgets.filter((b) => b.month === targetMonth);
}

export async function setBudget(month, category, amountInRupees) {
  const payload = {
    month,
    category,
    amount: amountInRupees,
  };

  if (isCloudModeActive()) {
    const res = await callAwsApi('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  // Demo Mode
  const allBudgets = loadDemoBudgets();
  const amountInPaise = Math.round(Number(amountInRupees) * 100);
  const existingIdx = allBudgets.findIndex((b) => b.month === month && b.category === category);

  const budgetItem = {
    userId: 'demo-student-user',
    month,
    category,
    monthCategory: `${month}#${category}`,
    amount: amountInPaise,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    allBudgets[existingIdx] = budgetItem;
  } else {
    budgetItem.createdAt = new Date().toISOString();
    allBudgets.push(budgetItem);
  }

  saveDemoBudgets(allBudgets);
  return budgetItem;
}

export async function deleteBudget(month, category) {
  if (isCloudModeActive()) {
    return await callAwsApi(`/budgets/${month}/${encodeURIComponent(category)}`, {
      method: 'DELETE',
    });
  }

  // Demo Mode
  const allBudgets = loadDemoBudgets();
  const filtered = allBudgets.filter((b) => !(b.month === month && b.category === category));
  saveDemoBudgets(filtered);
  return { success: true };
}

// -------------------------------------------------------------
// Analytics API
// -------------------------------------------------------------

export async function fetchAnalytics(month = null) {
  const targetMonth = month || getCurrentMonthString();

  if (isCloudModeActive()) {
    const token = getAuthToken();
    if (!token) {
      return {
        month: targetMonth,
        totalIncomeInPaise: 0,
        totalExpenseInPaise: 0,
        netBalanceInPaise: 0,
        savingsRate: 0,
        transactionCount: 0,
        categoryBreakdown: [],
        monthlyTrend: [],
        topExpenses: [],
      };
    }
    const res = await callAwsApi(`/analytics?month=${targetMonth}`, { method: 'GET' });
    return res.data;
  }

  // Demo Mode - client-side aggregation mirroring Lambda logic
  const allTransactions = loadDemoTransactions();
  const allBudgets = loadDemoBudgets();

  const monthBudgets = allBudgets.filter((b) => b.month === targetMonth);
  const budgetMap = new Map();
  monthBudgets.forEach((b) => budgetMap.set(b.category, b.amount));

  const monthTx = allTransactions.filter(
    (t) => t.transactionDate && t.transactionDate.startsWith(targetMonth)
  );

  let totalIncomeInPaise = 0;
  let totalExpenseInPaise = 0;
  const categorySpending = {};

  for (const t of monthTx) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncomeInPaise += amt;
    } else if (t.type === 'expense') {
      totalExpenseInPaise += amt;
      categorySpending[t.category] = (categorySpending[t.category] || 0) + amt;
    }
  }

  const netBalanceInPaise = totalIncomeInPaise - totalExpenseInPaise;
  const savingsRate =
    totalIncomeInPaise > 0
      ? Math.max(-100, Math.min(100, Math.round(((totalIncomeInPaise - totalExpenseInPaise) / totalIncomeInPaise) * 1000) / 10))
      : 0;

  const categoryBreakdown = Object.entries(categorySpending).map(([category, spentInPaise]) => {
    const budgetInPaise = budgetMap.get(category) || 0;
    return {
      category,
      spentInPaise,
      budgetInPaise,
      remainingInPaise: Math.max(0, budgetInPaise - spentInPaise),
      percentageOfExpense: totalExpenseInPaise > 0 ? Math.round((spentInPaise / totalExpenseInPaise) * 100) : 0,
      percentageUsed: budgetInPaise > 0 ? Math.round((spentInPaise / budgetInPaise) * 100) : 0,
      isOverBudget: budgetInPaise > 0 && spentInPaise > budgetInPaise,
    };
  });
  categoryBreakdown.sort((a, b) => b.spentInPaise - a.spentInPaise);

  // 6-month trend
  const monthlyTrendMap = {};
  const dateObj = new Date(targetMonth + '-01T00:00:00Z');
  for (let i = 5; i >= 0; i--) {
    const d = new Date(dateObj.getFullYear(), dateObj.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    monthlyTrendMap[key] = {
      month: key,
      label: d.toLocaleString('en-US', { month: 'short' }),
      incomeInPaise: 0,
      expenseInPaise: 0,
    };
  }

  for (const t of allTransactions) {
    const m = t.transactionDate ? t.transactionDate.slice(0, 7) : null;
    if (m && monthlyTrendMap[m]) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') monthlyTrendMap[m].incomeInPaise += amt;
      else if (t.type === 'expense') monthlyTrendMap[m].expenseInPaise += amt;
    }
  }

  const topExpenses = monthTx
    .filter((t) => t.type === 'expense')
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 5);

  return {
    month: targetMonth,
    totalIncomeInPaise,
    totalExpenseInPaise,
    netBalanceInPaise,
    savingsRate,
    transactionCount: monthTx.length,
    categoryBreakdown,
    monthlyTrend: Object.values(monthlyTrendMap),
    topExpenses,
  };
}

// -------------------------------------------------------------
// Health Check API
// -------------------------------------------------------------
export async function testAwsHealth(endpoint) {
  const url = `${endpoint.replace(/\/+$/, '')}/health`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Health check returned status ${res.status}`);
  }
  return await res.json();
}
