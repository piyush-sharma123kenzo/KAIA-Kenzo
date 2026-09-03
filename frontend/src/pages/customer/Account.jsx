import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  User, ShoppingBag, Award, Landmark, ShieldCheck, Download, Truck, 
  ExternalLink, FileText, MapPin, Heart, Lock, Trash2, Plus, AlertCircle, 
  RotateCcw, MessageSquare, Bell, Star, CheckCircle, Edit, ChevronRight, QrCode,
  Package, Clock, CheckCircle2, ArrowRight, Gift, Zap, Camera, CreditCard, Sparkles
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
import ProfileAvatar from '../../components/profile/ProfileAvatar';
import ProfileImageUploader from '../../components/profile/ProfileImageUploader';

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

  const [formMsg, setFormMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Account Overview', icon: User },
    { id: 'orders', name: 'My Orders', icon: ShoppingBag },
    { id: 'delivery', name: 'My Delivery Location', icon: Truck },
    { id: 'addresses', name: 'Saved Addresses', icon: MapPin },
    { id: 'returns', name: 'Returns & Refunds', icon: RotateCcw },
    { id: 'warranties', name: 'My Warranties', icon: Award },
    { id: 'invoices', name: 'Tax Invoices', icon: FileText },
    { id: 'reviews', name: 'My Reviews', icon: MessageSquare },
    { id: 'wishlist', name: 'My Wishlist', icon: Heart },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'profile', name: 'Profile Settings', icon: User },
    { id: 'security', name: 'Security & Password', icon: Lock },
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
        toast?.error?.('Failed to load account dashboard summary');
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
      setFormMsg({ type: 'success', text: 'Profile updated successfully.' });
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
      toast?.success?.('Profile photo updated successfully');
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

  // Security / Password update handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setFormMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setSubmitting(true);
    setFormMsg({ type: '', text: '' });
    try {
      await axiosInstance.put('/account/change-password', {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      setFormMsg({ type: 'success', text: 'Password changed successfully.' });
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast?.success?.('Password updated');
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Password update failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // Save / Edit address handler
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
        toast?.success?.('Address saved');
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans text-left pb-24 selection:bg-amber-100 selection:text-amber-900">
      
      {/* Subtle Radiant Ambient Background Accent */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-8">
        
        {/* ========================================================================= */}
        {/* 1. PROFILE HEADER CARD (Ultra-Premium Clean Light Aesthetic)               */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          
          {/* Subtle Golden Ambient Radiance */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-amber-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-slate-100/60 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center space-x-4">
              <ProfileAvatar
                user={user}
                size="lg"
                shape="rounded"
                ring={true}
                ringColor="ring-amber-400/30"
                allowPreview={Boolean(user?.profileImage?.url || user?.avatar)}
                className="shadow-sm shrink-0"
              />

              <div className="space-y-0.5">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Hello, {user?.name || 'Customer'}
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <Link to="/cart" className="flex-1 md:flex-initial">
                <button className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
                  View Cart
                </button>
              </Link>
              <Link to="/products" className="flex-1 md:flex-initial">
                <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs py-2.5 px-5 rounded-xl shadow-md shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center space-x-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Browse Catalog</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN DASHBOARD GRID (Sidebar Nav + Content Panel)                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSearchParams({ tab: tab.id })}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-xs font-semibold text-left transition-all ${
                      active
                        ? 'bg-amber-50/80 text-amber-900 font-bold border-l-4 border-amber-500 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 hover:translate-x-0.5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span>{tab.name}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={logout}
              className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 rounded-xl text-xs font-bold text-center transition-colors shadow-2xs"
            >
              Sign Out of Account
            </button>
          </div>

          {/* Right Tab Content Panel */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* =================================================================== */}
            {/* TAB 1: OVERVIEW                                                     */}
            {/* =================================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Elevated Stat Cards (5 Core Customer Metrics) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {[
                    { label: 'Total Orders', val: stats.totalOrders || 0, link: '?tab=orders', color: 'text-slate-900', bg: 'bg-white' },
                    { label: 'In-Transit', val: stats.activeOrders || 0, link: '?tab=orders', color: 'text-amber-600', bg: 'bg-white' },
                    { label: 'Delivered', val: stats.deliveredOrders || 0, link: '?tab=orders', color: 'text-emerald-600', bg: 'bg-white' },
                    { label: 'RMA Returns', val: stats.totalReturns || 0, link: '?tab=returns', color: 'text-slate-700', bg: 'bg-white' },
                    { label: 'Saved Wishlist', val: stats.wishlistCount || 0, link: '?tab=wishlist', color: 'text-rose-600', bg: 'bg-white' },
                  ].map((kpi, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (kpi.link.startsWith('?')) {
                          setSearchParams({ tab: kpi.link.replace('?tab=', '') });
                        }
                      }}
                      className={`${kpi.bg} border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:border-amber-400 hover:shadow-md hover:scale-[1.02] text-left transition-all group relative overflow-hidden`}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 transition-colors block">
                        {kpi.label}
                      </span>
                      <p className={`text-2xl font-black mt-2 tracking-tight ${kpi.color}`}>
                        {kpi.val}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Recent Orders Overview */}
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Recent Orders
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Track and view your latest purchases</p>
                    </div>
                    <button 
                      onClick={() => setSearchParams({ tab: 'orders' })} 
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1"
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
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-mono font-bold text-sm text-slate-900">{ord.orderId}</span>
                              <StatusBadge status={ord.orderStatus} />
                            </div>
                            <p className="text-xs text-slate-500 font-normal">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN')} • {ord.items?.length || 1} Item(s) • Total: ₹{ord.finalAmount?.toLocaleString('en-IN')}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <Link to={`/order-details/${ord.orderId || ord._id}/tracking`} className="flex-1 sm:flex-initial">
                              <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-1.5 px-3 rounded-lg border border-slate-200 shadow-2xs transition-all">
                                Track
                              </button>
                            </Link>
                            <Link to={`/order-details/${ord.orderId || ord._id}`} className="flex-1 sm:flex-initial">
                              <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-1.5 px-3 rounded-lg shadow-2xs transition-all">
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
            {/* TAB 2: MY ORDERS                                                    */}
            {/* =================================================================== */}
            {activeTab === 'orders' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Order History ({orders.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Direct fulfilled brand orders with verified warranty</p>
                  </div>
                </div>

                {loadingOrders ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <EmptyState
                    type="orders"
                    title="No orders placed yet"
                    description="Explore leading electronics brands with genuine warranties and instant B2B tax invoicing."
                    actionText="Start Shopping"
                    onAction={() => window.location.href = '/products'}
                    className="border-0 shadow-none py-10 text-slate-700"
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <div key={ord._id} className="py-5 space-y-3.5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center space-x-2.5">
                              <span className="font-mono font-bold text-sm text-slate-900">{ord.orderId}</span>
                              <StatusBadge status={ord.orderStatus} />
                            </div>
                            <span className="text-xs text-slate-500 font-normal block mt-1">
                              Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN')} • Payment: <strong className="text-slate-700 uppercase">{ord.paymentStatus}</strong>
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-slate-900 text-base">
                              ₹{ord.finalAmount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Items Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs">
                          {ord.items?.map((item, itIdx) => (
                            <div key={itIdx} className="flex justify-between items-center">
                              <span className="font-semibold text-slate-800 truncate max-w-[220px]">{item.productName || item.name}</span>
                              <span className="text-slate-500 font-mono text-[11px]">Qty: {item.quantity || item.qty}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-2.5 pt-1">
                          <Link to={`/order-details/${ord.orderId || ord._id}/tracking`}>
                            <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-1.5 px-3.5 rounded-lg border border-slate-200 shadow-2xs transition-all">
                              Live Tracking
                            </button>
                          </Link>
                          <Link to={`/order-details/${ord.orderId || ord._id}`}>
                            <button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-1.5 px-3.5 rounded-lg shadow-2xs transition-all">
                              Details & Invoices
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB: MY DELIVERY LOCATION                                           */}
            {/* =================================================================== */}
            {activeTab === 'delivery' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-amber-500" />
                        <span>My Delivery Location & Serviceability</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        KAIA Technologies delivers exclusively within a 10 KM radius of authorized service centers.
                      </p>
                    </div>
                    <button
                      onClick={openLocationModal}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-3.5 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Change Location</span>
                    </button>
                  </div>

                  {/* Current Active Location Card */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Currently Active Location</span>
                      </div>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        deliveryInfo?.isServiceable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {deliveryInfo?.isServiceable ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Serviceable</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Outside Service Radius</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-700">
                      <p className="text-sm font-black text-slate-900">
                        {deliveryLocation?.recipientName || user?.name || 'Customer'}
                      </p>
                      <p className="text-slate-600">
                        {deliveryLocation?.addressLine1 || deliveryLocation?.area || 'No street address specified'}, {deliveryLocation?.city} - <strong className="font-mono text-slate-900">{deliveryLocation?.postalCode || 'Not set'}</strong>
                      </p>
                      {deliveryLocation?.latitude && deliveryLocation?.longitude && (
                        <p className="font-mono text-[11px] text-slate-400">
                          GPS Coordinates: {deliveryLocation.latitude.toFixed(4)}, {deliveryLocation.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>

                    {deliveryInfo && deliveryInfo.nearestLocation && (
                      <div className="pt-2 border-t border-slate-200/60 text-xs flex items-center justify-between text-slate-600">
                        <span>Nearest Fulfillment Center: <strong>{deliveryInfo.nearestLocation}</strong></span>
                        {deliveryInfo.distance !== null && (
                          <span className="font-mono font-bold text-amber-700">
                            {deliveryInfo.distance} KM away (Max: {deliveryInfo.deliveryRadius || 10} KM)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Checker Tool */}
                <DeliveryChecker showTitle={true} />
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 3: RETURNS & REFUNDS                                            */}
            {/* =================================================================== */}
            {activeTab === 'returns' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Returns & Replacement Claims ({returns.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">RMA resolution requests and warranty replacements</p>
                  </div>
                </div>

                {loadingReturns ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : returns.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <RotateCcw className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-800">No active return or replacement requests.</p>
                    <p className="text-slate-500">All purchased hardware is running with active manufacturer coverage.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {returns.map((ret) => (
                      <div key={ret._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{ret.returnId}</span>
                            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-full">
                              {ret.status?.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="font-semibold text-xs text-slate-800">{ret.productId?.name || 'Hardware Product'}</p>
                          <span className="text-xs text-slate-500">Reason: {ret.reason}</span>
                        </div>

                        <Link to={`/account/returns/${ret._id}`}>
                          <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200 transition-all">
                            View RMA Status
                          </button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 4: WARRANTIES                                                   */}
            {/* =================================================================== */}
            {activeTab === 'warranties' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Registered Product Warranties ({warranties.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Authentic serial & IMEI mapped manufacturer protection</p>
                  </div>
                </div>

                {loadingWarranties ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : warranties.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <Award className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-800">No product warranties registered yet.</p>
                    <p className="text-slate-500">Purchasing brand items automatically registers your unit with OEM service depots.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {warranties.map((w) => (
                      <div key={w._id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-black text-amber-700 text-xs uppercase">{w.brand?.name}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full">
                            {w.status || 'Active'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 truncate">{w.product?.name || 'Hardware'}</p>
                        <div className="font-mono text-xs text-slate-600 space-y-0.5 pt-1">
                          <div>Serial: <strong className="text-slate-900">{w.maskedSerialNumber || w.serialNumber}</strong></div>
                          <div className="text-slate-500">Valid Till: {new Date(w.endDate).toLocaleDateString('en-IN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 5: TAX INVOICES                                                 */}
            {/* =================================================================== */}
            {activeTab === 'invoices' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Official GST Tax Invoices ({invoices.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Compliant B2B & B2C documentation with GST Input Tax Credit</p>
                  </div>
                </div>

                {loadingInvoices ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-800">No tax invoices available yet.</p>
                    <p className="text-slate-500">Invoices are automatically generated upon payment verification.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <div key={inv._id} className="py-3.5 flex justify-between items-center">
                        <div>
                          <p className="font-mono font-bold text-slate-900 text-xs">{inv.invoiceNumber}</p>
                          <span className="text-xs text-slate-500 font-normal">
                            {inv.brandId?.name} • ₹{inv.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <a
                          href={`http://localhost:5000/api/invoices/${inv._id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF Invoice</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 6: CUSTOMER REVIEWS                                             */}
            {/* =================================================================== */}
            {activeTab === 'reviews' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      My Verified Product Reviews ({reviews.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Feedback from authenticated customer orders</p>
                  </div>
                </div>

                {loadingReviews ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-800">You haven't reviewed any purchased products yet.</p>
                    <p className="text-slate-500">Share your hardware experience on product pages.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {reviews.map((r) => (
                      <div key={r._id} className="py-3.5 space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-xs text-slate-900">{r.product?.name}</p>
                          <div className="flex items-center text-amber-500 font-bold text-xs">
                            <Star className="w-3.5 h-3.5 fill-current mr-1" />
                            <span>{r.rating}/5</span>
                          </div>
                        </div>
                        {r.title && <p className="font-semibold text-xs text-slate-800">{r.title}</p>}
                        <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 7: WISHLIST                                                     */}
            {/* =================================================================== */}
            {activeTab === 'wishlist' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Saved Wishlist ({wishlist.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Your curated technology items</p>
                  </div>
                  <Link to="/wishlist" className="text-xs font-bold text-amber-700 hover:underline">
                    Full View →
                  </Link>
                </div>

                {loadingWishlist ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : wishlist.length === 0 ? (
                  <EmptyState
                    type="wishlist"
                    title="Your wishlist is empty"
                    description="Save components, laptops, and peripherals to track prices and availability."
                    actionText="Explore Marketplace"
                    onAction={() => window.location.href = '/products'}
                    className="border-0 shadow-none py-10 text-slate-700"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map((it) => (
                      <div key={it._id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-[190px]">{it.product?.name}</p>
                          <span className="font-black text-amber-600 mt-0.5 block">₹{it.product?.sellingPrice?.toLocaleString('en-IN')}</span>
                        </div>
                        <button 
                          onClick={() => addToCart(it.product, 1)} 
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-1.5 px-3 rounded-lg shadow-2xs transition-all"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 8: SAVED ADDRESSES                                              */}
            {/* =================================================================== */}
            {activeTab === 'addresses' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Saved Delivery Addresses ({addresses.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage residential & corporate shipping locations</p>
                  </div>
                  <button 
                    onClick={() => { setShowAddressForm(true); setEditAddressId(null); }} 
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-3.5 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </button>
                </div>

                {/* Add/Edit Address Form Modal */}
                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3.5 text-xs text-slate-900">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                        <input type="text" required value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                        <input type="text" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Address Line 1 (Flat/House/Building) *</label>
                      <input type="text" required value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Street / Area</label>
                        <input type="text" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Landmark</label>
                        <input type="text" placeholder="e.g. Near Metro Station" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">City *</label>
                        <input type="text" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">State *</label>
                        <input type="text" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">PIN Code *</label>
                        <input type="text" required value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Address Type</label>
                      <div className="flex space-x-2">
                        {['Home', 'Work', 'Other'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setAddressForm({ ...addressForm, label: t, type: t })}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                              (addressForm.type === t || addressForm.label === t)
                                ? 'bg-amber-50 border-amber-400 text-amber-900'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2.5 pt-2">
                      <button type="button" onClick={() => setShowAddressForm(false)} className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2 px-4 rounded-lg border border-slate-200 transition-all">
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-4 rounded-lg shadow-2xs transition-all">
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5 text-xs relative">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-900">{addr.name}</span>
                        {addr.isDefault ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full">Default</span>
                        ) : (
                          <button onClick={() => handleSetDefaultAddress(addr._id)} className="text-[11px] text-amber-700 hover:underline font-bold">Set as Default</button>
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                      <p className="text-slate-500 font-mono">Phone: {addr.phone}</p>
                      <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200">
                        <button onClick={() => handleDeleteAddress(addr._id)} className="text-red-600 hover:text-red-700 text-xs flex items-center space-x-1 font-bold">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 9: NOTIFICATIONS                                                */}
            {/* =================================================================== */}
            {activeTab === 'notifications' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Notifications ({notifications.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Order milestones, logistics updates, and warranty renewals</p>
                  </div>
                </div>

                {loadingNotifications ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-800">You're all caught up!</p>
                    <p className="text-slate-500">Order milestones and warranty renewals will appear here in real-time.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div key={n._id} className="py-3.5 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 10: PROFILE SETTINGS                                            */}
            {/* =================================================================== */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Personal Information
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Update your customer profile credentials</p>
                  </div>
                </div>

                {formMsg.text && (
                  <div className={`p-3.5 rounded-xl text-xs font-bold ${formMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {formMsg.text}
                  </div>
                )}

                {/* Profile Photo Upload Widget in Settings */}
                <ProfileImageUploader variant="card" size="xl" shape="rounded" />

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">First Name</label>
                      <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                      <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                      <input type="email" disabled value={user?.email || ''} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono cursor-not-allowed" />
                      <span className="text-[10px] text-slate-400 mt-1 block">Email is locked for account safety.</span>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                      <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 px-5 rounded-lg shadow-md shadow-amber-500/15 transition-all">
                      {submitting ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 11: SECURITY & PASSWORD                                         */}
            {/* =================================================================== */}
            {activeTab === 'security' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Account Password & Security
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage your security credentials and multi-factor authentication</p>
                  </div>
                </div>

                {formMsg.text && (
                  <div className={`p-3.5 rounded-xl text-xs font-bold ${formMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {formMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Current Password *</label>
                    <input type="password" required value={securityForm.currentPassword} onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">New Password (Min 8 chars) *</label>
                    <input type="password" required minLength={8} value={securityForm.newPassword} onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Confirm New Password *</label>
                    <input type="password" required minLength={8} value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900 placeholder:text-slate-400" />
                  </div>

                  <div className="flex justify-end pt-3">
                    <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 px-5 rounded-lg shadow-md shadow-amber-500/15 transition-all">
                      {submitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Account;
