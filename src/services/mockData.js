// Local Mock Data Adapter for SpendWise
// Used only when AWS Configuration (Cognito / API Gateway) is absent, or when Demo Mode is explicitly selected.
// Never pretends to be cloud-backed — clearly surfaced to users.

import { getCurrentMonthString } from './formatters.js';

const STORAGE_KEYS = {
  TRANSACTIONS: 'spendwise_demo_transactions',
  BUDGETS: 'spendwise_demo_budgets',
  APP_CONFIG: 'spendwise_app_config',
};

// Standard initial demo data set
export function getInitialDemoTransactions() {
  const currentMonth = getCurrentMonthString();
  const [year, month] = currentMonth.split('-');

  return [
    {
      id: 'tx-001',
      userId: 'demo-student-user',
      type: 'income',
      amount: 8500000, // ₹85,000.00
      category: 'Salary',
      description: 'Monthly Engineering Stipend / Salary',
      transactionDate: `${year}-${month}-01`,
      createdAt: `${year}-${month}-01T09:00:00Z`,
      updatedAt: `${year}-${month}-01T09:00:00Z`,
    },
    {
      id: 'tx-002',
      userId: 'demo-student-user',
      type: 'income',
      amount: 1850000, // ₹18,500.00
      category: 'Investment',
      description: 'Freelance Cloud Architecture Project',
      transactionDate: `${year}-${month}-04`,
      createdAt: `${year}-${month}-04T14:30:00Z`,
      updatedAt: `${year}-${month}-04T14:30:00Z`,
    },
    {
      id: 'tx-003',
      userId: 'demo-student-user',
      type: 'expense',
      amount: 2200000, // ₹22,000.00
      category: 'Bills',
      description: 'Apartment Monthly Rent & Maintenance',
      transactionDate: `${year}-${month}-02`,
      createdAt: `${year}-${month}-02T10:15:00Z`,
      updatedAt: `${year}-${month}-02T10:15:00Z`,
    },
    {
      id: 'tx-004',
      userId: 'demo-student-user',
      type: 'expense',
      amount: 645000, // ₹6,450.00
      category: 'Food',
      description: 'Monthly Supermarket & Grocery Basket',
      transactionDate: `${year}-${month}-06`,
      createdAt: `${year}-${month}-06T18:45:00Z`,
      updatedAt: `${year}-${month}-06T18:45:00Z`,
    },
    {
      id: 'tx-005',
      userId: 'demo-student-user',
      type: 'expense',
      amount: 280000, // ₹2,800.00
      category: 'Bills',
      description: 'Electricity & High-speed Fiber Broadband',
      transactionDate: `${year}-${month}-07`,
      createdAt: `${year}-${month}-07T11:20:00Z`,
      updatedAt: `${year}-${month}-07T11:20:00Z`,
    },
    {
      id: 'tx-006',
      userId: 'demo-student-user',
      type: 'expense',
      amount: 385000, // ₹3,850.00
      category: 'Education',
      description: 'AWS Certified Solutions Architect Exam Voucher',
      transactionDate: `${year}-${month}-12`,
      createdAt: `${year}-${month}-12T16:00:00Z`,
      updatedAt: `${year}-${month}-12T16:00:00Z`,
    },
    {
      id: 'tx-007',
      userId: 'demo-student-user',
      type: 'expense',
      amount: 320000, // ₹3,200.00
      category: 'Transport',
      description: 'Metro Smart Card Recharge & Cabs',
      transactionDate: `${year}-${month}-15`,
      createdAt: `${year}-${month}-15T09:30:00Z`,
      updatedAt: `${year}-${month}-15T09:30:00Z`,
    },
    {
      id: 'tx-008',
      userId: 'demo-student-user',
      type: 'expense',
      amount: 295000, // ₹2,950.00
      category: 'Food',
      description: 'Weekend Dining with College Friends',
      transactionDate: `${year}-${month}-18`,
      createdAt: `${year}-${month}-18T21:00:00Z`,
      updatedAt: `${year}-${month}-18T21:00:00Z`,
    },
    {
      id: 'tx-009',
      userId: 'demo-student-user',
      type: 'expense',
      amount: 450000, // ₹4,500.00
      category: 'Shopping',
      description: 'Ergonomic Desk Accessories & Headphones',
      transactionDate: `${year}-${month}-21`,
      createdAt: `${year}-${month}-21T15:20:00Z`,
      updatedAt: `${year}-${month}-21T15:20:00Z`,
    },
    {
      id: 'tx-010',
      userId: 'demo-student-user',
      type: 'expense',
      amount: 199900, // ₹1,999.00
      category: 'Health',
      description: 'Gym Subscription & Health Supplements',
      transactionDate: `${year}-${month}-24`,
      createdAt: `${year}-${month}-24T08:00:00Z`,
      updatedAt: `${year}-${month}-24T08:00:00Z`,
    },
  ];
}

export function getInitialDemoBudgets() {
  const currentMonth = getCurrentMonthString();
  return [
    {
      userId: 'demo-student-user',
      month: currentMonth,
      category: 'Food',
      monthCategory: `${currentMonth}#Food`,
      amount: 1200000, // ₹12,000.00
    },
    {
      userId: 'demo-student-user',
      month: currentMonth,
      category: 'Bills',
      monthCategory: `${currentMonth}#Bills`,
      amount: 2600000, // ₹26,000.00
    },
    {
      userId: 'demo-student-user',
      month: currentMonth,
      category: 'Transport',
      monthCategory: `${currentMonth}#Transport`,
      amount: 500000, // ₹5,000.00
    },
    {
      userId: 'demo-student-user',
      month: currentMonth,
      category: 'Education',
      monthCategory: `${currentMonth}#Education`,
      amount: 600000, // ₹6,000.00
    },
    {
      userId: 'demo-student-user',
      month: currentMonth,
      category: 'Shopping',
      monthCategory: `${currentMonth}#Shopping`,
      amount: 800000, // ₹8,000.00
    },
    {
      userId: 'demo-student-user',
      month: currentMonth,
      category: 'Health',
      monthCategory: `${currentMonth}#Health`,
      amount: 300000, // ₹3,000.00
    },
  ];
}

// Storage helpers
export function loadDemoTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      const initial = getInitialDemoTransactions();
      saveDemoTransactions(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialDemoTransactions();
  }
}

export function saveDemoTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save demo transactions to localStorage', e);
  }
}

export function loadDemoBudgets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!raw) {
      const initial = getInitialDemoBudgets();
      saveDemoBudgets(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialDemoBudgets();
  }
}

export function saveDemoBudgets(budgets) {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (e) {
    console.error('Failed to save demo budgets to localStorage', e);
  }
}

export function resetDemoData() {
  const initialTx = getInitialDemoTransactions();
  const initialBudgets = getInitialDemoBudgets();
  saveDemoTransactions(initialTx);
  saveDemoBudgets(initialBudgets);
  return { transactions: initialTx, budgets: initialBudgets };
}

export function clearDemoData() {
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.BUDGETS);
}
