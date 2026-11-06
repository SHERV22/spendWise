import React from 'react';
import {
  Cloud,
  Laptop,
  RotateCcw,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { resetDemoData, clearDemoData } from '../services/mockData.js';
import { isCloudModeActive } from '../services/api.js';

export default function SettingsView({ onDataReset, showToast }) {
  const cloudActive = isCloudModeActive();

  const handleResetDemo = () => {
    if (window.confirm('Reset all demo transactions and budgets to default sample data?')) {
      resetDemoData();
      onDataReset();
      showToast('Demo data restored to initial state', 'success');
    }
  };

  const handleClearDemo = () => {
    if (window.confirm('Clear all local demo transactions and budgets? This cannot be undone.')) {
      clearDemoData();
      onDataReset();
      showToast('All local demo records cleared', 'info');
    }
  };

  return (
    <section className="settings-section">
      <div className="section-header-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>INFRASTRUCTURE & PREFERENCES</span>
          </div>
          <h2>System Settings & Cloud Config</h2>
        </div>
      </div>

      {/* Architecture Mode Badge Banner */}
      <div className="card-white mode-summary-card">
        <div className="mode-summary-content">
          <div className={`mode-icon-circle ${cloudActive ? 'icon-aws' : 'icon-demo'}`}>
            {cloudActive ? <Cloud size={24} /> : <Laptop size={24} />}
          </div>
          <div>
            <h3>
              Current Mode:{' '}
              <span className={cloudActive ? 'text-green' : 'text-amber'}>
                {cloudActive ? 'AWS Cloud Connected' : 'Local Demo Sandbox'}
              </span>
            </h3>
            <p className="mt-4 text-slate">
              {cloudActive
                ? 'Your transactions and budgets are synced to Amazon DynamoDB via API Gateway and secured with Amazon Cognito JWT tokens.'
                : 'SpendWise is running in local browser storage. Transactions are isolated in your browser sandbox and will not persist to AWS until configured.'}
            </p>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Sandbox Data Management */}
        <div className="card-white settings-card">
          <div className="card-title-row">
            <Laptop size={18} />
            <h3>Local Demo Sandbox Data</h3>
          </div>
          <p className="text-slate text-sm mb-16">
            Manage pre-loaded student demo transactions and category budgets.
          </p>

          <div className="sandbox-actions-list">
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={handleResetDemo}
            >
              <RotateCcw size={15} />
              <span>Reset to Default Sample Data</span>
            </button>
            <button
              type="button"
              className="btn-ghost w-full text-red"
              onClick={handleClearDemo}
            >
              <Trash2 size={15} />
              <span>Clear All Local Demo Data</span>
            </button>
          </div>
        </div>

        {/* Privacy & Educational Disclaimer */}
        <div className="card-white settings-card privacy-card">
          <div className="card-title-row">
            <ShieldAlert size={18} className="text-signal-orange" />
            <h3>Data & Security Notice</h3>
          </div>
          <p className="text-slate text-sm">
            SpendWise is an educational cloud computing mini-project demonstrating AWS serverless architecture.
          </p>
          <ul className="security-notice-list text-sm mt-12">
            <li>• Never enter real bank account numbers, passwords, debit/credit card PINs, or confidential financial credentials.</li>
            <li>• In AWS mode, all records are partitioned in DynamoDB strictly by Cognito verified user ID (JWT sub).</li>
            <li>• Monetary values are stored as integers in Indian paise to prevent floating-point rounding inaccuracies.</li>
          </ul>
        </div>
      </div>

      {/* Cloud Architecture Reference Table for Viva */}
      <div className="card-white architecture-viva-card mt-24">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          <span>VIVA DEMONSTRATION REFERENCE</span>
        </div>
        <h3>AWS Serverless Services Architecture</h3>
        <p className="text-slate text-sm mb-16">
          How each AWS component is utilized in this architecture:
        </p>

        <div className="table-responsive">
          <table className="architecture-table">
            <thead>
              <tr>
                <th>AWS Service</th>
                <th>Role in SpendWise</th>
                <th>Configuration & Implementation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Amazon S3</strong></td>
                <td>Frontend Hosting</td>
                <td>Static Website Hosting for compiled Vite React SPA bundle; route fallback to <code>index.html</code>.</td>
              </tr>
              <tr>
                <td><strong>Amazon API Gateway</strong></td>
                <td>REST API Entrypoint</td>
                <td>Routing endpoints (<code>/transactions</code>, <code>/budgets</code>, <code>/analytics</code>, <code>/health</code>) with CORS and Cognito Authorizer.</td>
              </tr>
              <tr>
                <td><strong>AWS Lambda</strong></td>
                <td>Serverless Compute</td>
                <td>Node.js 20.x runtime using AWS SDK v3. Extracts validated claims from Cognito JWT and enforces user-scoped queries.</td>
              </tr>
              <tr>
                <td><strong>Amazon DynamoDB</strong></td>
                <td>Persistent NoSQL Storage</td>
                <td>Pay-Per-Request on-demand tables (<code>SpendWiseTransactions</code> with <code>DateIndex</code> GSI, <code>SpendWiseBudgets</code>).</td>
              </tr>
              <tr>
                <td><strong>Amazon Cognito</strong></td>
                <td>User Authentication</td>
                <td>User Pool with email verification and token-based OAuth2/OIDC JWT authentication without server-side session state.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
