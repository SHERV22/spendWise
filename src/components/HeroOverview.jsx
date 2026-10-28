import React from 'react';
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
  const savingsRate = analytics?.savingsRate || 0;
  const isPositive = netBalance >= 0;

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
                <ShieldCheck size={28} className="portrait-icon" />
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
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Savings Rate</span>
              <div className="stat-icon-circle icon-rate">
                <Percent size={16} />
              </div>
            </div>
            <div className="stat-value text-ink">
              {savingsRate}%
            </div>
            <div className="stat-progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, savingsRate))}%`,
                  backgroundColor: savingsRate >= 20 ? 'var(--status-green)' : 'var(--signal-orange)',
                }}
              />
            </div>
            <div className="stat-footer-text">
              {savingsRate >= 20 ? 'Target achieved (≥ 20%)' : 'Below 20% savings benchmark'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
