import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

// General Modal Component
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // sm, md, lg, xl
  className = '',
  ...props
}) => {
  // Capture escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const activeSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-brand-dark/50 backdrop-blur-sm transition-opacity"
      />
      
      {/* Modal Card */}
      <div
        className={`bg-white w-full ${activeSize} border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden relative z-10 transition-transform duration-300 scale-100 ${className}`}
        {...props}
      >
        {/* Header */}
        <div className="bg-brand-gray-50 px-6 py-4 border-b border-brand-gray-200 flex justify-between items-center text-left">
          {title && <h3 className="font-extrabold text-sm text-brand-gray-900 uppercase tracking-tight">{title}</h3>}
          <button
            onClick={onClose}
            className="text-brand-gray-400 hover:text-brand-gray-700 focus:outline-none"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-left">
          {children}
        </div>
      </div>
    </div>
  );
};

// Simplified Action Modal Dialog
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action will modify marketplace database settings.',
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  variant = 'danger', // danger, success, primary
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={title}>
      <div className="space-y-6 text-center">
        <div className="p-3 bg-orange-50 border border-orange-200 text-orange-650 rounded-sm w-12 h-12 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        
        <p className="text-xs text-brand-gray-600 leading-relaxed">
          {message}
        </p>

        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 text-xs"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1 text-xs"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
