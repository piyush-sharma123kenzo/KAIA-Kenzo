import React from 'react';
import { ShoppingBag, Heart, Search, ClipboardList } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  type = 'cart',
  title,
  description,
  actionText,
  onAction,
  className = '',
  ...props
}) => {
  const configs = {
    cart: {
      icon: ShoppingBag,
      title: 'Your cart is waiting for something powerful.',
      description: 'Explore brand-authorized stores and discover genuine computing components, laptops, and accessories.',
      actionText: 'Browse Marketplace',
    },
    wishlist: {
      icon: Heart,
      title: 'Save the technology you want next.',
      description: 'Curate your hardware wishlist by keeping track of direct-fulfill brand pricing alerts.',
      actionText: 'Find Products',
    },
    orders: {
      icon: ClipboardList,
      title: 'Your first KAIA order starts here.',
      description: 'Purchase items from leading brands with unified checkout and professional GST invoicing.',
      actionText: 'Shop Electronics',
    },
    search: {
      icon: Search,
      title: "We couldn't find that technology.",
      description: 'Double check spelling or adjust your filters to see more genuine components.',
      actionText: 'Reset Filters',
    },
  };

  const current = configs[type] || configs.cart;
  const Icon = current.icon;

  const isDark = className.includes('dark') || className.includes('text-white');

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl max-w-lg mx-auto ${
        className.includes('bg-') ? '' : isDark ? 'bg-slate-900/60 border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'
      } ${className}`}
      {...props}
    >
      <div className={`p-4 rounded-xl border mb-4 ${
        isDark ? 'bg-slate-800/80 border-slate-700/80 text-[#F5B400]' : 'bg-slate-100 border-slate-200 text-slate-500'
      }`}>
        <Icon className="w-8 h-8" />
      </div>
      
      <h3 className={`font-black text-sm tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {title || current.title}
      </h3>
      
      <p className={`text-xs leading-relaxed max-w-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {description || current.description}
      </p>

      {(actionText || current.actionText) && (
        <Button
          variant="primary"
          onClick={onAction}
          className="text-xs font-bold"
        >
          {actionText || current.actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
