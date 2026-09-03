import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/navigation/Header';
import CheckoutHeader from '../components/navigation/CheckoutHeader';
import Footer from '../components/navigation/Footer';
import MobileBottomNav from '../components/navigation/MobileBottomNav';

const CustomerLayout = () => {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const isCheckout = path === '/checkout';

  // Determine contextual footer mode
  let footerMode = 'full';
  if (
    path.startsWith('/checkout') ||
    path.startsWith('/order-success') ||
    path.startsWith('/payment-')
  ) {
    footerMode = 'checkout';
  } else if (
    path === '/login' ||
    path === '/register' ||
    path.startsWith('/verify-') ||
    path.startsWith('/forgot-') ||
    path.startsWith('/reset-')
  ) {
    footerMode = 'auth';
  }

  const isAccount = path.startsWith('/account');

  return (
    <div className={`flex flex-col min-h-screen bg-[#F8FAFC] text-slate-900 ${isCheckout ? '' : 'pb-14 md:pb-0'}`}>
      {isCheckout ? <CheckoutHeader /> : <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer mode={footerMode} />
      {!isCheckout && <MobileBottomNav />}
    </div>
  );
};

export default CustomerLayout;
