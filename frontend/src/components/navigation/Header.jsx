import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, ShieldCheck, Truck, Headphones } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import SearchBar from '../common/SearchBar';
import Drawer from '../common/Drawer';
import axiosInstance from '../../api/axiosInstance';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { getCartTotals } = useContext(CartContext);
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cartTotals = getCartTotals();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (query) => {
    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <>
      {/* Top Utility Belt */}
      <div className="bg-brand-dark text-brand-gray-400 text-[10px] uppercase font-bold tracking-wider py-2 px-6 flex justify-between items-center border-b border-brand-gray-850 select-none">
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />
            <span>100% Genuine Partner Stock</span>
          </span>
          <span className="flex items-center space-x-1.5 hidden sm:flex">
            <Truck className="w-3.5 h-3.5 text-brand-accent" />
            <span>Direct Brand Fulfillment</span>
          </span>
          <span className="flex items-center space-x-1.5 hidden md:flex">
            <Headphones className="w-3.5 h-3.5 text-brand-accent" />
            <span>Official Warranty Support</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/brand/register" className="text-brand-accent hover:text-white transition-colors">Sell on KAIA</Link>
        </div>
      </div>

      {/* Main Navbar */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-brand-dark/95 backdrop-blur-md shadow-premium border-b border-brand-gray-800 py-3.5' 
          : 'bg-brand-dark py-4.5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start select-none group">
            <span className="text-2xl font-black tracking-tight text-white leading-none">
              KAIA<span className="text-brand-accent group-hover:animate-ping inline-block">.</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-gray-400 mt-1">
              TECHNOLOGIES
            </span>
          </Link>

          {/* Centered Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <SearchBar onSearch={handleSearchSubmit} placeholder="Search genuine hardware, electronics, CPUs..." />
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs uppercase font-bold tracking-wider">
            <Link to="/products" className="text-brand-gray-300 hover:text-white transition-colors">Products</Link>
            <Link to="/products?category=laptops" className="text-brand-gray-300 hover:text-white transition-colors">Laptops</Link>
            <Link to="/brand/register" className="text-brand-gray-300 hover:text-white transition-colors">Partnerships</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Account dropdown */}
            <div className="relative group">
              <Link
                to={user ? '/account' : '/login'}
                className="flex items-center space-x-1.5 text-brand-gray-300 hover:text-white transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-xs font-semibold hidden sm:inline max-w-[80px] truncate">
                  {user ? `Hi, ${(user.name || user.email || 'User').split(' ')[0]}` : 'Sign In'}
                </span>
              </Link>

              {user && (
                <div className="absolute right-0 mt-2 w-48 bg-brand-surface border border-brand-gray-800 rounded-sm shadow-premiumDark opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1 text-left text-xs">
                  <div className="px-4 py-2 border-b border-brand-gray-800">
                    <p className="text-[10px] text-brand-gray-450 uppercase font-bold">Registered Account</p>
                    <p className="font-semibold text-white truncate mt-0.5">{user.email}</p>
                  </div>
                  <Link to="/account" className="block px-4 py-2 text-brand-gray-300 hover:bg-brand-gray-800">My Profile</Link>
                  <Link to="/account?tab=orders" className="block px-4 py-2 text-brand-gray-300 hover:bg-brand-gray-800">My Orders</Link>
                  {user.role === 'BRAND' && (
                    <Link to="/brand/dashboard" className="block px-4 py-2 text-brand-accent hover:bg-brand-gray-800 font-bold border-t border-brand-gray-800">Seller Dashboard</Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link to="/admin/dashboard" className="block px-4 py-2 text-indigo-400 hover:bg-brand-gray-800 font-bold border-t border-brand-gray-800">Admin Control Console</Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full text-left block px-4 py-2 text-red-400 hover:bg-brand-gray-800 border-t border-brand-gray-800"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist Link */}
            <Link to="/account?tab=warranties" className="text-brand-gray-300 hover:text-white transition-colors relative">
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart Link with absolute quantity Badge */}
            <Link to="/cart" className="flex items-center space-x-1.5 text-brand-gray-300 hover:text-white transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              {cartTotals.quantityCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-accent text-white text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold">
                  {cartTotals.quantityCount}
                </span>
              )}
              <span className="text-xs font-bold hidden md:inline">
                ₹{cartTotals.total.toLocaleString()}
              </span>
            </Link>

            {/* Hamburger trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-brand-gray-300 hover:text-white focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>

        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      <Drawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Menu Navigation"
        position="right"
        width="max-w-xs"
      >
        <div className="space-y-6 text-xs uppercase font-bold tracking-wider">
          <div className="pb-4 border-b">
            <SearchBar onSearch={(q) => { setMobileOpen(false); handleSearchSubmit(q); }} placeholder="Search hardware catalog..." />
          </div>
          <div className="flex flex-col space-y-4">
            <Link to="/products" onClick={() => setMobileOpen(false)} className="hover:text-brand-accent">Products Catalog</Link>
            <Link to="/products?category=laptops" onClick={() => setMobileOpen(false)} className="hover:text-brand-accent">Laptops</Link>
            <Link to="/brand/register" onClick={() => setMobileOpen(false)} className="hover:text-brand-accent">Sellers Portal</Link>
            {user?.role === 'BRAND' && (
              <Link to="/brand/dashboard" onClick={() => setMobileOpen(false)} className="text-brand-accent">Brand Dashboard</Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="text-indigo-500">Admin Central Console</Link>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default Header;
