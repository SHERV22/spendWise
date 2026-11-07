import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Plus,
  AlertCircle,
  Calendar,
  ShieldCheck,
  IndianRupee,
  Pencil,
  X,
} from 'lucide-react';
import { formatINR, formatMonthName, getCurrentMonthString } from '../services/formatters.js';
import { isCloudModeActive } from '../services/api.js';

export default function HeroOverview({
  analytics,
  onOpenAddModal,
  onOpenSettings,
  onOpenAuthModal,
  user,
}) {
  const cloudActive = isCloudModeActive();
  const currentMonthStr = analytics?.month || getCurrentMonthString();
  const monthLabel = formatMonthName(currentMonthStr);

  const netBalance = analytics?.netBalanceInPaise || 0;
  const totalIncome = analytics?.totalIncomeInPaise || 0;
  const totalExpense = analytics?.totalExpenseInPaise || 0;
  const autoSavingsRate = analytics?.savingsRate || 0;
  const isPositive = netBalance >= 0;

  const [savingsConfig, setSavingsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise_savings_config');
      return saved ? JSON.parse(saved) : { isCustom: false, customRate: '', targetBenchmark: 20 };
    } catch {
      return { isCustom: false, customRate: '', targetBenchmark: 20 };
    }
  });

  const [savingsModalOpen, setSavingsModalOpen] = useState(false);
  const [tempIsCustom, setTempIsCustom] = useState(false);
  const [tempCustomRate, setTempCustomRate] = useState('');
  const [tempTarget, setTempTarget] = useState('20');

  const displayedRate = savingsConfig.isCustom && savingsConfig.customRate !== ''
    ? Number(savingsConfig.customRate)
    : autoSavingsRate;
  const targetRate = Number(savingsConfig.targetBenchmark) || 20;

  const handleOpenSavingsModal = () => {
    setTempIsCustom(savingsConfig.isCustom);
    setTempCustomRate(savingsConfig.customRate ?? '');
    setTempTarget(String(savingsConfig.targetBenchmark || 20));
    setSavingsModalOpen(true);
  };

  const handleSaveSavings = (e) => {
    e.preventDefault();
    const newConfig = {
      isCustom: tempIsCustom,
      customRate: tempIsCustom ? tempCustomRate : '',
      targetBenchmark: Math.max(1, Math.min(100, Number(tempTarget) || 20)),
    };
    setSavingsConfig(newConfig);
    localStorage.setItem('spendwise_savings_config', JSON.stringify(newConfig));
    setSavingsModalOpen(false);
  };

  return (
    <section className="hero-section">
      {/* If connected to AWS but user not signed in yet */}
      {cloudActive && !user && (
        <div className="card-white aws-auth-callout mb-24">
          <div className="aws-callout-content">
            <span className="aws-callout-icon">
              <ShieldCheck size={22} className="text-green" />
            </span>
            <div>
              <h3 className="callout-title">AWS Serverless Connected</h3>
              <p className="text-slate text-sm">
                Sign in or register with Amazon Cognito to sync your personal transactions and budgets directly to Amazon DynamoDB.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenAuthModal}
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Demo Mode Notice Banner ONLY if AWS is not configured */}
      {!cloudActive && (
        <div className="demo-alert-banner">
          <div className="demo-alert-content">
            <span className="demo-alert-icon">
              <AlertCircle size={16} />
            </span>
            <div className="demo-alert-text">
              <strong>Demo Mode — Local Browser Storage:</strong> Data is currently stored locally in your browser sandbox, not in AWS DynamoDB.
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={onOpenSettings}
          >
            Configure AWS Cloud
          </button>
        </div>
      )}

      {/* Main Stadium Hero Container */}
      <div className="card-stadium hero-stadium">
        {/* Decorative SVG Orbital Lines from Mastercard design language */}
        <svg
          className="decorative-orbit"
          viewBox="0 0 800 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M 50,280 C 250,50 550,40 780,240"
            stroke="var(--light-signal-orange)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.35"
          />
          <path
            d="M 120,290 C 320,110 580,100 750,280"
            stroke="var(--light-signal-orange)"
            strokeWidth="0.8"
            opacity="0.25"
          />
        </svg>

        <div className="hero-header-row">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              <span>FINANCIAL OVERVIEW • {monthLabel.toUpperCase()}</span>
            </div>
            <h1 className="hero-headline">
              {user?.name ? `Hello, ${user.name}` : 'Personal Balance'}
            </h1>
            <p className="hero-subtitle">
              Tracking cash flow, category budgets, and savings rate powered by AWS Serverless.
            </p>
          </div>

          <div className="hero-header-action desktop-only">
            <div className="orbit-portrait-wrapper">
              <div className="orbit-portrait">
                <IndianRupee size={28} className="portrait-icon" />
              </div>
              <button
                type="button"
                className="satellite-cta"
                onClick={onOpenAddModal}
                title="Add new transaction"
                aria-label="Add transaction"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards Grid */}
        <div className="stat-cards-grid">
          {/* 1. Net Balance Card */}
          <div className="stat-card net-balance-card">
            <div className="stat-card-header">
              <span className="stat-label">Net Balance</span>
              <span className={`badge-pill ${isPositive ? 'badge-income' : 'badge-expense'}`}>
                {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {isPositive ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <div className="stat-value-large">
              {formatINR(netBalance)}
            </div>
            <div className="stat-footer-text">
              {isPositive ? 'Retained cash after monthly expenses' : 'Expenses exceed current income'}
            </div>
          </div>

          {/* 2. Total Income Card */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Inflow</span>
              <div className="stat-icon-circle icon-income">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="stat-value text-green">
              {formatINR(totalIncome)}
            </div>
            <div className="stat-footer-text">
              Active earnings & credits
            </div>
          </div>

          {/* 3. Total Expenses Card */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Outflow</span>
              <div className="stat-icon-circle icon-expense">
                <TrendingDown size={16} />
              </div>
            </div>
            <div className="stat-value text-red">
              {formatINR(totalExpense)}
            </div>
            <div className="stat-footer-text">
              Paid across all categories
            </div>
          </div>

          {/* 4. Savings Rate Card */}
          <div
            className="stat-card stat-card-interactive"
            onClick={handleOpenSavingsModal}
            title="Click to customize savings rate"
          >
            <div className="stat-card-header">
              <div className="stat-label-row">
                <span className="stat-label">Savings Rate</span>
                {savingsConfig.isCustom && (
                  <span className="stat-badge-custom">Custom</span>
                )}
                <button
                  type="button"
                  className="btn-stat-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenSavingsModal();
                  }}
                  title="Customize savings rate and target"
                  aria-label="Customize savings rate"
                >
                  <Pencil size={12} />
                </button>
              </div>
              <div className="stat-icon-circle icon-rate">
                <Percent size={16} />
              </div>
            </div>
            <div className="stat-value text-ink">
              {displayedRate}%
            </div>
            <div className="stat-progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, displayedRate))}%`,
                  backgroundColor: displayedRate >= targetRate ? 'var(--status-green)' : 'var(--signal-orange)',
                }}
              />
            </div>
            <div className="stat-footer-text">
              {displayedRate >= targetRate
                ? `Target achieved (≥ ${targetRate}%)`
                : `Below ${targetRate}% savings benchmark`}
            </div>
          </div>
        </div>
      </div>

      {/* Savings Rate & Target Customization Modal */}
      {savingsModalOpen && (
        <div className="modal-overlay" onClick={() => setSavingsModalOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  <span>FINANCIAL GOALS</span>
                </div>
                <h2 className="modal-title">Customize Savings Rate</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSavingsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSavings} className="modal-form mt-16">
              <div className="form-group">
                <label className="form-label" htmlFor="cfg-target-benchmark">
                  Target Benchmark Goal (%)
                </label>
                <input
                  id="cfg-target-benchmark"
                  type="number"
                  min="1"
                  max="100"
                  className="form-input"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(e.target.value)}
                  placeholder="Default: 20%"
                  required
                />
                <span className="field-hint">
                  The minimum monthly savings benchmark (default is 20%).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Calculation Mode</label>
                <div className="savings-mode-toggle" style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className={`btn-toggle-option ${!tempIsCustom ? 'active' : ''}`}
                    onClick={() => setTempIsCustom(false)}
                  >
                    Auto ({autoSavingsRate}%)
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle-option ${tempIsCustom ? 'active' : ''}`}
                    onClick={() => setTempIsCustom(true)}
                  >
                    Custom Rate
                  </button>
                </div>
              </div>

              {tempIsCustom && (
                <div className="form-group">
                  <label className="form-label" htmlFor="cfg-custom-rate">
                    Custom Savings Rate (%)
                  </label>
                  <input
                    id="cfg-custom-rate"
                    type="number"
                    min="-100"
                    max="100"
                    step="1"
                    className="form-input"
                    value={tempCustomRate}
                    onChange={(e) => setTempCustomRate(e.target.value)}
                    placeholder="e.g. 50"
                    required
                    autoFocus
                  />
                  <span className="field-hint">
                    Enter your customized savings rate to display on the dashboard.
                  </span>
                </div>
              )}

              <div className="modal-actions mt-20">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSavingsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
