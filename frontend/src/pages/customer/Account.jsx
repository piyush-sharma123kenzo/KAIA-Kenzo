import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  User, ShoppingBag, Award, Landmark, ShieldCheck, Download, Truck, 
  ExternalLink, FileText, MapPin, Heart, Lock, Trash2, Plus, AlertCircle, 
  RotateCcw, MessageSquare, Bell, Star, CheckCircle, Edit, ChevronRight, QrCode,
  Package, Clock, CheckCircle2, ArrowRight, Gift, Zap, Camera
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

const Account = () => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
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
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    label: 'Home',
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

  const tabs = [
    { id: 'overview', name: 'Account Overview', icon: User },
    { id: 'orders', name: 'My Orders', icon: ShoppingBag },
    { id: 'returns', name: 'Returns & Refunds', icon: RotateCcw },
    { id: 'warranties', name: 'My Warranties', icon: Award },
    { id: 'invoices', name: 'Tax Invoices', icon: FileText },
    { id: 'reviews', name: 'My Reviews', icon: MessageSquare },
    { id: 'wishlist', name: 'My Wishlist', icon: Heart },
    { id: 'addresses', name: 'Saved Addresses', icon: MapPin },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'profile', name: 'Profile Settings', icon: User },
    { id: 'security', name: 'Security & Password', icon: Lock },
  ];

  // Fetch Overview stats
  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      try {
        const res = await axiosInstance.get('/account/overview');
        if (res.data.success) {
          setOverviewData(res.data);
        }
      } catch (err) {
        console.error('Error fetching account overview:', err);
      } finally {
        setLoadingOverview(false);
      }
    };
    fetchOverview();
  }, []);

  // Tab-driven data loaders
  useEffect(() => {
    setFormMsg({ type: '', text: '' });

    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await axiosInstance.get('/orders/customer/my-orders');
          if (res.data.success) setOrders(res.data.orders || []);
        } catch (err) {
          console.error('Error loading orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }

    if (activeTab === 'warranties') {
      const fetchWarranties = async () => {
        setLoadingWarranties(true);
        try {
          const res = await axiosInstance.get('/account/warranty');
          if (res.data.success) setWarranties(res.data.warranties || []);
        } catch (err) {
          console.error('Error loading warranties:', err);
        } finally {
          setLoadingWarranties(false);
        }
      };
      fetchWarranties();
    }

    if (activeTab === 'invoices') {
      const fetchInvoices = async () => {
        setLoadingInvoices(true);
        try {
          const res = await axiosInstance.get('/account/invoices');
          if (res.data.success) setInvoices(res.data.invoices || []);
        } catch (err) {
          console.error('Error loading invoices:', err);
        } finally {
          setLoadingInvoices(false);
        }
      };
      fetchInvoices();
    }

    if (activeTab === 'returns') {
      const fetchReturns = async () => {
        setLoadingReturns(true);
        try {
          const res = await axiosInstance.get('/returns/my-returns');
          if (res.data.success) setReturns(res.data.returns || []);
        } catch (err) {
          console.error('Error loading returns:', err);
        } finally {
          setLoadingReturns(false);
        }
      };
      fetchReturns();
    }

    if (activeTab === 'reviews') {
      const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
          const res = await axiosInstance.get('/account/reviews');
          if (res.data.success) setReviews(res.data.reviews || []);
        } catch (err) {
          console.error('Error loading reviews:', err);
        } finally {
          setLoadingReviews(false);
        }
      };
      fetchReviews();
    }

    if (activeTab === 'wishlist') {
      const fetchWishlist = async () => {
        setLoadingWishlist(true);
        try {
          const res = await axiosInstance.get('/account/wishlist');
          if (res.data.success) setWishlist(res.data.wishlist || []);
        } catch (err) {
          console.error('Error loading wishlist:', err);
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
          if (res.data.success) setAddresses(res.data.addresses || []);
        } catch (err) {
          console.error('Error loading addresses:', err);
        }
      };
      fetchAddresses();
    }

    if (activeTab === 'notifications') {
      const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
          const res = await axiosInstance.get('/account/notifications');
          if (res.data.success) setNotifications(res.data.notifications || []);
        } catch (err) {
          console.error('Error loading notifications:', err);
        } finally {
          setLoadingNotifications(false);
        }
      };
      fetchNotifications();
    }
  }, [activeTab]);

  // Profile Update Submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg({ type: '', text: '' });
    try {
      const res = await axiosInstance.patch('/account/profile', profileForm);
      if (res.data.success) {
        if (updateProfile) updateProfile(res.data.user);
        setFormMsg({ type: 'success', text: 'Profile details updated successfully.' });
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Error updating profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Password Change Submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setFormMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setSubmitting(true);
    setFormMsg({ type: '', text: '' });
    try {
      const res = await axiosInstance.post('/account/change-password', securityForm);
      if (res.data.success) {
        setFormMsg({ type: 'success', text: 'Your password was changed successfully.' });
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Error updating password.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Address CRUD
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let res;
      if (editAddressId) {
        res = await axiosInstance.patch(`/account/addresses/${editAddressId}`, addressForm);
      } else {
        res = await axiosInstance.post('/account/addresses', addressForm);
      }
      if (res.data.success) {
        setAddresses(res.data.addresses || []);
        setShowAddressForm(false);
        setEditAddressId(null);
        setAddressForm({ name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India', label: 'Home', isDefault: false });
      }
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Error saving address.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await axiosInstance.delete(`/account/addresses/${id}`);
      if (res.data.success) {
        setAddresses(res.data.addresses || []);
        toast.showToast('Address deleted successfully.', 'info');
      }
    } catch (err) {
      toast.showToast('Error deleting address.', 'error');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const res = await axiosInstance.post(`/account/addresses/${id}/default`);
      if (res.data.success) {
        setAddresses(res.data.addresses || []);
        toast.showToast('Default delivery address updated.', 'success');
      }
    } catch (err) {
      toast.showToast('Error setting default address.', 'error');
    }
  };

  // Review Submit
  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/account/reviews', reviewForm);
      if (res.data.success) {
        setReviewModalOpen(false);
        toast.showToast('Product review published successfully.', 'success');
        const rRes = await axiosInstance.get('/account/reviews');
        if (rRes.data.success) setReviews(rRes.data.reviews || []);
      }
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Error saving product review.', 'error');
    }
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.showToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.showToast('Image size must be less than 5MB.', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result;
        if (base64Image) {
          await updateProfile({ avatar: base64Image });
          setProfileForm((prev) => ({ ...prev, avatar: base64Image }));
          toast.showToast('Profile picture updated successfully!', 'success');
        }
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.showToast('Failed to update profile picture.', 'error');
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfile({ avatar: '' });
      setProfileForm((prev) => ({ ...prev, avatar: '' }));
      toast.showToast('Profile picture removed.', 'info');
    } catch (err) {
      toast.showToast('Failed to remove profile picture.', 'error');
    }
  };

  const stats = overviewData?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8 pb-24 font-sans">
      
      {/* ========================================================================= */}
      {/* 1. PROFILE HEADER CARD (Interactive Avatar, Refined Typography, Clean)   */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-5">
          {/* Avatar with Photo Upload Button */}
          <div className="relative group/pic shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#F5B400] to-[#FFD043] text-slate-950 font-black text-2xl shadow-md ring-2 ring-amber-400/20 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'K'
              )}
            </div>
            <label
              htmlFor="account-header-avatar"
              className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover/pic:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
              title="Click to change profile picture"
            >
              <Camera className="w-4 h-4 text-[#F5B400]" />
              <span>{uploadingAvatar ? '...' : 'Change'}</span>
            </label>
            <input
              id="account-header-avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploadingAvatar}
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Hello, {user?.name || 'Customer'}
            </h1>
            <p className="text-xs text-slate-500 font-normal">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Link to="/cart" className="flex-1 md:flex-initial">
            <button className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-lg border border-slate-200 shadow-sm transition-all">
              View Cart
            </button>
          </Link>
          <Link to="/products" className="flex-1 md:flex-initial">
            <button className="w-full bg-slate-900 hover:bg-slate-800 text-[#F5B400] font-bold text-xs py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all">
              Browse Catalog
            </button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN DASHBOARD GRID (Sidebar Nav + Content Panel)                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden divide-y divide-slate-100/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-xs font-semibold text-left transition-all ${
                    active
                      ? 'bg-amber-50/90 text-amber-900 font-bold border-l-4 border-amber-500 shadow-sm'
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
            className="w-full py-3 px-4 bg-red-50/80 text-red-700 hover:bg-red-100 border border-red-200/60 rounded-xl text-xs font-semibold text-center transition-colors shadow-sm"
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
                  { label: 'Total Orders', val: stats.totalOrders || 0, link: '?tab=orders', color: 'text-slate-900' },
                  { label: 'In-Transit', val: stats.activeOrders || 0, link: '?tab=orders', color: 'text-amber-600' },
                  { label: 'Delivered', val: stats.deliveredOrders || 0, link: '?tab=orders', color: 'text-emerald-600' },
                  { label: 'RMA Returns', val: stats.totalReturns || 0, link: '?tab=returns', color: 'text-slate-700' },
                  { label: 'Saved Wishlist', val: stats.wishlistCount || 0, link: '?tab=wishlist', color: 'text-purple-600' },
                ].map((kpi, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (kpi.link.startsWith('?')) {
                        setSearchParams({ tab: kpi.link.replace('?tab=', '') });
                      }
                    }}
                    className="bg-white border border-slate-100 p-5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 text-left transition-all group"
                  >
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors block">
                      {kpi.label}
                    </span>
                    <p className={`text-2xl font-black mt-1.5 ${kpi.color}`}>
                      {kpi.val}
                    </p>
                  </button>
                ))}
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Recent Orders
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Track and view your latest purchases</p>
                  </div>
                  <button 
                    onClick={() => setSearchParams({ tab: 'orders' })} 
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1"
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
                    className="border-0 shadow-none py-8"
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
                            <button className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200 shadow-sm transition-all">
                              Track
                            </button>
                          </Link>
                          <Link to={`/order-details/${ord.orderId || ord._id}`} className="flex-1 sm:flex-initial">
                            <button className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm transition-all">
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Order History ({orders.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Direct fulfilled brand orders</p>
                </div>
              </div>

              {loadingOrders ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <EmptyState
                  type="orders"
                  title="No orders placed yet"
                  description="Explore leading electronics brands with genuine warranties and instant B2B tax invoicing."
                  actionText="Start Shopping"
                  onAction={() => window.location.href = '/products'}
                  className="border-0 shadow-none py-10"
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
                            Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN')} • Payment: {ord.paymentStatus}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-slate-900 text-base">
                            ₹{ord.finalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Items Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
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
                          <button className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-1.5 px-3.5 rounded-lg border border-slate-200 shadow-sm transition-all">
                            Live Tracking
                          </button>
                        </Link>
                        <Link to={`/order-details/${ord.orderId || ord._id}`}>
                          <button className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-1.5 px-3.5 rounded-lg shadow-sm transition-all">
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
          {/* TAB 3: RETURNS & REFUNDS                                            */}
          {/* =================================================================== */}
          {activeTab === 'returns' && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Returns & Replacement Claims ({returns.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">RMA resolution requests</p>
                </div>
              </div>

              {loadingReturns ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : returns.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <RotateCcw className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No active return or replacement requests.</p>
                  <p className="text-slate-400">All purchased hardware is running with active manufacturer coverage.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {returns.map((ret) => (
                    <div key={ret._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{ret.returnId}</span>
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full">
                            {ret.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-slate-900">{ret.productId?.name || 'Hardware Product'}</p>
                        <span className="text-xs text-slate-500">Reason: {ret.reason}</span>
                      </div>

                      <Link to={`/account/returns/${ret._id}`}>
                        <button className="bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200 shadow-sm transition-all">
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registered Product Warranties ({warranties.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Authentic serial & IMEI mapped manufacturer protection</p>
                </div>
              </div>

              {loadingWarranties ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : warranties.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <Award className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No product warranties registered yet.</p>
                  <p className="text-slate-400">Purchasing brand items automatically registers your unit with OEM service depots.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {warranties.map((w) => (
                    <div key={w._id} className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-amber-700 text-xs uppercase">{w.brand?.name}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official GST Tax Invoices ({invoices.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Compliant B2B & B2C documentation</p>
                </div>
              </div>

              {loadingInvoices ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No tax invoices available yet.</p>
                  <p className="text-slate-400">Invoices are automatically generated upon payment verification.</p>
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
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    My Verified Product Reviews ({reviews.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Feedback from authenticated orders</p>
                </div>
              </div>

              {loadingReviews ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">You haven't reviewed any purchased products yet.</p>
                  <p className="text-slate-400">Share your hardware experience on product pages.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviews.map((r) => (
                    <div key={r._id} className="py-3.5 space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-xs text-slate-900">{r.product?.name}</p>
                        <div className="flex items-center text-amber-500 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 fill-current mr-1" />
                          <span>{r.rating}/5</span>
                        </div>
                      </div>
                      {r.title && <p className="font-bold text-xs text-slate-800">{r.title}</p>}
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Saved Wishlist ({wishlist.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Your curated technology items</p>
                </div>
                <Link to="/account/wishlist" className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline">
                  Full View →
                </Link>
              </div>

              {loadingWishlist ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : wishlist.length === 0 ? (
                <EmptyState
                  type="wishlist"
                  title="Your wishlist is empty"
                  description="Save components, laptops, and peripherals to track prices and availability."
                  actionText="Explore Marketplace"
                  onAction={() => window.location.href = '/products'}
                  className="border-0 shadow-none py-10"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.map((it) => (
                    <div key={it._id} className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 truncate max-w-[190px]">{it.product?.name}</p>
                        <span className="font-extrabold text-slate-900 mt-0.5 block">₹{it.product?.sellingPrice?.toLocaleString('en-IN')}</span>
                      </div>
                      <button 
                        onClick={() => addToCart(it.product, 1)} 
                        className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm transition-all"
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Saved Delivery Addresses ({addresses.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage residential & business shipping locations</p>
                </div>
                <button 
                  onClick={() => { setShowAddressForm(true); setEditAddressId(null); }} 
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
                </button>
              </div>

              {/* Add/Edit Address Form Modal */}
              {showAddressForm && (
                <form onSubmit={handleSaveAddress} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                      <input type="text" required value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                      <input type="text" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Address Line 1 (Flat/House/Building) *</label>
                    <input type="text" required value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Street / Area</label>
                      <input type="text" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Landmark</label>
                      <input type="text" placeholder="e.g. Near Unna Enclave" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">City *</label>
                      <input type="text" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">State *</label>
                      <input type="text" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">PIN Code *</label>
                      <input type="text" required value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Address Type</label>
                    <div className="flex space-x-2">
                      {['Home', 'Work', 'Other'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAddressForm({ ...addressForm, label: t, type: t })}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                            (addressForm.type === t || addressForm.label === t)
                              ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
                    <button type="submit" disabled={submitting} className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-all">
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr._id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-2.5 text-xs relative">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{addr.name}</span>
                      {addr.isDefault ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">Default</span>
                      ) : (
                        <button onClick={() => handleSetDefaultAddress(addr._id)} className="text-[11px] text-amber-700 hover:underline font-medium">Set as Default</button>
                      )}
                    </div>
                    <p className="text-slate-600 leading-relaxed">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                    <p className="text-slate-500 font-mono">Phone: {addr.phone}</p>
                    <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                      <button onClick={() => handleDeleteAddress(addr._id)} className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1 font-medium">
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Notifications ({notifications.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Order updates & warranty reminders</p>
                </div>
              </div>

              {loadingNotifications ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">You're all caught up!</p>
                  <p className="text-slate-400">Order milestones and warranty renewals will be notified here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div key={n._id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-xs text-slate-900">{n.title}</p>
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Personal Information
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Update your customer profile details</p>
                </div>
              </div>

              {formMsg.text && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold ${formMsg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                  {formMsg.text}
                </div>
              )}

              {/* Profile Photo Upload Widget in Settings */}
              <div className="flex items-center space-x-5 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#F5B400] to-[#FFD043] text-slate-950 font-black text-2xl shadow-sm ring-2 ring-amber-400/20 flex items-center justify-center shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || 'K'
                  )}
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs text-slate-900">Profile Picture</h4>
                  <p className="text-[11px] text-slate-500">Upload a custom image for your profile and orders (PNG, JPG, max 5MB)</p>
                  <div className="flex items-center space-x-2 pt-1">
                    <label
                      htmlFor="settings-avatar-upload"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-[#F5B400] rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                    </label>
                    <input
                      id="settings-avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                    {user?.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">First Name</label>
                    <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
                    <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                    <input type="email" disabled value={user?.email || ''} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-mono" />
                    <span className="text-[10px] text-slate-400 mt-1 block">Email is locked for account safety.</span>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                    <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-amber-500 bg-white" />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button type="submit" disabled={submitting} className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-2.5 px-5 rounded-lg shadow-sm transition-all">
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
            <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 md:p-7 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Account Password & Security
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your credential credentials</p>
                </div>
              </div>

              {formMsg.text && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold ${formMsg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                  {formMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Current Password *</label>
                  <input type="password" required value={securityForm.currentPassword} onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">New Password (Min 8 chars) *</label>
                  <input type="password" required minLength={8} value={securityForm.newPassword} onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Confirm New Password *</label>
                  <input type="password" required minLength={8} value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                </div>

                <div className="flex justify-end pt-3">
                  <button type="submit" disabled={submitting} className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-2.5 px-5 rounded-lg shadow-sm transition-all">
                    {submitting ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Account;
