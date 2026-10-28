import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Edit2,
  Trash2,
  Plus,
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
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import {
  formatINR,
  formatDate,
  CATEGORIES,
  CATEGORY_MAP,
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

export default function TransactionList({
  transactions = [],
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  isLoading = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search Filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchDesc = t.description?.toLowerCase().includes(q);
          const matchCat = t.category?.toLowerCase().includes(q);
          if (!matchDesc && !matchCat) return false;
        }

        // Type Filter
        if (selectedType !== 'all' && t.type !== selectedType) {
          return false;
        }

        // Category Filter
        if (selectedCategory !== 'all' && t.category !== selectedCategory) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
        }
        if (sortBy === 'amount-desc') {
          return (b.amount || 0) - (a.amount || 0);
        }
        if (sortBy === 'amount-asc') {
          return (a.amount || 0) - (b.amount || 0);
        }
        return 0;
      });
  }, [transactions, searchTerm, selectedType, selectedCategory, sortBy]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Description', 'Amount (INR)'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.transactionDate,
      t.type,
      t.category,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      (t.amount / 100).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SpendWise_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (filteredTransactions.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredTransactions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `SpendWise_Transactions_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="transactions-section">
      {/* Section Header */}
      <div className="section-header-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>TRANSACTION RECORDS</span>
          </div>
          <h2>Activity & Ledger</h2>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={handleExportCSV}
            title="Download CSV report"
            disabled={filteredTransactions.length === 0}
          >
            <FileSpreadsheet size={15} />
            <span className="desktop-only">Export CSV</span>
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={handleExportJSON}
            title="Export JSON payload"
            disabled={filteredTransactions.length === 0}
          >
            <FileJson size={15} />
            <span className="desktop-only">JSON</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenAddModal}
          >
            <Plus size={16} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-controls-container">
        {/* Search */}
        <div className="search-pill-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="filter-pill-group">
          {['all', 'expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              className={`filter-pill ${selectedType === t ? 'active' : ''}`}
              onClick={() => setSelectedType(t)}
            >
              {t === 'all' ? 'All Flow' : t === 'expense' ? 'Expenses' : 'Incomes'}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <select
          className="form-select filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select
          className="form-select filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort transactions"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Amount: High to Low</option>
          <option value="amount-asc">Amount: Low to High</option>
        </select>
      </div>

      {/* Transactions Table / List */}
      <div className="card-white transactions-card">
        {isLoading ? (
          <div className="state-empty">
            <div className="loading-spinner" />
            <p>Syncing transactions with database...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="state-empty">
            <div className="empty-circle-mask">
              <MoreHorizontal size={28} />
            </div>
            <h3>No Transactions Found</h3>
            <p>
              {searchTerm || selectedType !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your filters or search keywords.'
                : 'Start tracking your personal finances by adding your first transaction.'}
            </p>
            <button
              type="button"
              className="btn-primary mt-16"
              onClick={onOpenAddModal}
            >
              <Plus size={16} />
              <span>Record Transaction</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const catMeta = CATEGORY_MAP[tx.category] || CATEGORY_MAP.Other;
                  const Icon = ICON_MAP[catMeta.icon] || MoreHorizontal;
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="transaction-row">
                      {/* Category Badge */}
                      <td className="td-category">
                        <div className="category-cell">
                          <span
                            className="category-icon-circle"
                            style={{ backgroundColor: catMeta.bg, color: catMeta.color }}
                          >
                            <Icon size={16} />
                          </span>
                          <span className="category-name">{catMeta.label}</span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="td-desc">
                        <div className="desc-title">{tx.description}</div>
                        <div className="desc-sub mobile-only">{formatDate(tx.transactionDate)}</div>
                      </td>

                      {/* Date */}
                      <td className="td-date desktop-only">
                        <span className="date-tag">{formatDate(tx.transactionDate)}</span>
                      </td>

                      {/* Amount */}
                      <td className="td-amount text-right">
                        <span className={`amount-value ${isIncome ? 'text-green' : 'text-ink'}`}>
                          {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="td-actions text-right">
                        <div className="actions-cell">
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => onEditTransaction(tx)}
                            title="Edit transaction"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon text-red"
                            onClick={() => setDeleteConfirmId(tx.id)}
                            title="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Counter footer */}
        {filteredTransactions.length > 0 && (
          <div className="table-footer-summary">
            <span>Showing {filteredTransactions.length} of {transactions.length} recorded items</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              <span>CONFIRM DELETION</span>
            </div>
            <h3>Delete this transaction?</h3>
            <p className="mt-8 text-slate">
              This action will remove the record from your ledger and update all monthly totals.
            </p>
            <div className="modal-actions mt-24">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Keep Record
              </button>
              <button
                type="button"
                className="btn-signal"
                onClick={() => {
                  onDeleteTransaction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
