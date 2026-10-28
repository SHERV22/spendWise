// Formatters and constants for SpendWise Personal Finance Tracker

export const CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', icon: 'Utensils', color: '#E06D53', bg: '#FDF2E9' },
  { id: 'Transport', label: 'Transport & Fuel', icon: 'Car', color: '#3860BE', bg: '#EFF4FE' },
  { id: 'Shopping', label: 'Shopping & Retail', icon: 'ShoppingBag', color: '#8E44AD', bg: '#F5EEF8' },
  { id: 'Education', label: 'Education & Courses', icon: 'GraduationCap', color: '#16A085', bg: '#E8F8F5' },
  { id: 'Bills', label: 'Bills & Utilities', icon: 'Zap', color: '#CF4500', bg: '#FDF0ED' },
  { id: 'Health', label: 'Health & Fitness', icon: 'HeartPulse', color: '#27AE60', bg: '#EAFAF1' },
  { id: 'Entertainment', label: 'Entertainment & OTT', icon: 'Film', color: '#D35400', bg: '#FBEEE6' },
  { id: 'Salary', label: 'Salary & Wages', icon: 'Briefcase', color: '#1E7E34', bg: '#EAF5EC' },
  { id: 'Investment', label: 'Investments & Returns', icon: 'TrendingUp', color: '#2980B9', bg: '#EBF5FB' },
  { id: 'Other', label: 'Other Miscellaneous', icon: 'MoreHorizontal', color: '#555555', bg: '#F4F4F4' },
];

export const CATEGORY_MAP = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {});

/**
 * Formats monetary amounts from integer paise into Indian Rupees (INR)
 * @param {number} paise - Amount in integer paise (e.g. 150000 = ₹1,500.00)
 * @param {boolean} showFraction - Whether to show paise decimals (.00)
 */
export function formatINR(paise, showFraction = true) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return '₹0.00';
  }
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showFraction ? 2 : 0,
    maximumFractionDigits: showFraction ? 2 : 0,
  }).format(rupees);
}

/**
 * Converts a rupee float string or number to integer paise
 */
export function rupeesToPaise(rupees) {
  const num = Number(rupees);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer paise to rupee float
 */
export function paiseToRupees(paise) {
  if (!paise) return 0;
  return Number((paise / 100).toFixed(2));
}

/**
 * Formats ISO date string to friendly readable date in Indian context
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, parseInt(month, 10) - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today - targetDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Gets the current month in 'YYYY-MM' format
 */
export function getCurrentMonthString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns formatted month label e.g. "October 2026"
 */
export function formatMonthName(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
