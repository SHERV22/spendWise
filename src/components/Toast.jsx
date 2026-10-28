import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={16} className="text-green" />,
    error: <AlertCircle size={16} className="text-red" />,
    warning: <AlertTriangle size={16} className="text-amber" />,
    info: <Info size={16} className="text-blue" />,
  };

  return (
    <div className={`toast-pill toast-${type}`}>
      <span className="toast-icon">{icons[type] || icons.info}</span>
      <span className="toast-text">{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification">
        <X size={14} />
      </button>
    </div>
  );
}
