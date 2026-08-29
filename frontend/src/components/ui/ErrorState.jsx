import React from 'react';
import { AlertTriangle, WifiOff, ShieldAlert } from 'lucide-react';
import Button from './Button';

const ErrorState = ({
  type = '404',
  title,
  description,
  actionText = 'Go to Home Screen',
  onAction = () => window.location.href = '/',
  className = '',
  ...props
}) => {
  const configs = {
    404: {
      icon: ShieldAlert,
      title: 'Looks like this technology went offline.',
      description: 'The requested route or listing is unavailable. Try browsing our verified brand directory.',
    },
    connection: {
      icon: WifiOff,
      title: 'KAIA is having trouble connecting.',
      description: 'We encountered an issue communicating with our payment and order settlement servers. Please check your network connection.',
    },
    payment: {
      icon: AlertTriangle,
      title: "Your payment couldn't be completed.",
      description: 'The bank sandbox transaction was rejected or timed out. No funds have been deducted, and stock reserves are safe.',
    },
  };

  const current = configs[type] || configs['404'];
  const Icon = current.icon;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 bg-white border border-red-200 rounded-sm shadow-premium max-w-lg mx-auto ${className}`}
      {...props}
    >
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-sm mb-4">
        <Icon className="w-8 h-8" />
      </div>
      
      <h3 className="font-extrabold text-brand-gray-900 text-sm tracking-tight mb-2">
        {title || current.title}
      </h3>
      
      <p className="text-xs text-brand-gray-550 leading-relaxed max-w-sm mb-6">
        {description || current.description}
      </p>

      {actionText && (
        <Button
          variant="danger"
          onClick={onAction}
          className="text-xs font-bold"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
