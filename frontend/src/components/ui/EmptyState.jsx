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

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 bg-white border border-brand-gray-200 rounded-sm shadow-premium max-w-lg mx-auto ${className}`}
      {...props}
    >
      <div className="p-4 bg-brand-light border border-brand-gray-200 rounded-sm mb-4">
        <Icon className="w-8 h-8 text-brand-gray-500" />
      </div>
      
      <h3 className="font-extrabold text-brand-gray-900 text-sm tracking-tight mb-2">
        {title || current.title}
      </h3>
      
      <p className="text-xs text-brand-gray-550 leading-relaxed max-w-sm mb-6">
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
