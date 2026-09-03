import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, ShoppingCart, MapPin, Menu, X, ChevronDown, 
  User, ShieldCheck, Heart, Building2, Package, ExternalLink,
  Navigation, Check, ArrowLeftRight, LogOut, Award, ShoppingBag, ChevronRight, Camera,
  Sparkles, Flame, Tag, Eye
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { useLocationContext } from '../../context/LocationContext';
import { useCompare } from '../../context/CompareContext';
import { useToast } from '../../context/ToastContext';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';
import axiosInstance from '../../api/axiosInstance';
import Drawer from '../common/Drawer';
import LocationSelectorModal from '../common/LocationSelectorModal';
import KaiaLogo from '../common/KaiaLogo';
import { getAvatarSrc } from '../../utils/imageUtils';
import ProfileAvatar from '../profile/ProfileAvatar';
import ProfileImageViewer from '../profile/ProfileImageViewer';
import userApi from '../../services/userApi';

const Header = () => {
  const { user, logout, updateProfile } = useContext(AuthContext) || {};
  const { cart, cartTotals } = useContext(CartContext) || {};
  const { deliveryLocation, openLocationModal } = useLocationContext();
  const { compareCount = 0 } = useCompare() || {};
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type?.toLowerCase())) {
      toast?.error?.('Only JPG, JPEG, PNG, and WEBP image files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast?.error?.('Profile image must be smaller than 5 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    setUploadingAvatar(true);
    try {
      const res = await userApi.uploadProfileImage(formData);
      const updatedUser = res?.user || res;
      if (updateProfile) updateProfile(updatedUser);
      toast?.success?.(res.message || 'Profile picture updated successfully!');
    } catch (err) {
      console.error('[Header] Avatar upload failed:', err);
      toast?.error?.(err.response?.data?.message || err.message || 'Failed to update profile picture.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const cartItemCount = cartTotals?.quantityCount ?? (cart?.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) ?? 0);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
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
        {/* TIER 1: MAIN SEARCH & COMMERCE BAR (Pure Black #000000)                   */}
        {/* ========================================================================= */}
        <div className="bg-black px-4 md:px-8 py-3 flex items-center justify-between gap-3 md:gap-6 h-[74px]">
          
          {/* 1. Brand Logo */}
          <KaiaLogo 
            to="/" 
            variant="horizontal" 
            theme="dark" 
            size="md" 
            className="group-hover:opacity-95 transition-opacity"
          />

          {/* 2. Deliver To Location (Directly Beside KAIA Logo) */}
          <div
            onClick={openLocationModal}
            className="hidden sm:flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white transition-colors shrink-0 py-1.5 px-2 rounded-lg hover:ring-1 hover:ring-white/20 select-none group"
            title="Click to change delivery location"
          >
            <MapPin className="w-4 h-4 text-[#F5B400] shrink-0 group-hover:scale-110 transition-transform" />
            <div className="leading-tight text-left">
              <span className="text-[10px] text-slate-400 block font-normal leading-none">
                Deliver to
              </span>
              <span className="text-xs font-bold text-white block mt-1 leading-none group-hover:text-[#F5B400] transition-colors truncate max-w-[120px] lg:max-w-[160px]">
                {deliveryAreaLabel}{deliveryPinLabel}
              </span>
            </div>
          </div>

          {/* 3. Spacious Search Bar with Working Category Select & Gold Button */}
          <form
            onSubmit={handleSearchSubmit}
            className={`flex-1 max-w-4xl flex items-center h-11 md:h-12 rounded-lg bg-white relative shadow-md transition-all ${
              isSearchFocused || categoryDropdownOpen ? 'ring-2 ring-[#F5B400]' : 'hover:ring-1 hover:ring-[#F5B400]/60'
            }`}
          >
            {/* Custom Styled Category Dropdown */}
            <div ref={categoryDropdownRef} className="relative h-full shrink-0">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                className="bg-slate-100 hover:bg-slate-200 border-r border-slate-300 h-full flex items-center justify-between px-3.5 md:px-4 gap-2 cursor-pointer text-xs md:text-sm text-slate-800 font-bold transition-colors focus:outline-none rounded-l-lg"
                title="Select Category"
              >
                <span className="truncate max-w-[95px] sm:max-w-[130px] md:max-w-[160px]">{activeCategoryLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-[#F5B400]' : ''}`} />
              </button>

              {/* Styled Category Dropdown Menu - Unclipped & Z-Indexed */}
              {categoryDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] py-1.5 text-left divide-y divide-slate-100 ring-1 ring-black/10">
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
                        className={`w-full px-4 py-2.5 text-xs md:text-sm flex items-center justify-between transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-amber-50 text-amber-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />}
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
                className="w-full h-full px-4 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />

              {/* Autocomplete Flyout - Unclipped & Z-Indexed */}
              {isSearchFocused && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 shadow-2xl rounded-xl z-[100] overflow-hidden divide-y divide-slate-100 text-left ring-1 ring-black/10">
                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onMouseDown={() => {
                        setSearchQuery(item.name);
                        navigate(`/product/${item.slug || item._id}`);
                      }}
                      className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Search className="w-4 h-4 text-slate-400 group-hover:text-[#F5B400] transition-colors" />
                        <span className="text-xs md:text-sm text-slate-800 font-medium truncate max-w-sm">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
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
              className="bg-[#F5B400] hover:bg-[#E0A200] text-slate-950 font-black h-full px-5 md:px-6 flex items-center justify-center shrink-0 transition-colors rounded-r-lg"
              title="Search"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
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
              <Link to={user ? '/account' : '/login'} className="flex items-center space-x-2 hover:text-[#F5B400] transition-colors py-1">
                {user ? (
                  <ProfileAvatar
                    user={user}
                    size="xs"
                    shape="circle"
                    ring={true}
                    ringColor="ring-[#F5B400]/80"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
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
                      {/* Clean User Profile Header */}
                      <div className="p-4 border-b border-slate-100 bg-slate-50/90 rounded-t-2xl">
                        <div className="flex items-center space-x-3.5">
                          {/* Profile Picture with Change Photo Trigger */}
                          <div className="relative group/avatar shrink-0">
                            <ProfileAvatar
                              user={user}
                              size="md"
                              shape="circle"
                              ring={true}
                              ringColor="ring-amber-400/40"
                              className="shadow-sm"
                            />
                            
                            {/* Camera overlay on hover */}
                            <label
                              htmlFor="header-avatar-upload"
                              className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-[9px] font-bold"
                              title="Click to change profile picture"
                            >
                              <Camera className="w-3.5 h-3.5 text-[#F5B400]" />
                            </label>
                            <input
                              id="header-avatar-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                              disabled={uploadingAvatar}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {user.name || 'Piyush Kumar Sharma'}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate font-mono">
                              {user.email}
                            </p>
                            <div className="flex items-center space-x-2.5 mt-1">
                              <label
                                htmlFor="header-avatar-upload"
                                className="inline-flex items-center space-x-1 text-[11px] text-amber-700 hover:text-amber-800 font-bold cursor-pointer"
                              >
                                <Camera className="w-3 h-3 text-amber-600" />
                                <span>{uploadingAvatar ? 'Uploading...' : 'Change Photo'}</span>
                              </label>

                              {(user.profileImage?.url || user.avatar) && (
                                <>
                                  <span className="text-slate-300 text-[10px]">|</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAccountDropdown(false);
                                      setPreviewModalOpen(true);
                                    }}
                                    className="inline-flex items-center space-x-1 text-[11px] text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3 text-slate-500" />
                                    <span>View Photo</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Primary Navigation Links */}
                      <div className="p-2 space-y-1 text-xs">
                        <div className="px-3 pt-1.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Your Account & Tech Hub
                        </div>

                        <Link
                          to="/account"
                          className="flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-all group font-semibold"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all duration-200 shadow-2xs shrink-0">
                            <User className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                          </div>
                          <span className="flex-1 font-bold text-[13px] text-slate-800 group-hover:text-slate-950">Account Overview</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/orders"
                          className="flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-all group font-semibold"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all duration-200 shadow-2xs shrink-0">
                            <ShoppingBag className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                          </div>
                          <span className="flex-1 font-bold text-[13px] text-slate-800 group-hover:text-slate-950">Your Orders & Invoices</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/account/wishlist"
                          className="flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-all group font-semibold"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center group-hover:bg-rose-600 group-hover:border-rose-600 group-hover:text-white transition-all duration-200 shadow-2xs shrink-0">
                            <Heart className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                          </div>
                          <span className="flex-1 font-bold text-[13px] text-slate-800 group-hover:text-slate-950">Saved Wishlist</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/compare"
                          className="flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-all group font-semibold"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all duration-200 shadow-2xs shrink-0">
                            <ArrowLeftRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                          </div>
                          <span className="flex-1 font-bold text-[13px] text-slate-800 group-hover:text-slate-950">Compare Hardware</span>
                          {compareCount > 0 ? (
                            <span className="bg-[#F5B400] text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full">
                              {compareCount}
                            </span>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                          )}
                        </Link>

                        <Link
                          to="/account?tab=warranties"
                          className="flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-all group font-semibold"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all duration-200 shadow-2xs shrink-0">
                            <Award className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                          </div>
                          <span className="flex-1 font-bold text-[13px] text-slate-800 group-hover:text-slate-950">Hardware Warranties</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                        </Link>

                        <Link
                          to="/account?tab=addresses"
                          className="flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-all group font-semibold"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all duration-200 shadow-2xs shrink-0">
                            <MapPin className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                          </div>
                          <span className="flex-1 font-bold text-[13px] text-slate-800 group-hover:text-slate-950">Saved Delivery Addresses</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
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
        {/* TIER 2: SECONDARY CATEGORY BAR (Modern High-End Pill Navigation)           */}
        {/* ========================================================================= */}
        <div className="bg-white/95 backdrop-blur-md text-slate-800 border-b border-slate-200/90 px-4 md:px-8 py-2 flex items-center text-xs font-semibold overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 md:gap-2.5 select-none shadow-2xs">
          
          {/* Shop by Category Pill */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl shrink-0 transition-all hover:scale-[1.02] active:scale-95 shadow-xs cursor-pointer mr-1"
          >
            <Menu className="w-3.5 h-3.5 text-[#F5B400]" />
            <span className="text-[11px] md:text-xs tracking-tight">Shop by Category</span>
          </button>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-slate-200 shrink-0 mx-0.5" />

          {/* Category Navigation Pill Links (Clean Professional Typography) */}
          {[
            { name: 'Home', path: '/' },
            { name: 'PC Components', path: '/products?category=pc-components' },
            { name: 'Laptops', path: '/products?category=laptops' },
            { name: 'Desktops', path: '/products?category=desktops' },
            { name: 'Monitors', path: '/products?category=monitors-and-displays' },
            { name: 'Networking', path: '/products?category=networking' },
            { name: 'Accessories', path: '/products?category=accessories' },
            { name: 'Storage', path: '/products?category=storage' },
            { name: 'Peripherals', path: '/products?category=peripherals' },
            { name: 'Software', path: '/products?category=software' },
            { name: 'Brands', path: '/brands' },
            { name: 'Deals', path: '/deals' },
          ].map((item) => {
            const currentFullUrl = location.pathname + location.search;
            const isActive = item.path === '/' 
              ? (location.pathname === '/' && !location.search) 
              : (currentFullUrl === item.path || location.pathname === item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  shrink-0 px-3 py-1.5 rounded-lg transition-all duration-150 text-[12px]
                  ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90 font-medium'
                  }
                `}
              >
                {item.name}
              </Link>
            );
          })}
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

      {/* Lightbox Profile Image Viewer */}
      {Boolean(user?.profileImage?.url || user?.avatar) && (
        <ProfileImageViewer
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          user={user}
        />
      )}
    </>
  );
};

export default Header;
