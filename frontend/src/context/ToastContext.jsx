import React, { createContext, useState, useContext } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Alert List container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let Icon = CheckCircle;
          let iconColor = 'text-green-600';
          let borderBg = 'bg-white border-green-200 text-brand-gray-800';

          if (toast.type === 'error') {
            Icon = AlertTriangle;
            iconColor = 'text-red-650';
            borderBg = 'bg-red-50 border-red-200 text-brand-gray-900';
          } else if (toast.type === 'warning') {
            Icon = AlertCircle;
            iconColor = 'text-orange-500';
            borderBg = 'bg-orange-50 border-orange-200 text-brand-gray-900';
          } else if (toast.type === 'info') {
            Icon = Info;
            iconColor = 'text-blue-600';
            borderBg = 'bg-white border-brand-gray-200 text-brand-gray-850';
          }

          return (
            <div
              key={toast.id}
              className={`p-4 rounded-sm border shadow-premium pointer-events-auto flex items-start space-x-3 transition-all duration-300 animate-slide-in ${borderBg}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <div className="flex-1 text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-brand-gray-400 hover:text-brand-gray-600 focus:outline-none shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
