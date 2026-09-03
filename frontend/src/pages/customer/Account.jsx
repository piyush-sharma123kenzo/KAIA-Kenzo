import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  User, ShoppingBag, Award, Landmark, ShieldCheck, Download, Truck, 
  ExternalLink, FileText, MapPin, Heart, Lock, Trash2, Plus, AlertCircle, 
  RotateCcw, MessageSquare, Bell, Star, CheckCircle, Edit, ChevronRight, QrCode,
  Package, Clock, CheckCircle2, ArrowRight, Gift, Zap, Camera, CreditCard, Sparkles,
  ChevronDown, Copy, Check, Eye, EyeOff, ShieldAlert, RefreshCw
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import axiosInstance from '../../api/axiosInstance';
import { Skeleton } from '../../components/feedback/Skeleton';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import KaiaIcon from '../../components/common/KaiaIcon';
import DeliveryChecker from '../../components/common/DeliveryChecker';
import { useLocationContext } from '../../context/LocationContext';
import { getAvatarSrc } from '../../utils/imageUtils';

const Account = () => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const { deliveryLocation, deliveryInfo, openLocationModal } = useLocationContext() || {};
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  // Overview stats & data
  const [overviewData, setOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Warranties state
  const [warranties, setWarranties] = useState([]);
  const [loadingWarranties, setLoadingWarranties] = useState(false);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Returns state
  const [returns, setReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ productId: '', productName: '', rating: 5, title: '', comment: '' });

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editAddressId, setEditAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    label: 'Home',
    type: 'Home',
    isDefault: false,
  });

  // Wishlist state
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  // Security Form state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formMsg, setFormMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const navigationSections = [
    {
      title: 'SHOPPING & ORDERS',
      items: [
        { id: 'overview', name: 'Dashboard Overview', icon: User },
        { id: 'orders', name: 'My Orders & Tracking', icon: ShoppingBag, badge: overviewData?.stats?.activeOrders ? `${overviewData.stats.activeOrders} Active` : null },
        { id: 'wishlist', name: 'Saved Wishlist', icon: Heart, count: overviewData?.stats?.wishlistCount },
        { id: 'returns', name: 'Returns & Refunds', icon: RotateCcw },
      ]
    },
    {
      title: 'HARDWARE & COMPLIANCE',
      items: [
        { id: 'warranties', name: 'Hardware Warranties', icon: Award, count: overviewData?.stats?.warrantyCount },
        { id: 'invoices', name: 'Tax Invoices & GST', icon: FileText },
        { id: 'reviews', name: 'Verified Reviews', icon: MessageSquare },
      ]
    },
    {
      title: 'ACCOUNT & PREFERENCES',
      items: [
        { id: 'delivery', name: 'Delivery Hub & PIN', icon: Truck },
        { id: 'addresses', name: 'Shipping Addresses', icon: MapPin },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'profile', name: 'Profile Information', icon: Sparkles },
        { id: 'security', name: 'Security & Password', icon: Lock },
      ]
    }
  ];

  // Fetch Overview Data on mount
  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        const res = await axiosInstance.get('/account/overview');
        setOverviewData(res.data);
      } catch (err) {
        console.error('[KAIA Account] Failed to load overview:', err);
      } finally {
        setLoadingOverview(false);
      }
    };
    fetchOverview();
  }, []);

  // Synchronize profile form when user updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  // Tab-specific data fetching
  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await axiosInstance.get('/orders/my-orders');
          setOrders(res.data.orders || []);
        } catch (err) {
          console.error('[KAIA Account] Orders error:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }

    if (activeTab === 'warranties' && warranties.length === 0) {
      const fetchWarranties = async () => {
        setLoadingWarranties(true);
        try {
          const res = await axiosInstance.get('/warranties/my-warranties');
          setWarranties(res.data.warranties || []);
        } catch (err) {
          console.error('[KAIA Account] Warranties error:', err);
        } finally {
          setLoadingWarranties(false);
        }
      };
      fetchWarranties();
    }

    if (activeTab === 'invoices' && invoices.length === 0) {
      const fetchInvoices = async () => {
        setLoadingInvoices(true);
        try {
          const res = await axiosInstance.get('/invoices/my-invoices');
          setInvoices(res.data.invoices || []);
        } catch (err) {
          console.error('[KAIA Account] Invoices error:', err);
        } finally {
          setLoadingInvoices(false);
        }
      };
      fetchInvoices();
    }

    if (activeTab === 'returns' && returns.length === 0) {
      const fetchReturns = async () => {
        setLoadingReturns(true);
        try {
          const res = await axiosInstance.get('/returns/my-returns');
          setReturns(res.data.returns || []);
        } catch (err) {
          console.error('[KAIA Account] Returns error:', err);
        } finally {
          setLoadingReturns(false);
        }
      };
      fetchReturns();
    }

    if (activeTab === 'reviews' && reviews.length === 0) {
      const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
          const res = await axiosInstance.get('/reviews/my-reviews');
          setReviews(res.data.reviews || []);
        } catch (err) {
          console.error('[KAIA Account] Reviews error:', err);
        } finally {
          setLoadingReviews(false);
        }
      };
      fetchReviews();
    }

    if (activeTab === 'wishlist' && wishlist.length === 0) {
      const fetchWishlist = async () => {
        setLoadingWishlist(true);
        try {
          const res = await axiosInstance.get('/account/wishlist');
          setWishlist(res.data.wishlist || []);
        } catch (err) {
          console.error('[KAIA Account] Wishlist error:', err);
        } finally {
          setLoadingWishlist(false);
        }
      };
      fetchWishlist();
    }

    if (activeTab === 'addresses') {
      const fetchAddresses = async () => {
        try {
          const res = await axiosInstance.get('/account/addresses');
          setAddresses(res.data.addresses || []);
        } catch (err) {
          console.error('[KAIA Account] Addresses error:', err);
        }
      };
      fetchAddresses();
    }

    if (activeTab === 'notifications' && notifications.length === 0) {
      const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
          const res = await axiosInstance.get('/account/notifications');
          setNotifications(res.data.notifications || []);
        } catch (err) {
          console.error('[KAIA Account] Notifications error:', err);
        } finally {
          setLoadingNotifications(false);
        }
      };
      fetchNotifications();
    }
  }, [activeTab]);

  // Profile update handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg({ type: '', text: '' });
    try {
      const res = await axiosInstance.put('/account/profile', profileForm);
      if (updateProfile) updateProfile(res.data.user);
      setFormMsg({ type: 'success', text: 'Profile information updated successfully.' });
      toast?.success?.('Profile details updated');
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
      toast?.error?.('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  // Avatar Upload Handler
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast?.error?.('Image size exceeds 5MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await axiosInstance.post('/account/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = res.data?.user || res.data;
      const avatarUrl = res.data?.avatar || updatedUser?.avatar;

      if (updateProfile) updateProfile(updatedUser);
      setProfileForm((prev) => ({ ...prev, avatar: avatarUrl }));
      toast?.success?.('Profile picture updated successfully');
    } catch (err) {
      console.error('[KAIA Account] Avatar upload failed:', err);
      toast?.error?.(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleGenerateAvatar = async () => {
    const seed = `${user?.email || 'kaia'}-${Date.now()}`;
    const generatedUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    try {
      setUploadingAvatar(true);
      const res = await axiosInstance.patch('/account/profile', { avatar: generatedUrl });
      if (updateProfile) updateProfile(res.data.user);
      setProfileForm((prev) => ({ ...prev, avatar: generatedUrl }));
      toast?.success?.('New 3D avatar generated and set!');
    } catch (err) {
      toast?.error?.('Failed to generate avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await axiosInstance.delete('/account/avatar');
      if (updateProfile) updateProfile(res.data.user);
      setProfileForm((prev) => ({ ...prev, avatar: '' }));
      toast?.success?.('Profile photo removed');
    } catch (err) {
      toast?.error?.('Failed to remove photo');
    }
  };

  // Password change handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setFormMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (securityForm.newPassword.length < 6) {
      setFormMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setSubmitting(true);
    setFormMsg({ type: '', text: '' });
    try {
      await axiosInstance.post('/account/change-password', {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      setFormMsg({ type: 'success', text: 'Password changed successfully.' });
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast?.success?.('Password changed successfully');
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed' });
      toast?.error?.('Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  // Address Save Handler
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editAddressId) {
        const res = await axiosInstance.put(`/account/addresses/${editAddressId}`, addressForm);
        setAddresses(addresses.map((a) => (a._id === editAddressId ? res.data.address : a)));
        toast?.success?.('Address updated');
      } else {
        const res = await axiosInstance.post('/account/addresses', addressForm);
        setAddresses([...addresses, res.data.address]);
        toast?.success?.('New address added');
      }
      setShowAddressForm(false);
      setEditAddressId(null);
      setAddressForm({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        label: 'Home',
        type: 'Home',
        isDefault: false,
      });
    } catch (err) {
      toast?.error?.('Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      await axiosInstance.delete(`/account/addresses/${id}`);
      setAddresses(addresses.filter((a) => a._id !== id));
      toast?.success?.('Address removed');
    } catch (err) {
      toast?.error?.('Failed to delete address');
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (id) => {
    try {
      await axiosInstance.put(`/account/addresses/${id}/default`);
      setAddresses(addresses.map((a) => ({ ...a, isDefault: a._id === id })));
      toast?.success?.('Default shipping address updated');
    } catch (err) {
      toast?.error?.('Failed to set default address');
    }
  };

  const stats = overviewData?.stats || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-left pb-24 selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Subtle Ambient Glow */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-amber-100/40 via-orange-50/20 to-transparent pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. ULTRA-PREMIUM PROFILE HERO CARD (White Glassmorphic Aesthetic)         */}
        {/* ========================================================================= */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            
            {/* User Details & Avatar */}
            <div className="flex items-center space-x-5">
              <div className="relative group/avatar shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 text-slate-950 font-black text-2xl shadow-md ring-4 ring-amber-400/30 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={getAvatarSrc(user.avatar)} alt={user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'K'
                  )}
                </div>
                
                {/* Overlay on hover */}
                <label
                  htmlFor="account-hero-avatar-file"
                  className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer text-[10px] font-bold backdrop-blur-2xs"
                  title="Upload custom photo"
                >
                  <Camera className="w-5 h-5 text-amber-400 mb-0.5" />
                  <span>{uploadingAvatar ? '...' : 'Upload'}</span>
                </label>
                <input
                  id="account-hero-avatar-file"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    {user?.name || 'Customer'}
                  </h1>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300/80 rounded-full text-[11px] font-black shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                    <span>KAIA Member</span>
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 font-mono flex items-center space-x-2">
                  <span>{user?.email}</span>
                  {user?.phone && (
                    <>
                      <span>•</span>
                      <span>{user.phone}</span>
                    </>
                  )}
                </p>

                {/* Quick Profile Actions */}
                <div className="flex items-center space-x-3 pt-0.5 text-[11px] font-bold">
                  <button
                    onClick={() => setSearchParams({ tab: 'profile' })}
                    className="text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit Profile & Avatar</span>
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={handleGenerateAvatar}
                    disabled={uploadingAvatar}
                    className="text-slate-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>1-Click 3D Avatar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => openLocationModal && openLocationModal()}
                className="flex-1 lg:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>{deliveryLocation?.postalCode ? `PIN: ${deliveryLocation.postalCode}` : 'Delivery Hub'}</span>
              </button>

              <Link to="/cart" className="flex-1 lg:flex-initial">
                <button className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                  <span>View Cart</span>
                </button>
              </Link>

              <Link to="/products" className="flex-1 lg:flex-initial">
                <button className="w-full inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Browse Catalog</span>
                </button>
              </Link>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN DASHBOARD CONTENT GRID (Left Sidebar + Content Panel)             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-3 space-y-4 overflow-hidden">
              
              {navigationSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <h4 className="px-3 pt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {section.title}
                  </h4>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSearchParams({ tab: item.id })}
                          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/15'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                            <span className="truncate">{item.name}</span>
                          </div>

                          {item.badge ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              active ? 'bg-slate-950 text-amber-400' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {item.badge}
                            </span>
                          ) : item.count !== undefined && item.count > 0 ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              active ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.count}
                            </span>
                          ) : (
                            active && <ChevronRight className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-2xl text-xs font-black text-center transition-all cursor-pointer shadow-2xs"
                >
                  <span>Sign Out of Account</span>
                </button>
              </div>

            </div>

            {/* Quick Delivery Card */}
            <div className="bg-gradient-to-br from-white to-amber-50/50 border border-amber-200/70 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Delivery Hub</h4>
                  <p className="text-[11px] text-slate-500">10 KM Express Delivery</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Currently delivering to {deliveryLocation?.area || deliveryLocation?.city || 'Delhi NCR'} ({deliveryLocation?.postalCode || '110091'}).
              </p>
              <button
                onClick={() => openLocationModal && openLocationModal()}
                className="w-full py-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/90 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Change PIN Code
              </button>
            </div>
          </div>

          {/* Right Tab Content Panel */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* =================================================================== */}
            {/* TAB 1: OVERVIEW                                                     */}
            {/* =================================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 5 Core Customer Metric Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {[
                    { label: 'Total Orders', val: stats.totalOrders || 0, link: 'orders', color: 'text-slate-950', icon: ShoppingBag, bg: 'from-slate-50 to-white' },
                    { label: 'In-Transit', val: stats.activeOrders || 0, link: 'orders', color: 'text-amber-600', icon: Truck, bg: 'from-amber-50/60 to-white' },
                    { label: 'Delivered', val: stats.deliveredOrders || 0, link: 'orders', color: 'text-emerald-600', icon: CheckCircle2, bg: 'from-emerald-50/60 to-white' },
                    { label: 'RMA Returns', val: stats.totalReturns || 0, link: 'returns', color: 'text-slate-700', icon: RotateCcw, bg: 'from-slate-50 to-white' },
                    { label: 'Saved Wishlist', val: stats.wishlistCount || 0, link: 'wishlist', color: 'text-rose-600', icon: Heart, bg: 'from-rose-50/60 to-white' },
                  ].map((kpi, idx) => {
                    const KpiIcon = kpi.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSearchParams({ tab: kpi.link })}
                        className={`bg-gradient-to-b ${kpi.bg} border border-slate-200/90 p-4 sm:p-5 rounded-2xl shadow-xs hover:border-amber-400 hover:shadow-md hover:scale-[1.02] text-left transition-all group relative overflow-hidden cursor-pointer`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-700">
                            {kpi.label}
                          </span>
                          <KpiIcon className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                        </div>
                        <p className={`text-2xl sm:text-3xl font-black mt-2 tracking-tight ${kpi.color}`}>
                          {kpi.val}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Recent Orders Overview Card */}
                <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-7 space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        Recent Orders
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Track live shipments and download GST tax invoices</p>
                    </div>
                    <button 
                      onClick={() => setSearchParams({ tab: 'orders' })} 
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>View All Orders</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!overviewData?.recentOrders || overviewData.recentOrders.length === 0 ? (
                    <EmptyState
                      type="orders"
                      title="Your order history is clean."
                      description="When you order computing components, smartphones, or accessories, they will appear here with live tracking."
                      actionText="Browse Marketplace"
                      onAction={() => window.location.href = '/products'}
                      className="border-0 shadow-none py-8 text-slate-700"
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {overviewData.recentOrders.map((ord) => (
                        <div key={ord._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono font-black text-sm text-slate-900">{ord.orderId}</span>
                              <StatusBadge status={ord.orderStatus} />
                            </div>
                            <p className="text-xs text-slate-500">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {ord.items?.length || 1} Item(s) • Total: <strong className="text-slate-900 font-bold">₹{ord.finalAmount?.toLocaleString('en-IN')}</strong>
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <Link to={`/order-details/${ord.orderId || ord._id}/tracking`} className="flex-1 sm:flex-initial">
                              <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-200/90 shadow-2xs transition-all cursor-pointer">
                                Track
                              </button>
                            </Link>
                            <Link to={`/order-details/${ord.orderId || ord._id}`} className="flex-1 sm:flex-initial">
                              <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-3.5 rounded-xl shadow-2xs transition-all cursor-pointer">
                                Details
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 2: MY ORDERS & TRACKING                                         */}
            {/* =================================================================== */}
            {activeTab === 'orders' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Order History & Shipments ({orders.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage deliveries, warranty claims, and returns</p>
                  </div>
                  <Link to="/products">
                    <button className="px-3.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors">
                      + New Order
                    </button>
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </div>
                ) : orders.length === 0 ? (
                  <EmptyState
                    type="orders"
                    title="No orders placed yet"
                    description="Your purchases and live tracking updates will show here."
                    actionText="Start Shopping"
                    onAction={() => window.location.href = '/products'}
                    className="border-0 py-10"
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <div key={ord._id} className="py-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-mono font-black text-sm text-slate-900">{ord.orderId}</span>
                              <StatusBadge status={ord.orderStatus} />
                            </div>
                            <p className="text-xs text-slate-500">
                              Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN')} • Payment: {ord.paymentMethod?.toUpperCase()}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Link to={`/order-details/${ord.orderId || ord._id}`}>
                              <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-2xs">
                                View Order Details
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 3: PROFILE SETTINGS & AVATAR GENERATOR                          */}
            {/* =================================================================== */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Profile Information & Avatar
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your personal credentials, profile picture, and recipient phone</p>
                </div>

                {/* Profile Avatar Management Box */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-gradient-to-r from-amber-50/50 to-orange-50/30 border border-amber-200/80 rounded-2xl">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 text-slate-950 font-black text-2xl shadow-md ring-4 ring-amber-400/25 flex items-center justify-center shrink-0">
                    {user?.avatar ? (
                      <img src={getAvatarSrc(user.avatar)} alt={user.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase() || 'K'
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">Profile Picture & Avatar</h4>
                      <p className="text-xs text-slate-500">Upload your own photo or create a custom 3D vector avatar with 1 click</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <label
                        htmlFor="profile-tab-avatar-upload"
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black cursor-pointer transition-all shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                      </label>
                      <input
                        id="profile-tab-avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />

                      <button
                        type="button"
                        onClick={handleGenerateAvatar}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Generate 3D Avatar</span>
                      </button>

                      {user?.avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200/90 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {formMsg.text && (
                  <div className={`p-4 rounded-xl text-xs font-bold ${
                    formMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {formMsg.text}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">First Name</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white text-slate-900 font-medium placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white text-slate-900 font-medium placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white text-slate-900 font-medium placeholder:text-slate-400"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/15 transition-all cursor-pointer"
                    >
                      {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 4: SECURITY & PASSWORD                                          */}
            {/* =================================================================== */}
            {activeTab === 'security' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Security & Account Password
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Ensure your account is protected with a strong credentials</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-lg">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      required
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 bg-white text-slate-900"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/15 transition-all cursor-pointer"
                    >
                      {submitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 5: SAVED ADDRESSES                                              */}
            {/* =================================================================== */}
            {activeTab === 'addresses' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Saved Shipping Addresses ({addresses.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage delivery destinations for fast checkout</p>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-2xs cursor-pointer"
                  >
                    {showAddressForm ? 'Cancel' : '+ Add Address'}
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs">
                    <h4 className="font-black text-sm text-slate-900">{editAddressId ? 'Edit Address' : 'New Address Details'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Address Line 1</label>
                      <input
                        type="text"
                        required
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                        placeholder="House / Flat No., Building Name, Street"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">PIN Code</label>
                        <input
                          type="text"
                          required
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-2xs cursor-pointer"
                    >
                      {submitting ? 'Saving...' : 'Save Address'}
                    </button>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <EmptyState
                    type="cart"
                    title="No addresses saved"
                    description="Save delivery addresses to speed up checkout."
                    className="border-0 py-8"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr._id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-slate-900">{addr.name}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md">Default</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">Phone: {addr.phone}</p>
                        <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/60">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr._id)}
                              className="text-[11px] font-bold text-amber-700 hover:underline"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="text-[11px] font-bold text-rose-600 hover:underline ml-auto"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 6: HARDWARE WARRANTIES                                          */}
            {/* =================================================================== */}
            {activeTab === 'warranties' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Hardware Warranty Registry ({warranties.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verified digital certificates backed by manufacturer serial tracking</p>
                </div>

                {warranties.length === 0 ? (
                  <EmptyState
                    type="wishlist"
                    title="No active warranty items"
                    description="When you purchase hardware from verified brands, warranty certificates will be issued here."
                    actionText="Browse Hardware"
                    onAction={() => window.location.href = '/products'}
                    className="border-0 py-8"
                  />
                ) : (
                  <div className="space-y-4">
                    {warranties.map((w) => (
                      <div key={w._id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-slate-900">{w.productName || 'Hardware Component'}</h4>
                          <p className="text-xs text-slate-500 font-mono">Serial: {w.serialNumber || 'KAIA-HW-9982'}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg">
                          Active (3 Years)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 7: TAX INVOICES                                                 */}
            {/* =================================================================== */}
            {activeTab === 'invoices' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    GST Tax Invoices & Receipts ({invoices.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Download official GST-compliant tax invoices for corporate compliance</p>
                </div>

                {invoices.length === 0 ? (
                  <EmptyState
                    type="orders"
                    title="No invoices generated yet"
                    description="Invoices are generated upon successful order confirmation."
                    className="border-0 py-8"
                  />
                ) : (
                  <div className="space-y-3">
                    {invoices.map((inv) => (
                      <div key={inv._id} className="p-4 border border-slate-200 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-slate-900">{inv.invoiceNumber}</p>
                          <p className="text-[11px] text-slate-500">Amount: ₹{inv.totalAmount?.toLocaleString('en-IN')}</p>
                        </div>
                        <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-lg flex items-center space-x-1.5">
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 8: WISHLIST                                                     */}
            {/* =================================================================== */}
            {activeTab === 'wishlist' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Saved Technology Wishlist ({wishlist.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Keep track of price drops and stock alerts</p>
                </div>

                {wishlist.length === 0 ? (
                  <EmptyState
                    type="wishlist"
                    title="Your wishlist is empty"
                    description="Save genuine components to purchase later."
                    actionText="Discover Products"
                    onAction={() => window.location.href = '/products'}
                    className="border-0 py-8"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {wishlist.map((item) => (
                      <div key={item._id} className="p-4 border border-slate-200 rounded-2xl space-y-3">
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{item.name}</h4>
                        <p className="font-black text-sm text-slate-900">₹{item.price?.toLocaleString('en-IN')}</p>
                        <button className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl">
                          Move to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 9: RETURNS & REFUNDS                                            */}
            {/* =================================================================== */}
            {activeTab === 'returns' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Returns & RMA Replacements ({returns.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Track warranty claims, doorstep pickups, and refund processing</p>
                </div>

                <EmptyState
                  type="cart"
                  title="No active return requests"
                  description="Eligible delivered items can be returned within 7 days of delivery."
                  actionText="View Delivered Orders"
                  onAction={() => setSearchParams({ tab: 'orders' })}
                  className="border-0 py-8"
                />
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 10: NOTIFICATIONS                                               */}
            {/* =================================================================== */}
            {activeTab === 'notifications' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Customer Notifications ({notifications.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time alerts regarding order dispatches and price drops</p>
                </div>

                <EmptyState
                  type="search"
                  title="You're all caught up"
                  description="No unread alerts or notifications at this moment."
                  className="border-0 py-8"
                />
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 11: REVIEWS                                                     */}
            {/* =================================================================== */}
            {activeTab === 'reviews' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    My Hardware Reviews ({reviews.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Community ratings and genuine feedback provided by your account</p>
                </div>

                <EmptyState
                  type="wishlist"
                  title="No reviews written yet"
                  description="Share your verified experience to help other PC builders and tech enthusiasts."
                  className="border-0 py-8"
                />
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 12: DELIVERY LOCATION PREFERENCES                               */}
            {/* =================================================================== */}
            {activeTab === 'delivery' && (
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Current Delivery Hub & Service Area
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">10 KM Express Delivery radius coverage</p>
                </div>

                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        {deliveryLocation?.area || deliveryLocation?.city || 'Delhi Hub'}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">PIN Code: {deliveryLocation?.postalCode || '110091'}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => openLocationModal && openLocationModal()}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                      Update / Change Delivery Location
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default Account;
