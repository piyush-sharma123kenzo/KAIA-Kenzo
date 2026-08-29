import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right', // left, right
  width = 'max-w-md',
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

  // Lock scroll
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

  const positionClasses = {
    left: 'left-0 translate-x-0',
    right: 'right-0 translate-x-0',
  };

  const activePosition = positionClasses[position] || positionClasses.right;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-brand-dark/50 backdrop-blur-sm transition-opacity duration-300"
      />
      
      {/* Drawer viewport */}
      <div className={`absolute top-0 bottom-0 ${width} w-full bg-white shadow-premium border-l border-brand-gray-200 z-10 flex flex-col transition-transform duration-300 ${activePosition} ${className}`}>
        
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-left">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Drawer;
