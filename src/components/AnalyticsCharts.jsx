import React, { useState } from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  formatINR,
  formatMonthName,
  getCurrentMonthString,
  CATEGORY_MAP,
} from '../services/formatters.js';

export default function AnalyticsCharts({
  analytics,
  selectedMonth,
  onMonthChange,
  isLoading = false,
}) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const monthLabel = formatMonthName(selectedMonth);
  const monthlyTrend = analytics?.monthlyTrend || [];
  const categoryBreakdown = analytics?.categoryBreakdown || [];
  const topExpenses = analytics?.topExpenses || [];

  const totalIncome = analytics?.totalIncomeInPaise || 0;
  const totalExpense = analytics?.totalExpenseInPaise || 0;
  const savingsRate = analytics?.savingsRate || 0;

  // Find max value in monthly trend for SVG scaling
  const maxMonthlyVal = Math.max(
    ...monthlyTrend.map((m) => Math.max(m.incomeInPaise || 0, m.expenseInPaise || 0)),
    1000000 // at least ₹10,000 for scale
  );

  // Daily average burn rate (assuming 30-day month)
  const dailyAveragePaise = Math.round(totalExpense / 30);

  // Highest spending category
  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Donut chart calculation
  const totalCategoryPaise = categoryBreakdown.reduce((sum, c) => sum + (c.spentInPaise || 0), 0);
  let cumulativeAngle = 0;
  const slices = categoryBreakdown.map((cat, idx) => {
    const fraction = totalCategoryPaise > 0 ? cat.spentInPaise / totalCategoryPaise : 0;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    const catMeta = CATEGORY_MAP[cat.category] || CATEGORY_MAP.Other;
    return {
      ...cat,
      fraction,
      startAngle,
      endAngle: cumulativeAngle,
      color: catMeta.color,
      label: catMeta.label,
    };
  });

  // Helper to generate SVG arc path
  const createArc = (startAngle, endAngle, innerR, outerR) => {
    const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
    const sRad = toRad(startAngle);
    const eRad = toRad(endAngle - 0.01); // avoid full circle overlap glitch

    const x1 = 150 + outerR * Math.cos(sRad);
    const y1 = 150 + outerR * Math.sin(sRad);
    const x2 = 150 + outerR * Math.cos(eRad);
    const y2 = 150 + outerR * Math.sin(eRad);

    const x3 = 150 + innerR * Math.cos(eRad);
    const y3 = 150 + innerR * Math.sin(eRad);
    const x4 = 150 + innerR * Math.cos(sRad);
    const y4 = 150 + innerR * Math.sin(sRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  return (
    <section className="analytics-section">
      {/* Header Row */}
      <div className="section-header-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>INTELLIGENCE & INSIGHTS</span>
          </div>
          <h2>Financial Analytics</h2>
        </div>

        {/* Month Selector */}
        <div className="header-actions">
          <div className="month-picker-pill">
            <Calendar size={15} />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="month-picker-input"
              aria-label="Select analytics month"
            />
          </div>
        </div>
      </div>

      {/* Key Insights Highlight Row */}
      <div className="insights-cards-grid">
        <div className="card-white insight-card">
          <div className="insight-header">
            <span className="stat-label">Daily Burn Rate</span>
            <span className="insight-icon">
              <Zap size={16} />
            </span>
          </div>
          <div className="stat-value text-ink">
            {formatINR(dailyAveragePaise)}
            <span className="sub-unit">/day</span>
          </div>
          <div className="stat-footer-text">
            Average expense per day this month
          </div>
        </div>

        <div className="card-white insight-card">
          <div className="insight-header">
            <span className="stat-label">Top Expense Category</span>
            <span className="insight-icon">
              <TrendingDown size={16} />
            </span>
          </div>
          <div className="stat-value text-red">
            {topCategory ? topCategory.category : 'None'}
          </div>
          <div className="stat-footer-text">
            {topCategory
              ? `${formatINR(topCategory.spentInPaise)} (${topCategory.percentageOfExpense}% of outflow)`
              : 'No expenses recorded yet'}
          </div>
        </div>

        <div className="card-white insight-card">
          <div className="insight-header">
            <span className="stat-label">Savings Surplus</span>
            <span className="insight-icon">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="stat-value text-green">
            {savingsRate}%
          </div>
          <div className="stat-footer-text">
            {totalIncome > 0
              ? `${formatINR(totalIncome - totalExpense)} saved this month`
              : 'Add income to compute rate'}
          </div>
        </div>
      </div>

      {/* Charts Grid: 6-Month Comparison & Category Donut */}
      <div className="charts-main-grid">
        {/* 1. Month-by-Month Trend Bar Chart */}
        <div className="card-white chart-card">
          <div className="chart-header">
            <div>
              <h3>Income vs Outflow Trend</h3>
              <p className="chart-sub">6-Month historical comparison (₹ INR)</p>
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-box box-income" /> Income
              </span>
              <span className="legend-item">
                <span className="legend-box box-expense" /> Expense
              </span>
            </div>
          </div>

          <div className="svg-chart-container">
            <svg
              className="trend-bar-chart"
              viewBox="0 0 520 220"
              preserveAspectRatio="xMidYMid meet"
              aria-label="6-Month Income vs Expense Bar Chart"
            >
              {/* Horizontal Grid lines */}
              <line x1="40" y1="30" x2="500" y2="30" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="40" y1="90" x2="500" y2="90" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="40" y1="150" x2="500" y2="150" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="40" y1="180" x2="500" y2="180" stroke="var(--ink-black)" strokeWidth="1" />

              {/* Bars for each month */}
              {monthlyTrend.map((m, idx) => {
                const groupX = 60 + idx * 72;
                const chartHeight = 140;

                const incHeight = maxMonthlyVal > 0 ? (m.incomeInPaise / maxMonthlyVal) * chartHeight : 0;
                const expHeight = maxMonthlyVal > 0 ? (m.expenseInPaise / maxMonthlyVal) * chartHeight : 0;

                const incY = 180 - incHeight;
                const expY = 180 - expHeight;

                const isCurrent = m.month === selectedMonth;

                return (
                  <g
                    key={m.month}
                    className="chart-bar-group"
                    onMouseEnter={() => setHoveredBar(m)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Income Bar */}
                    <rect
                      x={groupX}
                      y={incY}
                      width="18"
                      height={Math.max(incHeight, 2)}
                      rx="4"
                      fill="var(--status-green)"
                      opacity={hoveredBar && hoveredBar.month !== m.month ? 0.4 : 0.85}
                    />

                    {/* Expense Bar */}
                    <rect
                      x={groupX + 22}
                      y={expY}
                      width="18"
                      height={Math.max(expHeight, 2)}
                      rx="4"
                      fill="var(--signal-orange)"
                      opacity={hoveredBar && hoveredBar.month !== m.month ? 0.4 : 0.9}
                    />

                    {/* Month Label */}
                    <text
                      x={groupX + 20}
                      y="202"
                      textAnchor="middle"
                      fontSize="12"
                      fontFamily="var(--font-primary)"
                      fontWeight={isCurrent ? '700' : '500'}
                      fill={isCurrent ? 'var(--ink-black)' : 'var(--slate-gray)'}
                    >
                      {m.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover tooltip for bar */}
            {hoveredBar && (
              <div className="chart-tooltip">
                <strong>{hoveredBar.label}:</strong>
                <span className="text-green">Inflow: {formatINR(hoveredBar.incomeInPaise)}</span>
                <span className="text-red">Outflow: {formatINR(hoveredBar.expenseInPaise)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Category Spending Donut Chart */}
        <div className="card-white chart-card">
          <div className="chart-header">
            <div>
              <h3>Category Allocation</h3>
              <p className="chart-sub">Share of monthly expense distribution</p>
            </div>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="state-empty py-40">
              <p>No expenses recorded in {monthLabel} to generate category breakdown.</p>
            </div>
          ) : (
            <div className="donut-chart-layout">
              <div className="donut-svg-wrapper">
                <svg
                  className="donut-svg"
                  viewBox="0 0 300 300"
                  aria-label="Category Spending Donut Chart"
                >
                  {slices.map((slice) => {
                    if (slice.fraction <= 0) return null;
                    const pathD = createArc(slice.startAngle, slice.endAngle, 65, 110);
                    const isHovered = hoveredSlice?.category === slice.category;

                    return (
                      <path
                        key={slice.category}
                        d={pathD}
                        fill={slice.color}
                        opacity={isHovered ? 1 : 0.9}
                        stroke="var(--white)"
                        strokeWidth="2"
                        className="donut-slice"
                        onMouseEnter={() => setHoveredSlice(slice)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                  {/* Center circle text */}
                  <text
                    x="150"
                    y="142"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="var(--slate-gray)"
                  >
                    TOTAL OUTFLOW
                  </text>
                  <text
                    x="150"
                    y="166"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="700"
                    fill="var(--ink-black)"
                  >
                    {formatINR(totalExpense, false)}
                  </text>
                </svg>
              </div>

              {/* Category Breakdown Legend */}
              <div className="donut-legend-list">
                {slices.slice(0, 5).map((slice) => (
                  <div
                    key={slice.category}
                    className={`legend-row ${hoveredSlice?.category === slice.category ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredSlice(slice)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  >
                    <div className="legend-row-left">
                      <span className="dot" style={{ backgroundColor: slice.color }} />
                      <span className="cat-label">{slice.label}</span>
                    </div>
                    <div className="legend-row-right">
                      <span className="cat-val">{formatINR(slice.spentInPaise)}</span>
                      <span className="cat-pct">{slice.percentageOfExpense}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Largest Transactions Table */}
      {topExpenses.length > 0 && (
        <div className="card-white top-expenses-card mt-24">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>MAJOR OUTFLOWS</span>
          </div>
          <h3>Top 5 Largest Transactions in {monthLabel}</h3>

          <div className="top-expenses-list mt-16">
            {topExpenses.map((t, i) => (
              <div key={t.id || i} className="top-expense-row">
                <div className="top-rank-badge">#{i + 1}</div>
                <div className="top-expense-info">
                  <div className="desc-title">{t.description}</div>
                  <span className="tag-sub">{t.category} • {t.transactionDate}</span>
                </div>
                <div className="stat-value text-red">
                  -{formatINR(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
