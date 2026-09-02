import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ArrowLeftRight, User, ShoppingCart } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const path = location.pathname;
  const { cartTotals } = useContext(CartContext) || {};
  const { user } = useContext(AuthContext) || {};
  const { compareCount = 0 } = useCompare() || {};

  const cartItemCount = cartTotals?.quantityCount ?? 0;

  // Don't display bottom bar on checkout or payment screens
  if (
    path.startsWith('/checkout') ||
    path.startsWith('/payment-') ||
    path.startsWith('/order-success')
  ) {
    return null;
  }

  const navItems = [
    { label: 'Home', to: '/', icon: Home, exact: true },
    { label: 'Categories', to: '/categories', icon: Grid },
    { label: 'Compare', to: '/compare', icon: ArrowLeftRight, badge: compareCount },
    { label: user ? 'Account' : 'Sign In', to: user ? '/account' : '/login', icon: User },
    { label: 'Cart', to: '/cart', icon: ShoppingCart, badge: cartItemCount },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-slate-400 py-1.5 px-3 select-none shadow-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? path === item.to
            : path.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full px-1 min-w-[15px] h-[15px] flex items-center justify-center leading-none shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
