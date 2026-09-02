import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, ShoppingCart, MapPin, Menu, X, ChevronDown, 
  User, ShieldCheck, Heart, Building2, Package, ExternalLink,
  Navigation, Check, ArrowLeftRight, LogOut, Sparkles, Award, ShoppingBag, ChevronRight
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { useLocationContext } from '../../context/LocationContext';
import { useCompare } from '../../context/CompareContext';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';
import Drawer from '../common/Drawer';
import LocationSelectorModal from '../common/LocationSelectorModal';

const Header = () => {
  const { user, logout } = useContext(AuthContext) || {};
  const { cart, cartTotals } = useContext(CartContext) || {};
  const { deliveryLocation, openLocationModal } = useLocationContext();
  const { compareCount = 0 } = useCompare() || {};
  const navigate = useNavigate();
  const location = useLocation();

  const cartItemCount = cartTotals?.quantityCount ?? (cart?.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) ?? 0);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live autocomplete suggestions
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await productService.getSearchSuggestions(searchQuery.trim());
        if (res.success) {
          setSuggestions(res.suggestions || []);
        }
      } catch (e) {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.success) {
          setCategories(res.categories || res.data || []);
        }
      } catch (e) {
        // Fallback
      }
    };
    fetchCats();
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    navigate(`/products?${params.toString()}`);
  };

  // Dynamic delivery label derived from LocationContext
  const deliverToName = deliveryLocation?.recipientName 
    ? deliveryLocation.recipientName.split(' ')[0] 
    : user?.name 
      ? user.name.split(' ')[0] 
      : 'Customer';

  const deliveryAreaLabel = deliveryLocation?.area || deliveryLocation?.city || 'Delhi, India';
  const deliveryPinLabel = deliveryLocation?.postalCode ? ` ${deliveryLocation.postalCode}` : '';

  // Compute unique clean categories list
  const fallbackCategories = [
    { slug: 'all', name: 'All Departments' },
    { slug: 'laptops', name: 'Laptops' },
    { slug: 'smartphones', name: 'Smartphones' },
    { slug: 'audio-and-sound', name: 'Audio & Sound' },
    { slug: 'pc-components', name: 'PC Components' },
    { slug: 'monitors-and-displays', name: 'Monitors & Displays' },
    { slug: 'cameras-and-imaging', name: 'Cameras & Imaging' },
    { slug: 'gaming-hardware', name: 'Gaming Hardware' },
  ];

  const displayCategories = [
    { slug: 'all', name: 'All' },
    ...(categories.length > 0
      ? categories.map((c) => ({ slug: c.slug || c._id, name: c.name }))
      : fallbackCategories.slice(1))
  ].filter((item, index, self) => index === self.findIndex((t) => t.slug === item.slug));

  const activeCategoryLabel = displayCategories.find((c) => c.slug === selectedCategory)?.name || 'All';

  return (
    <>
      <header className="sticky top-0 z-40 w-full select-none text-white font-sans text-xs shadow-md">
        
        {/* ========================================================================= */}
        {/* TIER 1: MAIN TOP NAV BAR (Navy #131A22)                                    */}
        {/* ========================================================================= */}
        <div className="bg-amz-navy px-3 md:px-4 py-1.5 flex items-center justify-between gap-2 md:gap-4 h-[60px]">
          
          {/* 1. Logo */}
          <Link
            to="/"
            className="amz-nav-item px-2 py-1 flex items-baseline space-x-1.5 shrink-0"
            title="KAIA Technologies Home"
          >
            <span className="text-xl md:text-2xl font-black tracking-tight text-white leading-none">
              KAIA
            </span>
            <span className="text-xs md:text-sm font-bold text-amz-orange tracking-normal">
              Technologies
            </span>
          </Link>

          {/* 2. Deliver To Block (Interactive Location Selector) */}
          <div
            onClick={openLocationModal}
            className="amz-nav-item hidden lg:flex items-center space-x-1.5 px-2 py-1 shrink-0 cursor-pointer rounded hover:ring-1 hover:ring-white/40 transition-all group"
            title="Click to change delivery location"
          >
            <MapPin className="w-4 h-4 text-white shrink-0 mt-1.5 group-hover:text-amz-orange transition-colors" />
            <div className="leading-tight text-left max-w-[150px]">
              <span className="text-[11px] text-brand-gray-300 font-normal block leading-none truncate">
                Deliver to {deliverToName}
              </span>
              <span className="text-xs font-bold text-white block mt-0.5 leading-none truncate">
                {deliveryAreaLabel}{deliveryPinLabel}
              </span>
            </div>
          </div>

          {/* 3. Full-Width Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className={`flex-1 flex items-center h-10 max-w-4xl rounded-[4px] bg-white relative ${
              isSearchFocused || categoryDropdownOpen ? 'ring-2 ring-amz-orange ring-offset-0' : ''
            }`}
          >
            {/* Custom Styled Category Dropdown */}
            <div ref={categoryDropdownRef} className="relative h-full shrink-0">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                className="bg-brand-gray-100 hover:bg-brand-gray-200 border-r border-brand-gray-300 h-full flex items-center justify-between px-3 gap-2 cursor-pointer text-xs text-amz-bodyInk font-semibold transition-colors focus:outline-none rounded-l-[4px]"
                title="Select Category"
              >
                <span className="truncate max-w-[120px] text-center">{activeCategoryLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-amz-secText transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-amz-orange' : ''}`} />
              </button>

              {/* Styled Category Dropdown Menu */}
              {categoryDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-1.5 text-left divide-y divide-slate-100">
                  {displayCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.slug);
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-amber-50 text-amber-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Keyword Input with Suggestions */}
            <div className="relative flex-1 h-full">
              <input
                type="text"
                placeholder="Search KAIA for genuine laptops, smartphones, processors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full h-full px-3.5 text-xs text-amz-bodyInk placeholder:text-brand-gray-450 focus:outline-none"
              />

              {/* Autocomplete Flyout */}
              {isSearchFocused && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-brand-gray-300 shadow-2xl rounded-b-[4px] z-50 overflow-hidden divide-y divide-brand-gray-100 text-left">
                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onMouseDown={() => {
                        setSearchQuery(item.name);
                        navigate(`/product/${item.slug || item._id}`);
                      }}
                      className="px-4 py-2 hover:bg-amz-bgGray cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2">
                        <Search className="w-3.5 h-3.5 text-brand-gray-400 group-hover:text-amz-orange" />
                        <span className="text-xs text-amz-bodyInk font-medium truncate max-w-sm">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-brand-gray-400 uppercase font-mono">
                        {item.brandName || 'Verified'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search Submit Button (Amazon Yellow Accent) */}
            <button
              type="submit"
              className="bg-amz-searchYellow hover:bg-amz-searchYellowHover text-amz-bodyInk h-full px-4 flex items-center justify-center shrink-0 transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* 4. Language Selector Pill */}
          <div className="amz-nav-item hidden xl:flex items-center space-x-1 px-2 py-1 shrink-0 cursor-default">
            <span className="text-xs">🇮🇳</span>
            <span className="text-xs font-bold text-white uppercase">IN / EN</span>
          </div>

          {/* 5. Account / Sign In */}
          <div
            className="relative group amz-nav-item px-2 py-1 shrink-0 text-left"
            onMouseEnter={() => setAccountDropdown(true)}
            onMouseLeave={() => setAccountDropdown(false)}
          >
            <Link to={user ? '/account' : '/login'} className="flex flex-col justify-center py-1">
              <span className="text-[11px] text-brand-gray-300 font-normal block leading-none truncate max-w-[110px]">
                Hello, {user ? user.name?.split(' ')[0] || 'Member' : 'Sign In'}
              </span>
              <div className="flex items-center space-x-0.5 mt-0.5">
                <span className="text-xs font-bold text-white block leading-none">
                  {user ? 'Account & Lists' : 'Accounts & Orders'}
                </span>
                <ChevronDown className="w-3 h-3 text-brand-gray-400" />
              </div>
            </Link>

            {/* Hover Account Dropdown Menu */}
            {accountDropdown && (
              <div className="absolute right-0 top-full pt-2 w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="bg-white text-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.22)] border border-slate-200/90 overflow-hidden ring-1 ring-black/5 text-left">
                  
                  {/* If user not signed in */}
                  {!user ? (
                    <div className="p-5 space-y-4">
                      <div className="text-center space-y-2">
                        <h4 className="font-black text-sm text-slate-900 tracking-tight">
                          Welcome to KAIA Technologies
                        </h4>
                        <p className="text-xs text-slate-500">
                          Sign in to manage technology orders, compare hardware, and access verified invoices.
                        </p>
                      </div>

                      <Link to="/login" className="block w-full">
                        <button className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-xs transition-colors text-xs flex items-center justify-center space-x-1.5">
                          <span>Sign In to Your Account</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>

                      <div className="text-center text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        New to KAIA?{' '}
                        <Link to="/register" className="text-amber-700 font-bold hover:underline">
                          Create an Account
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* User Identity Header Card */}
                      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850 text-white p-4.5 border-b border-slate-800">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black flex items-center justify-center text-sm shadow-md ring-2 ring-white/20 shrink-0">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-sm text-white truncate block">
                                {user.name || 'Piyush Sharma'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate font-mono">
                              {user.email}
                            </p>
                            <div className="mt-1 flex items-center space-x-1.5">
                              <span className="inline-flex items-center text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded">
                                {user.role === 'ADMIN' ? 'Admin Central' : user.role === 'BRAND' ? 'Brand Seller' : 'Verified Member'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* KAIA Club Mini Banner */}
                        <Link
                          to="/account?tab=rewards"
                          className="mt-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs transition-colors group"
                        >
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-slate-300 text-[11px] font-medium">KAIA Loyalty Club</span>
                          </div>
                          <div className="flex items-center space-x-1 text-amber-300 font-black text-xs group-hover:translate-x-0.5 transition-transform">
                            <span>1,250 Pts</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </Link>
                      </div>

                      {/* Primary Navigation Links */}
                      <div className="p-3 space-y-1 text-xs">
                        <div className="px-2 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Your Account & Tech Hub
                        </div>

                        <Link
                          to="/account"
                          className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <User className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                          <span className="flex-1">Account Overview</span>
                          <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        </Link>

                        <Link
                          to="/orders"
                          className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <ShoppingBag className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                          <span className="flex-1">Your Orders & Invoices</span>
                          <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        </Link>

                        <Link
                          to="/account/wishlist"
                          className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <Heart className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
                          <span className="flex-1">Saved Wishlist</span>
                          <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        </Link>

                        <Link
                          to="/compare"
                          className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <ArrowLeftRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                          <span className="flex-1">Compare Hardware</span>
                          {compareCount > 0 ? (
                            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                              {compareCount}
                            </span>
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                          )}
                        </Link>

                        <Link
                          to="/account?tab=warranties"
                          className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <Award className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                          <span className="flex-1">Hardware Warranties</span>
                          <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        </Link>

                        <Link
                          to="/account?tab=addresses"
                          className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <MapPin className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                          <span className="flex-1">Saved Delivery Addresses</span>
                          <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        </Link>
                      </div>

                      {/* Management Consoles (Role-based) */}
                      {(user?.role === 'ADMIN' || user?.role === 'BRAND') && (
                        <div className="p-3 pt-0 space-y-1 border-t border-slate-100">
                          <div className="px-2 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Management Consoles
                          </div>

                          {user?.role === 'ADMIN' && (
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-indigo-700 hover:text-indigo-950 bg-indigo-50/70 hover:bg-indigo-100/70 transition-colors group font-bold text-xs"
                            >
                              <ShieldCheck className="w-4 h-4 text-indigo-600" />
                              <span className="flex-1">Admin Central Console</span>
                              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                            </Link>
                          )}

                          {user?.role === 'BRAND' && (
                            <Link
                              to="/brand/dashboard"
                              className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100/70 transition-colors group font-bold text-xs"
                            >
                              <Building2 className="w-4 h-4 text-amber-700" />
                              <span className="flex-1">Brand Seller Portal</span>
                              <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Sign Out Action */}
                      <div className="p-3 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
                        <button
                          onClick={logout}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors font-bold group"
                        >
                          <div className="flex items-center space-x-2">
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out of Account</span>
                          </div>
                          <span className="text-[10px] text-slate-400 group-hover:text-rose-500 font-mono">Secure</span>
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* 6. Returns & Orders */}
          <Link
            to="/orders"
            className="amz-nav-item px-2 py-1 shrink-0 text-left hidden sm:block"
            title="View Returns and Orders"
          >
            <span className="text-[11px] text-brand-gray-300 font-normal block leading-none">Returns</span>
            <span className="text-xs font-bold text-white block mt-0.5 leading-none">& Orders</span>
          </Link>

          {/* 6b. Compare Counter */}
          <Link
            to="/compare"
            className="amz-nav-item px-2 py-1 flex items-center space-x-1 shrink-0 relative"
            title="Compare Products"
          >
            <div className="relative flex items-center">
              <ArrowLeftRight className="w-5 h-5 text-white" />
              {compareCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full px-1 min-w-[16px] text-center leading-tight shadow-xs">
                  {compareCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-white hidden xl:inline ml-1">Compare</span>
          </Link>

          {/* 7. Cart Counter */}
          <Link
            to="/cart"
            className="amz-nav-item px-2 py-1 flex items-center space-x-1.5 shrink-0"
            title="View Shopping Cart"
          >
            <div className="relative flex items-center">
              <ShoppingCart className="w-7 h-7 text-white" />
              <span className="absolute -top-1 left-3 bg-amz-orange text-amz-bodyInk font-black text-[11px] rounded-full px-1.5 py-0.2 min-w-[18px] text-center leading-tight">
                {cartItemCount}
              </span>
            </div>
            <span className="text-xs font-bold text-white hidden md:inline mt-2">Cart</span>
          </Link>

        </div>

        {/* ========================================================================= */}
        {/* TIER 2: SUB-NAVIGATION BAR (Amazon Dark Navy #232F3E)                      */}
        {/* ========================================================================= */}
        <div className="bg-amz-navy2 px-3 md:px-4 py-1.5 flex items-center justify-between text-xs overflow-x-auto no-scrollbar">
          
          {/* Left menu items */}
          <div className="flex items-center space-x-1 md:space-x-2 shrink-0">
            {/* All Menu Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="amz-nav-item px-2 py-1 flex items-center space-x-1 font-bold text-white hover:text-white"
            >
              <Menu className="w-4 h-4" />
              <span>All</span>
            </button>

            {/* Mobile Location Quick Pill */}
            <button
              onClick={openLocationModal}
              className="lg:hidden flex items-center space-x-1 text-amber-400 bg-white/10 px-2.5 py-1 rounded text-[11px] font-bold"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[110px]">{deliveryAreaLabel}</span>
            </button>

            <Link to="/deals" className="amz-nav-item px-2 py-1 text-white font-normal hover:text-white">
              Today's Deals
            </Link>
            <Link to="/new-arrivals" className="amz-nav-item px-2 py-1 text-white font-normal hover:text-white">
              New Arrivals
            </Link>
            <Link to="/best-sellers" className="amz-nav-item px-2 py-1 text-white font-normal hover:text-white">
              Best Sellers
            </Link>
            <Link to="/compare" className="amz-nav-item px-2 py-1 text-amber-300 font-semibold hover:text-amber-200">
              Compare {compareCount > 0 ? `(${compareCount})` : ''}
            </Link>
            <Link to="/categories" className="amz-nav-item px-2 py-1 text-white font-normal hover:text-white">
              Departments
            </Link>
            <Link to="/brands" className="amz-nav-item px-2 py-1 text-white font-normal hover:text-white">
              Authorized Brands
            </Link>
          </div>

        </div>

      </header>

      {/* Location Selector Modal */}
      <LocationSelectorModal />

      {/* ========================================================================= */}
      {/* MOBILE DRAWER (All Categories & Navigation)                                */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="KAIA Marketplace Directory"
        position="left"
        width="max-w-xs"
      >
        <div className="space-y-5 text-left text-xs">
          
          {/* User greeting */}
          <div className="bg-amz-navy text-white p-4 -m-4 mb-4 flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-black">
              {user ? (user.name || user.email).charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <span className="font-bold text-sm">
              Hello, {user ? (user.name || user.email).split(' ')[0] : 'Sign In'}
            </span>
          </div>

          {/* Mobile Delivery Location Block */}
          <div 
            onClick={() => { setMobileOpen(false); openLocationModal(); }}
            className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-700" />
              <div>
                <span className="text-[10px] text-amber-800 font-bold block uppercase">Delivering To</span>
                <span className="text-xs font-extrabold text-slate-900">{deliveryAreaLabel}{deliveryPinLabel}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-700 underline">Change</span>
          </div>

          <div className="space-y-1 font-semibold text-amz-bodyInk divide-y divide-amz-borderLight">
            <div className="py-2 space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-amz-secText">Trending & Highlights</h4>
              <Link to="/products?filter=deals" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">Today's Deals</Link>
              <Link to="/products?sort=newest" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">New Arrivals</Link>
              <Link to="/products?filter=bestsellers" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">Best Sellers</Link>
            </div>

            <div className="py-2 space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-amz-secText">Shop By Department</h4>
              <Link to="/products?category=laptops" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">Laptops & Workstations</Link>
              <Link to="/products?category=smartphones" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">Smartphones & Wearables</Link>
              <Link to="/products?category=audio-and-sound" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">Headphones & Audio</Link>
              <Link to="/products?category=pc-components" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">PC Components & GPUs</Link>
              <Link to="/products?category=monitors-and-displays" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">Monitors & Displays</Link>
              <Link to="/products?category=cameras-and-imaging" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">Cameras & Imaging</Link>
              <Link to="/categories" onClick={() => setMobileOpen(false)} className="block py-1 text-amz-linkBlue font-bold hover:underline">See All 24 Categories ›</Link>
            </div>

            <div className="py-2 space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-amz-secText">Help & Settings</h4>
              <Link to="/account" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">Your Account</Link>
              <Link to="/orders" onClick={() => setMobileOpen(false)} className="block py-1 hover:text-amz-orange">Your Orders</Link>
              {user && (
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block py-1 text-red-600 font-bold">
                  Sign Out
                </button>
              )}
            </div>
          </div>

        </div>
      </Drawer>
    </>
  );
};

export default Header;
