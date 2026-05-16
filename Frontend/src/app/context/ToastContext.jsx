import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const ToastContext = createContext();

let toastId = 0;

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: 'bg-emerald-600',
  error: 'bg-destructive',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info', duration = 3000) => {
    addToast(message, type, duration);
  }, [addToast]);

  toast.success = (msg, dur) => addToast(msg, 'success', dur ?? 3000);
  toast.error = (msg, dur) => addToast(msg, 'error', dur ?? 4000);
  toast.warning = (msg, dur) => addToast(msg, 'warning', dur ?? 3500);
  toast.info = (msg, dur) => addToast(msg, 'info', dur ?? 3000);

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white min-w-[280px] max-w-[400px] animate-slide-in ${COLORS[t.type] || COLORS.info}`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1 text-sm font-medium">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 hover:opacity-70 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
