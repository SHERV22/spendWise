import { listTransactions } from './transactions.js';
import { listBudgets } from './budgets.js';

export async function getAnalytics(userId, targetMonth = null, client) {
  const currentMonth =
    targetMonth || new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  // Fetch all transactions for this user
  const allTransactions = await listTransactions(userId, { limit: 500 }, client);

  // Fetch all budgets for this month
  const budgets = await listBudgets(userId, currentMonth, client);
  const budgetMap = new Map();
  budgets.forEach((b) => {
    budgetMap.set(b.category, b.amount);
  });

  // Filter transactions for target month
  const monthTransactions = allTransactions.filter(
    (t) => t.transactionDate && t.transactionDate.startsWith(currentMonth)
  );

  let totalIncomeInPaise = 0;
  let totalExpenseInPaise = 0;
  const categorySpending = {};

  for (const t of monthTransactions) {
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
      ? Math.max(
          -100,
          Math.min(
            100,
            Math.round(((totalIncomeInPaise - totalExpenseInPaise) / totalIncomeInPaise) * 1000) / 10
          )
        )
      : 0;

  // Build category breakdown
  const categoryBreakdown = Object.entries(categorySpending).map(([category, spentInPaise]) => {
    const budgetInPaise = budgetMap.get(category) || 0;
    const percentageOfExpense =
      totalExpenseInPaise > 0
        ? Math.round((spentInPaise / totalExpenseInPaise) * 100)
        : 0;
    const percentageUsed =
      budgetInPaise > 0
        ? Math.round((spentInPaise / budgetInPaise) * 100)
        : 0;

    return {
      category,
      spentInPaise,
      budgetInPaise,
      remainingInPaise: Math.max(0, budgetInPaise - spentInPaise),
      percentageOfExpense,
      percentageUsed,
      isOverBudget: budgetInPaise > 0 && spentInPaise > budgetInPaise,
    };
  });

  // Sort categories by highest spent first
  categoryBreakdown.sort((a, b) => b.spentInPaise - a.spentInPaise);

  // Calculate 6-month trend (income vs expense)
  const monthlyTrendMap = {};
  const dateObj = new Date(currentMonth + '-01T00:00:00Z');

  for (let i = 5; i >= 0; i--) {
    const d = new Date(dateObj.getFullYear(), dateObj.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    monthlyTrendMap[key] = {
      month: key,
      label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      incomeInPaise: 0,
      expenseInPaise: 0,
    };
  }

  for (const t of allTransactions) {
    const m = t.transactionDate ? t.transactionDate.slice(0, 7) : null;
    if (m && monthlyTrendMap[m]) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        monthlyTrendMap[m].incomeInPaise += amt;
      } else if (t.type === 'expense') {
        monthlyTrendMap[m].expenseInPaise += amt;
      }
    }
  }

  const monthlyTrend = Object.values(monthlyTrendMap);

  // Top expenses
  const topExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 5);

  return {
    month: currentMonth,
    totalIncomeInPaise,
    totalExpenseInPaise,
    netBalanceInPaise,
    savingsRate,
    transactionCount: monthTransactions.length,
    categoryBreakdown,
    monthlyTrend,
    topExpenses,
  };
}
