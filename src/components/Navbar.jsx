import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Layers,
  Receipt,
  PieChart,
  Settings,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Cloud,
  Laptop,
} from 'lucide-react';
import { isCloudModeActive } from '../services/api.js';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenAuthModal,
  user,
  onSignOut,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cloudActive = isCloudModeActive();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings & Cloud', icon: Settings },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-wrapper">
      <div className="nav-floating-pill">
        {/* Brand Logo with Mastercard-inspired dual-overlapping circles */}
        <div className="nav-brand" onClick={() => handleNavClick('overview')}>
          <div className="brand-circles" aria-hidden="true">
            <span className="circle circle-terracotta" />
            <span className="circle circle-amber" />
          </div>
          <span className="brand-name">SpendWise</span>
          <span className="brand-tag">AWS Cloud</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-only" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {isActive && <span className="active-dot" />}
              </button>
            );
          })}
        </nav>

        {/* Actions & Status Pill */}
        <div className="nav-actions">
          {/* Cloud vs Demo Status Badge */}
          <button
            type="button"
            className={`mode-indicator ${cloudActive ? 'mode-cloud' : 'mode-demo'}`}
            onClick={() => handleNavClick('settings')}
            title={cloudActive ? 'Connected to AWS Serverless Backend' : 'Running in Local Demo Mode'}
          >
            {cloudActive ? (
              <>
                <Cloud size={13} />
                <span className="mode-text">AWS Live</span>
              </>
            ) : (
              <>
                <Laptop size={13} />
                <span className="mode-text">Demo Mode</span>
              </>
            )}
          </button>

          {/* Quick Add Transaction Button */}
          <button
            type="button"
            className="btn-primary btn-add-quick"
            onClick={onOpenAddModal}
            title="Record a new transaction"
          >
            <Plus size={16} />
            <span className="desktop-only">Add</span>
          </button>

          {/* Auth Menu / Button */}
          {user ? (
            <div className="user-profile-pill">
              <span className="user-avatar" title={user.email}>
                <User size={14} />
              </span>
              <span className="user-email desktop-only">{user.name || user.email.split('@')[0]}</span>
              <button
                type="button"
                className="btn-signout"
                onClick={onSignOut}
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={onOpenAuthModal}
            >
              <LogIn size={15} />
              <span className="desktop-only">Sign In</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="mobile-hamburger mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <nav className="mobile-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
