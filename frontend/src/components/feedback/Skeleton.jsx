import React from 'react';

// General block element shimmer
export const Skeleton = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={`animate-shimmer rounded-sm ${className}`}
      {...props}
    />
  );
};

// Reusable stat card loader
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white border border-brand-gray-200 p-6 rounded-sm space-y-4 shadow-premium ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
    </div>
  );
};

// Reusable product listings grid item loader
export const ProductSkeleton = () => {
  return (
    <div className="bg-white border border-brand-gray-200 rounded-sm p-4 space-y-4 shadow-premium">
      <Skeleton className="aspect-video w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-1/4" />
      </div>
    </div>
  );
};

// Full screen overlay blocker
export const PageLoader = ({ message = 'Connecting to KAIA Technologies...' }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-brand-light/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-brand-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-brand-accent border-t-transparent animate-spin"></div>
      </div>
      <p className="text-xs font-bold text-brand-gray-700 tracking-wider uppercase animate-pulse">{message}</p>
    </div>
  );
};

// Simple inline spin
export const ButtonLoader = () => {
  return (
    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};
