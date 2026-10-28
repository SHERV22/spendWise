import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';
import { CATEGORIES, paiseToRupees } from '../services/formatters.js';

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount ? paiseToRupees(initialData.amount).toString() : '');
      setCategory(initialData.category || 'Food');
      setDescription(initialData.description || '');
      setTransactionDate(initialData.transactionDate || new Date().toISOString().slice(0, 10));
    } else {
      setType('expense');
      setAmount('');
      setCategory('Food');
      setDescription('');
      setTransactionDate(new Date().toISOString().slice(0, 10));
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) {
      errs.amount = 'Please enter a valid amount greater than ₹0';
    }
    if (!description || description.trim().length === 0) {
      errs.description = 'Description is required';
    } else if (description.trim().length > 250) {
      errs.description = 'Description must be under 250 characters';
    }
    if (!transactionDate) {
      errs.transactionDate = 'Date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      type,
      amount: Number(amount),
      category,
      description: description.trim(),
      transactionDate,
    });
  };

  const quickAmounts = [100, 500, 1000, 2500, 5000];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>{initialData ? 'EDIT ENTRY' : 'NEW TRANSACTION'}</span>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Type Toggle Pills */}
          <div className="type-toggle-container">
            <button
              type="button"
              className={`type-pill ${type === 'expense' ? 'active-expense' : ''}`}
              onClick={() => {
                setType('expense');
                if (category === 'Salary') setCategory('Food');
              }}
            >
              <ArrowDownRight size={16} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              className={`type-pill ${type === 'income' ? 'active-income' : ''}`}
              onClick={() => {
                setType('income');
                if (category === 'Food') setCategory('Salary');
              }}
            >
              <ArrowUpRight size={16} />
              <span>Income</span>
            </button>
          </div>

          {/* Amount Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="tx-amount">
              Amount (₹ INR)
            </label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={`form-input amount-input ${errors.amount ? 'input-error' : ''}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            {errors.amount && <span className="field-error">{errors.amount}</span>}

            {/* Quick Amount Chips */}
            <div className="quick-amount-chips">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="amount-chip"
                  onClick={() => setAmount(q.toString())}
                >
                  +₹{q}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="form-group">
            <label className="form-label" htmlFor="tx-category">
              Category
            </label>
            <select
              id="tx-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="tx-desc">
              Description / Payee
            </label>
            <input
              id="tx-desc"
              type="text"
              placeholder="e.g. Swiggy food delivery, Metro recharge, AWS bill"
              className={`form-input ${errors.description ? 'input-error' : ''}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={250}
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          {/* Date Picker */}
          <div className="form-group">
            <label className="form-label" htmlFor="tx-date">
              Transaction Date
            </label>
            <input
              id="tx-date"
              type="date"
              className={`form-input ${errors.transactionDate ? 'input-error' : ''}`}
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
            {errors.transactionDate && <span className="field-error">{errors.transactionDate}</span>}
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Transaction' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
