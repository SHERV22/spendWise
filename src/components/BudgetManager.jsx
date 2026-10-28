import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Edit2,
  Trash2,
  Sparkles,
  Utensils,
  Car,
  ShoppingBag,
  GraduationCap,
  Zap,
  HeartPulse,
  Film,
  Briefcase,
  TrendingUp,
  MoreHorizontal,
} from 'lucide-react';
import {
  formatINR,
  formatMonthName,
  getCurrentMonthString,
  CATEGORIES,
  CATEGORY_MAP,
  paiseToRupees,
} from '../services/formatters.js';

const ICON_MAP = {
  Utensils,
  Car,
  ShoppingBag,
  GraduationCap,
  Zap,
  HeartPulse,
  Film,
  Briefcase,
  TrendingUp,
  MoreHorizontal,
};

export default function BudgetManager({
  budgets = [],
  transactions = [],
  selectedMonth,
  onMonthChange,
  onSaveBudget,
  onDeleteBudget,
  isLoading = false,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(CATEGORIES[0].id);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [error, setError] = useState('');

  // Calculate spent amounts for the selected month per category
  const currentMonthTx = transactions.filter(
    (t) => t.type === 'expense' && t.transactionDate?.startsWith(selectedMonth)
  );

  const spentByCategory = {};
  let totalSpentInMonth = 0;

  for (const t of currentMonthTx) {
    const amt = t.amount || 0;
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + amt;
    totalSpentInMonth += amt;
  }

  // Map budgets to categories
  const budgetMap = new Map();
  let totalAllocatedBudget = 0;

  budgets.forEach((b) => {
    budgetMap.set(b.category, b.amount);
    totalAllocatedBudget += b.amount || 0;
  });

  const handleOpenModal = (catId = null, currentPaise = 0) => {
    setEditingCategory(catId || CATEGORIES[0].id);
    setBudgetAmount(currentPaise > 0 ? (currentPaise / 100).toString() : '');
    setError('');
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const num = Number(budgetAmount);
    if (!budgetAmount || isNaN(num) || num <= 0) {
      setError('Please specify a positive budget amount in ₹');
      return;
    }
    onSaveBudget(selectedMonth, editingCategory, num);
    setModalOpen(false);
  };

  // Quick auto-allocate standard student budget
  const handleAutoAllocate = () => {
    const presets = [
      { category: 'Food', amount: 12000 },
      { category: 'Bills', amount: 25000 },
      { category: 'Transport', amount: 5000 },
      { category: 'Education', amount: 6000 },
      { category: 'Shopping', amount: 8000 },
      { category: 'Health', amount: 3000 },
    ];
    presets.forEach((p) => {
      onSaveBudget(selectedMonth, p.category, p.amount);
    });
  };

  const budgetUsagePercent =
    totalAllocatedBudget > 0
      ? Math.round((totalSpentInMonth / totalAllocatedBudget) * 100)
      : 0;

  return (
    <section className="budgets-section">
      {/* Header Row */}
      <div className="section-header-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>BUDGET & SPENDING TARGETS</span>
          </div>
          <h2>Monthly Category Limits</h2>
        </div>

        {/* Month Selector & Action */}
        <div className="header-actions">
          <div className="month-picker-pill">
            <Calendar size={15} />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="month-picker-input"
              aria-label="Select budget month"
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            <Plus size={16} />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Overview Health Card */}
      <div className="card-white budget-summary-card">
        <div className="budget-summary-header">
          <div>
            <span className="stat-label">Total Monthly Allocation</span>
            <div className="stat-value text-ink">
              {formatINR(totalAllocatedBudget)}
            </div>
          </div>
          <div className="text-right">
            <span className="stat-label">Spent in {formatMonthName(selectedMonth)}</span>
            <div className={`stat-value ${totalSpentInMonth > totalAllocatedBudget && totalAllocatedBudget > 0 ? 'text-red' : 'text-green'}`}>
              {formatINR(totalSpentInMonth)}
            </div>
          </div>
        </div>

        {/* Main Budget Bar */}
        <div className="budget-overall-bar-wrapper">
          <div className="budget-overall-bar">
            <div
              className="budget-overall-fill"
              style={{
                width: `${Math.min(100, budgetUsagePercent)}%`,
                backgroundColor:
                  budgetUsagePercent >= 100
                    ? 'var(--status-red)'
                    : budgetUsagePercent >= 80
                    ? 'var(--status-amber)'
                    : 'var(--status-green)',
              }}
            />
          </div>
          <div className="budget-bar-labels">
            <span>{budgetUsagePercent}% of total budget utilized</span>
            <span>
              {totalAllocatedBudget - totalSpentInMonth >= 0
                ? `${formatINR(totalAllocatedBudget - totalSpentInMonth)} remaining`
                : `${formatINR(Math.abs(totalAllocatedBudget - totalSpentInMonth))} over budget`}
            </span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="card-white state-empty">
          <div className="empty-circle-mask">
            <Wallet size={28} />
          </div>
          <h3>No Budgets Set for {formatMonthName(selectedMonth)}</h3>
          <p>
            Allocate spending caps to keep expenses within target thresholds and receive warnings before overspending.
          </p>
          <div className="empty-actions mt-16">
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleOpenModal()}
            >
              <Plus size={16} />
              <span>Set First Budget</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAutoAllocate}
            >
              <Sparkles size={16} />
              <span>Auto-Populate Student Plan</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="budgets-grid">
          {budgets.map((b) => {
            const catMeta = CATEGORY_MAP[b.category] || CATEGORY_MAP.Other;
            const Icon = ICON_MAP[catMeta.icon] || MoreHorizontal;
            const spent = spentByCategory[b.category] || 0;
            const budgetAmt = b.amount || 0;
            const pct = budgetAmt > 0 ? Math.round((spent / budgetAmt) * 100) : 0;
            const isOver = spent > budgetAmt;
            const isNear = pct >= 80 && !isOver;

            return (
              <div key={b.category} className="card-white budget-item-card">
                <div className="budget-item-header">
                  <div className="budget-category-info">
                    <span
                      className="category-icon-circle"
                      style={{ backgroundColor: catMeta.bg, color: catMeta.color }}
                    >
                      <Icon size={16} />
                    </span>
                    <div>
                      <h4 className="budget-cat-name">{catMeta.label}</h4>
                      <span className="budget-cap-label">Target: {formatINR(budgetAmt)}</span>
                    </div>
                  </div>

                  <div className="budget-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleOpenModal(b.category, budgetAmt)}
                      title="Edit budget"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon text-red"
                      onClick={() => onDeleteBudget(selectedMonth, b.category)}
                      title="Delete budget"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Numbers Row */}
                <div className="budget-numbers-row">
                  <div>
                    <span className="label-sm">Spent</span>
                    <div className={`amount-sm ${isOver ? 'text-red' : 'text-ink'}`}>
                      {formatINR(spent)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="label-sm">Remaining</span>
                    <div className={`amount-sm ${isOver ? 'text-red' : 'text-green'}`}>
                      {isOver ? `-${formatINR(spent - budgetAmt)}` : formatINR(budgetAmt - spent)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="budget-progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: isOver
                        ? 'var(--status-red)'
                        : isNear
                        ? 'var(--status-amber)'
                        : 'var(--status-green)',
                    }}
                  />
                </div>

                {/* Status Indicator */}
                <div className="budget-card-footer">
                  {isOver ? (
                    <span className="badge-pill badge-expense">
                      <AlertTriangle size={12} />
                      Over budget by {pct - 100}%
                    </span>
                  ) : isNear ? (
                    <span className="badge-pill badge-demo">
                      <AlertTriangle size={12} />
                      {pct}% used (near limit)
                    </span>
                  ) : (
                    <span className="badge-pill badge-income">
                      <CheckCircle2 size={12} />
                      {100 - pct}% remaining
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              <span>ALLOCATE BUDGET • {formatMonthName(selectedMonth).toUpperCase()}</span>
            </div>
            <h3>Set Category Spending Cap</h3>

            <form onSubmit={handleSave} className="modal-form mt-16">
              <div className="form-group">
                <label className="form-label" htmlFor="budget-cat">
                  Expense Category
                </label>
                <select
                  id="budget-cat"
                  className="form-select"
                  value={editingCategory}
                  onChange={(e) => setEditingCategory(e.target.value)}
                >
                  {CATEGORIES.filter((c) => c.id !== 'Salary' && c.id !== 'Investment').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="budget-limit">
                  Monthly Limit (₹ INR)
                </label>
                <div className="amount-input-wrapper">
                  <span className="currency-prefix">₹</span>
                  <input
                    id="budget-limit"
                    type="number"
                    step="100"
                    placeholder="e.g. 10000"
                    className="form-input amount-input"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    autoFocus
                  />
                </div>
                {error && <span className="field-error">{error}</span>}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
