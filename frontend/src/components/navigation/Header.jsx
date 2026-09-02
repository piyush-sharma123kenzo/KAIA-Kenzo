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
    { slug: 'all', name: 'All Categories' },
    { slug: 'pc-components', name: 'PC Components' },
    { slug: 'laptops', name: 'Laptops' },
    { slug: 'smartphones', name: 'Smartphones' },
    { slug: 'monitors-and-displays', name: 'Monitors & Displays' },
    { slug: 'storage', name: 'Storage' },
    { slug: 'accessories', name: 'Accessories' },
    { slug: 'audio-and-sound', name: 'Audio & Sound' },
    { slug: 'cameras-and-imaging', name: 'Cameras & Imaging' },
    { slug: 'gaming-hardware', name: 'Gaming Hardware' },
  ];

  const displayCategories = [
    { slug: 'all', name: 'All Categories' },
    ...(categories.length > 0
      ? categories.map((c) => ({ slug: c.slug || c._id, name: c.name }))
      : fallbackCategories.slice(1))
  ].filter((item, index, self) => index === self.findIndex((t) => t.slug === item.slug));

  const activeCategoryLabel = displayCategories.find((c) => c.slug === selectedCategory)?.name || 'All Categories';

  return (
    <>
      <header className="sticky top-0 z-40 w-full select-none font-sans text-xs shadow-md">
        
        {/* ========================================================================= */}
        {/* TIER 0: TOP UTILITY STRIP (Pure Black #000000)                             */}
        {/* ========================================================================= */}
        <div className="bg-black text-slate-300 py-1.5 px-4 md:px-8 text-[11px] flex justify-between items-center border-b border-white/10 select-none">
          {/* Left: Location */}
          <div
            onClick={openLocationModal}
            className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white transition-colors py-0.5 select-none"
            title="Change Delivery Location"
          >
            <MapPin className="w-3.5 h-3.5 text-[#F5B400] shrink-0" />
            <span className="text-slate-300 text-xs font-normal">
              Deliver to: <span className="text-white font-bold tracking-tight">{deliveryAreaLabel}{deliveryPinLabel}</span>
            </span>
          </div>

          {/* Right: Utility Links */}
          <div className="hidden sm:flex items-center space-x-5 text-slate-300 font-medium">
            <Link to="/orders" className="hover:text-[#F5B400] transition-colors">Track Order</Link>
            <Link to="/brand-register" className="hover:text-[#F5B400] transition-colors">Become a Seller</Link>
            <Link to="/help" className="hover:text-[#F5B400] transition-colors">Help & Support</Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TIER 1: MAIN SEARCH & COMMERCE BAR (Pure Black #000000)                   */}
        {/* ========================================================================= */}
        <div className="bg-black px-4 md:px-8 py-3 flex items-center justify-between gap-4 md:gap-8 h-[68px]">
          
          {/* 1. Brand Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2.5 shrink-0 group"
            title="KAIA Technologies Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F5B400] to-[#FFD043] flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
              K
            </div>
            <div className="text-left">
              <span className="text-xl md:text-2xl font-black tracking-tight text-white block leading-none">
                KAIA
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase block mt-0.5">
                TECHNOLOGIES
              </span>
            </div>
          </Link>

          {/* 2. Search Bar with Category Select & Gold Search Button */}
          <form
            onSubmit={handleSearchSubmit}
            className={`flex-1 max-w-2xl flex items-center h-10 rounded-md bg-white overflow-hidden relative shadow-inner ${
              isSearchFocused || categoryDropdownOpen ? 'ring-2 ring-[#F5B400]' : ''
            }`}
          >
            {/* Custom Styled Category Dropdown */}
            <div ref={categoryDropdownRef} className="relative h-full shrink-0">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                className="bg-slate-100 hover:bg-slate-200 border-r border-slate-300 h-full flex items-center justify-between px-3.5 gap-1.5 cursor-pointer text-xs text-slate-800 font-bold transition-colors focus:outline-none"
                title="Select Category"
              >
                <span className="truncate max-w-[110px]">{activeCategoryLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-[#F5B400]' : ''}`} />
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
                placeholder="Search for products, brands and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full h-full px-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
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

            {/* Search Submit Button (Solid Yellow Accent #F5B400) */}
            <button
              type="submit"
              className="bg-[#F5B400] hover:bg-[#E0A200] text-slate-950 font-black h-full px-4.5 flex items-center justify-center shrink-0 transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* 3. Right Action Bar: Wishlist, Cart, Account */}
          <div className="flex items-center space-x-4 md:space-x-6 shrink-0 text-white text-xs font-semibold">
            
            {/* Wishlist */}
            <Link
              to="/account/wishlist"
              className="flex items-center space-x-1.5 hover:text-[#F5B400] transition-colors relative py-1"
              title="View Saved Wishlist"
            >
              <div className="relative">
                <Heart className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-2 bg-[#F5B400] text-slate-950 font-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-xs">
                  0
                </span>
              </div>
              <span className="hidden xl:inline font-bold">Wishlist</span>
            </Link>

            {/* Cart Counter */}
            <Link
              to="/cart"
              className="flex items-center space-x-1.5 hover:text-[#F5B400] transition-colors relative py-1"
              title="View Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-2 bg-[#F5B400] text-slate-950 font-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-xs">
                  {cartItemCount}
                </span>
              </div>
              <span className="hidden xl:inline font-bold">Cart</span>
            </Link>

            {/* Account / User */}
            <div
              className="relative group text-left py-1"
              onMouseEnter={() => setAccountDropdown(true)}
              onMouseLeave={() => setAccountDropdown(false)}
            >
              <Link to={user ? '/account' : '/login'} className="flex items-center space-x-1.5 hover:text-[#F5B400] transition-colors py-1">
                <User className="w-5 h-5 text-white" />
                <span className="font-bold hidden sm:inline">
                  {user ? user.name?.split(' ')[0] : 'Sign In / Register'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
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
                      {/* User Profile Summary */}
                      <div className="p-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#F5B400] to-[#FFD043] text-slate-950 font-black flex items-center justify-center text-sm shadow-sm ring-2 ring-amber-400/20 shrink-0">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {user.name || 'Piyush Kumar Sharma'}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate font-mono">
                              {user.email}
                            </p>
                            <div className="mt-1 flex items-center">
                              <span className="inline-flex items-center text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                                {user.role === 'ADMIN' ? 'Admin Central' : user.role === 'BRAND' ? 'Brand Seller' : 'Verified Member'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* KAIA Loyalty Club Pill */}
                        <Link
                          to="/account?tab=rewards"
                          className="mt-3 bg-white hover:bg-amber-50/70 border border-amber-200/90 rounded-xl p-2.5 flex items-center justify-between text-xs transition-all shadow-2xs group"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                            </div>
                            <span className="text-slate-800 text-xs font-bold">KAIA Loyalty Club</span>
                          </div>
                          <div className="flex items-center space-x-1 text-amber-800 font-extrabold text-xs group-hover:translate-x-0.5 transition-transform">
                            <span>1,250 Pts</span>
                            <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                        </Link>
                      </div>

                      {/* Primary Navigation Links */}
                      <div className="p-2.5 space-y-0.5 text-xs">
                        <div className="px-3 pt-1.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Your Account & Tech Hub
                        </div>

                        <Link
                          to="/account"
                          className="flex items-center space-x-3 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-amber-100/70 flex items-center justify-center transition-colors">
                            <User className="w-4 h-4 text-slate-600 group-hover:text-amber-700 transition-colors" />
                          </div>
                          <span className="flex-1">Account Overview</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </Link>

                        <Link
                          to="/orders"
                          className="flex items-center space-x-3 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-amber-100/70 flex items-center justify-center transition-colors">
                            <ShoppingBag className="w-4 h-4 text-slate-600 group-hover:text-amber-700 transition-colors" />
                          </div>
                          <span className="flex-1">Your Orders & Invoices</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </Link>

                        <Link
                          to="/account/wishlist"
                          className="flex items-center space-x-3 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-rose-100/70 flex items-center justify-center transition-colors">
                            <Heart className="w-4 h-4 text-slate-600 group-hover:text-rose-600 transition-colors" />
                          </div>
                          <span className="flex-1">Saved Wishlist</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </Link>

                        <Link
                          to="/compare"
                          className="flex items-center space-x-3 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-amber-100/70 flex items-center justify-center transition-colors">
                            <ArrowLeftRight className="w-4 h-4 text-slate-600 group-hover:text-amber-700 transition-colors" />
                          </div>
                          <span className="flex-1">Compare Hardware</span>
                          {compareCount > 0 ? (
                            <span className="bg-[#F5B400] text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                              {compareCount}
                            </span>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                          )}
                        </Link>

                        <Link
                          to="/account?tab=warranties"
                          className="flex items-center space-x-3 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-amber-100/70 flex items-center justify-center transition-colors">
                            <Award className="w-4 h-4 text-slate-600 group-hover:text-amber-700 transition-colors" />
                          </div>
                          <span className="flex-1">Hardware Warranties</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </Link>

                        <Link
                          to="/account?tab=addresses"
                          className="flex items-center space-x-3 px-2.5 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors group font-semibold"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-amber-100/70 flex items-center justify-center transition-colors">
                            <MapPin className="w-4 h-4 text-slate-600 group-hover:text-amber-700 transition-colors" />
                          </div>
                          <span className="flex-1">Saved Delivery Addresses</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </Link>
                      </div>

                      {/* Management Consoles (Role-based) */}
                      {(user?.role === 'ADMIN' || user?.role === 'BRAND') && (
                        <div className="p-2.5 pt-0 space-y-1 border-t border-slate-100">
                          <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Management Consoles
                          </div>

                          {user?.role === 'ADMIN' && (
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-indigo-700 hover:text-indigo-950 bg-indigo-50/70 hover:bg-indigo-100/70 transition-colors group font-bold text-xs"
                            >
                              <ShieldCheck className="w-4 h-4 text-indigo-600" />
                              <span className="flex-1">Admin Central Console</span>
                              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                            </Link>
                          )}

                          {user?.role === 'BRAND' && (
                            <Link
                              to="/brand/dashboard"
                              className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100/70 transition-colors group font-bold text-xs"
                            >
                              <Building2 className="w-4 h-4 text-amber-700" />
                              <span className="flex-1">Brand Seller Portal</span>
                              <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Sign Out Action */}
                      <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                        <button
                          onClick={logout}
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all font-bold group"
                        >
                          <LogOut className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                          <span>Sign Out of Account</span>
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* ========================================================================= */}
        {/* TIER 2: SECONDARY CATEGORY BAR (Pure White with Light Gray Bottom Border)  */}
        {/* ========================================================================= */}
        <div className="bg-white text-slate-800 border-b border-slate-200 px-4 md:px-8 py-2.5 flex items-center text-xs font-semibold overflow-x-auto no-scrollbar gap-6 select-none shadow-2xs">
          
          {/* Shop by Category Button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center space-x-2 text-slate-950 font-black pr-6 border-r border-slate-200 shrink-0 hover:text-[#F5B400] transition-colors"
          >
            <Menu className="w-4 h-4" />
            <span>Shop by Category</span>
          </button>

          {/* Category Navigation Links */}
          <Link to="/" className="text-slate-950 font-bold border-b-2 border-[#F5B400] pb-1 shrink-0">
            Home
          </Link>
          <Link to="/products?category=pc-components" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            PC Components
          </Link>
          <Link to="/products?category=laptops" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Laptops
          </Link>
          <Link to="/products?category=desktops" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Desktops
          </Link>
          <Link to="/products?category=monitors-and-displays" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Monitors
          </Link>
          <Link to="/products?category=networking" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Networking
          </Link>
          <Link to="/products?category=accessories" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Accessories
          </Link>
          <Link to="/products?category=storage" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Storage
          </Link>
          <Link to="/products?category=peripherals" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Peripherals
          </Link>
          <Link to="/products?category=software" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Software
          </Link>
          <Link to="/brands" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Brands
          </Link>
          <Link to="/deals" className="hover:text-[#F5B400] transition-colors shrink-0 pb-1">
            Deals
          </Link>
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
