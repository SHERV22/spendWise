import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Large conversational H2 from Mastercard design system */}
        <div className="footer-header-row">
          <div className="footer-brand-lockup">
            <div className="brand-circles" aria-hidden="true">
              <span className="circle circle-terracotta" />
              <span className="circle circle-amber" />
            </div>
            <span className="footer-brand-title">SpendWise</span>
          </div>
          <h2 className="footer-headline">
            Intelligent personal finances, scaled on AWS Serverless.
          </h2>
        </div>

        {/* 4-Column Links Grid */}
        <div className="footer-grid">
          <div className="footer-col">
            <h4 className="footer-col-header">AWS ARCHITECTURE</h4>
            <ul className="footer-links-list">
              <li><span className="link-text">Amazon S3 (SPA Hosting)</span></li>
              <li><span className="link-text">Amazon API Gateway (REST)</span></li>
              <li><span className="link-text">AWS Lambda (Node.js 20.x)</span></li>
              <li><span className="link-text">Amazon DynamoDB (NoSQL)</span></li>
              <li><span className="link-text">Amazon Cognito (JWT Auth)</span></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-header">FEATURES</h4>
            <ul className="footer-links-list">
              <li><button type="button" className="footer-btn-link" onClick={() => onNavigate('overview')}>Balance & Cash Flow</button></li>
              <li><button type="button" className="footer-btn-link" onClick={() => onNavigate('transactions')}>Transaction Ledger</button></li>
              <li><button type="button" className="footer-btn-link" onClick={() => onNavigate('budgets')}>Monthly Budgets</button></li>
              <li><button type="button" className="footer-btn-link" onClick={() => onNavigate('analytics')}>Spending Analytics</button></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-header">LAB VIVA & DOCS</h4>
            <ul className="footer-links-list">
              <li><span className="link-text">Mermaid Cloud Architecture</span></li>
              <li><span className="link-text">User Isolation by JWT sub</span></li>
              <li><span className="link-text">Integer Paise Storage Math</span></li>
              <li><span className="link-text">DynamoDB GSI DateIndex</span></li>
              <li><button type="button" className="footer-btn-link" onClick={() => onNavigate('settings')}>AWS Config & Diagnostics</button></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-header">SYSTEM & LOCALE</h4>
            <ul className="footer-links-list">
              <li><span className="link-text">Currency: Indian Rupee (₹)</span></li>
              <li><span className="link-text">Numbering: Indian Lakhs / Crores</span></li>
              <li><span className="link-text">Design: Mastercard Inspired</span></li>
              <li><span className="link-text">License: Academic / Educational</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-copy">
            © 2026 SpendWise • Built for Cloud Computing Mini-Project Viva Demonstration
          </div>

          <div className="footer-bottom-pills">
            <span className="footer-pill">
              <ShieldCheck size={13} />
              <span>Personal Data Scoped</span>
            </span>
            <span className="footer-pill">
              <span>🇮🇳 INR (₹)</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
