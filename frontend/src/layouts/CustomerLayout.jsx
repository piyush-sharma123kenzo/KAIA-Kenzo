import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/navigation/Header';
import Footer from '../components/navigation/Footer';

const CustomerLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-brand-light">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
