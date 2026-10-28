import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HeroOverview from './components/HeroOverview.jsx';
import TransactionList from './components/TransactionList.jsx';
import BudgetManager from './components/BudgetManager.jsx';
import AnalyticsCharts from './components/AnalyticsCharts.jsx';
import SettingsView from './components/SettingsView.jsx';
import TransactionModal from './components/TransactionModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import Toast from './components/Toast.jsx';

import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchBudgets,
  setBudget,
  deleteBudget,
  fetchAnalytics,
  isCloudModeActive,
} from './services/api.js';
import { getCurrentUser, signOut } from './services/auth.js';
import { getCurrentMonthString } from './services/formatters.js';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [user, setUser] = useState(getCurrentUser());

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Fetch all core application data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txList, budgetList, analyticsData] = await Promise.all([
        fetchTransactions(),
        fetchBudgets(selectedMonth),
        fetchAnalytics(selectedMonth),
      ]);

      setTransactions(txList || []);
      setBudgets(budgetList || []);
      setAnalytics(analyticsData || null);
    } catch (err) {
      console.error('Failed to load SpendWise data:', err);
      showToast(err.message || 'Error loading records', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, showToast]);

  // Initial load and listeners
  useEffect(() => {
    loadData();

    const handleAuthChange = (e) => {
      setUser(e.detail.user);
      loadData();
    };

    const handleConfigChange = () => {
      loadData();
    };

    window.addEventListener('spendwise:auth-changed', handleAuthChange);
    window.addEventListener('spendwise:config-changed', handleConfigChange);

    return () => {
      window.removeEventListener('spendwise:auth-changed', handleAuthChange);
      window.removeEventListener('spendwise:config-changed', handleConfigChange);
    };
  }, [loadData]);

  // -------------------------------------------------------------
  // Transaction CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveTransaction = async (formData) => {
    if (isCloudModeActive() && !user) {
      showToast('Please sign in or register with Amazon Cognito to record transactions.', 'warning');
      setAddModalOpen(false);
      setAuthModalOpen(true);
      return;
    }
    setModalLoading(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, formData);
        showToast('Transaction updated successfully!', 'success');
      } else {
        await createTransaction(formData);
        showToast('Transaction recorded successfully!', 'success');
      }
      setAddModalOpen(false);
      setEditingTransaction(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save transaction', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      showToast('Transaction deleted', 'info');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  const handleOpenAddModal = () => {
    if (isCloudModeActive() && !user) {
      showToast('Please sign in or register with Amazon Cognito to record transactions.', 'warning');
      setAuthModalOpen(true);
      return;
    }
    setEditingTransaction(null);
    setAddModalOpen(true);
  };

  const handleEditTransaction = (tx) => {
    setEditingTransaction(tx);
    setAddModalOpen(true);
  };

  // -------------------------------------------------------------
  // Budget CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveBudget = async (month, category, amountInRupees) => {
    try {
      await setBudget(month, category, amountInRupees);
      showToast(`Budget for ${category} updated to ₹${amountInRupees.toLocaleString('en-IN')}`, 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to allocate budget', 'error');
    }
  };

  const handleDeleteBudget = async (month, category) => {
    try {
      await deleteBudget(month, category);
      showToast(`Budget limit for ${category} removed`, 'info');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to remove budget', 'error');
    }
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    showToast('Signed out of SpendWise', 'info');
  };

  return (
    <div className="spendwise-app">
      {/* Floating Pill Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        user={user}
        onSignOut={handleSignOut}
      />

      {/* Main Content Body */}
      <main className="app-container">
        {activeTab === 'overview' && (
          <>
            <HeroOverview
              analytics={analytics}
              onOpenAddModal={handleOpenAddModal}
              onOpenSettings={() => setActiveTab('settings')}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              user={user}
            />

            {/* Quick Preview of Recent Transactions & Budget Health */}
            <div className="overview-split-grid mt-24">
              <TransactionList
                transactions={transactions.slice(0, 7)}
                onOpenAddModal={handleOpenAddModal}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isLoading={isLoading}
              />
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetManager
            budgets={budgets}
            transactions={transactions}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCharts
            analytics={analytics}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onDataReset={loadData}
            showToast={showToast}
          />
        )}
      </main>

      {/* Mastercard Editorial Footer */}
      <Footer onNavigate={setActiveTab} />

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
        initialData={editingTransaction}
        isLoading={modalLoading}
      />

      {/* Cognito & Demo Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(newUser) => {
          setUser(newUser);
          loadData();
        }}
        showToast={showToast}
      />

      {/* Toast Alert Pill */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
