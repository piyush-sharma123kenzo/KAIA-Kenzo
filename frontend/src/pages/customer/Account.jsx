import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  User, ShoppingBag, Award, Landmark, ShieldCheck, Download, Truck, 
  ExternalLink, FileText, MapPin, Heart, Lock, Trash2, Plus, AlertCircle, 
  RotateCcw, MessageSquare, Bell, Star, CheckCircle, Edit, ChevronRight, QrCode,
  Package, Clock, CheckCircle2, ArrowRight, Gift, Zap, Camera, CreditCard, Sparkles,
  RefreshCw, Check
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
import { useWishlist } from '../../context/WishlistContext';
import { getAvatarSrc } from '../../utils/imageUtils';
import ProfileAvatar from '../../components/profile/ProfileAvatar';
import ProfileImageUploader from '../../components/profile/ProfileImageUploader';

const Account = () => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const { wishlist: contextWishlist, removeFromWishlist, moveToCart: moveWishlistToCart, loading: loadingWishlist } = useWishlist() || {};
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
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'orders', name: 'My Orders', icon: ShoppingBag },
    { id: 'delivery', name: 'Delivery Location', icon: Truck },
    { id: 'addresses', name: 'Saved Addresses', icon: MapPin },
    { id: 'returns', name: 'Returns & Refunds', icon: RotateCcw },
    { id: 'warranties', name: 'Warranties', icon: Award },
    { id: 'invoices', name: 'Tax Invoices', icon: FileText },
    { id: 'reviews', name: 'My Reviews', icon: MessageSquare },
    { id: 'wishlist', name: 'Saved Wishlist', icon: Heart },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'profile', name: 'Profile Settings', icon: User },
    { id: 'security', name: 'Security & Password', icon: Lock },
  ];

  // Fetch Overview Data on mount
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

  useEffect(() => {
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

    if (activeTab === 'notifications') {
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

  const handleMarkNotificationRead = async (id) => {
    try {
      await axiosInstance.patch(`/account/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('[KAIA Account] Error marking notification read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await axiosInstance.post('/account/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast?.success?.('All notifications marked as read');
    } catch (err) {
      console.error('[KAIA Account] Error marking all notifications read:', err);
    }
  };

  const handleDeleteCustomerNotification = async (id) => {
    try {
      await axiosInstance.delete(`/account/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast?.success?.('Notification removed');
    } catch (err) {
      console.error('[KAIA Account] Error deleting notification:', err);
    }
  };

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
      toast?.success?.('Default address updated');
    } catch (err) {
      toast?.error?.('Failed to set default address');
    }
  };

  const stats = overviewData?.stats || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans text-left pb-24">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. EXECUTIVE USER PROFILE HERO CARD                                      */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center space-x-4">
              <ProfileAvatar
                user={user}
                size="lg"
                shape="circle"
                ring={true}
                ringColor="ring-amber-500/20"
                allowPreview={Boolean(user?.profileImage?.url || user?.avatar)}
                className="shadow-sm shrink-0"
              />

              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                    {user?.name || 'Customer Account'}
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified Customer
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Quick Navigation Actions */}
            <div className="flex items-center space-x-2.5 w-full md:w-auto">
              <Link to="/cart" className="flex-1 md:flex-initial">
                <button className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition-colors shadow-2xs">
                  View Cart
                </button>
              </Link>
              <Link to="/products" className="flex-1 md:flex-initial">
                <button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-amber-500/15 transition-all flex items-center justify-center space-x-1.5">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-2 space-y-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSearchParams({ tab: tab.id })}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{tab.name}</span>
                    </div>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-slate-950" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold text-center transition-colors shadow-2xs flex items-center justify-center space-x-2"
            >
              <span>Sign Out</span>
            </button>
          </div>

          {/* Right Tab Content Panel */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* =================================================================== */}
            {/* TAB 1: OVERVIEW                                                     */}
            {/* =================================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 5 Core Customer Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Total Orders', val: stats.totalOrders || 0, link: '?tab=orders', color: 'text-slate-900' },
                    { label: 'In-Transit', val: stats.activeOrders || 0, link: '?tab=orders', color: 'text-amber-600' },
                    { label: 'Delivered', val: stats.deliveredOrders || 0, link: '?tab=orders', color: 'text-emerald-600' },
                    { label: 'Returns', val: stats.totalReturns || 0, link: '?tab=returns', color: 'text-slate-700' },
                    { label: 'Wishlist', val: stats.wishlistCount || 0, link: '?tab=wishlist', color: 'text-rose-600' },
                  ].map((kpi, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (kpi.link.startsWith('?')) {
                          setSearchParams({ tab: kpi.link.replace('?tab=', '') });
                        }
                      }}
                      className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm hover:border-amber-400 hover:shadow-md text-left transition-all group"
                    >
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {kpi.label}
                      </span>
                      <p className={`text-2xl font-bold mt-1 tracking-tight ${kpi.color}`}>
                        {kpi.val}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Recent Orders Overview */}
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Recent Orders
                      </h3>
                      <p className="text-xs text-slate-500">Track and view your latest purchases</p>
                    </div>
                    <button 
                      onClick={() => setSearchParams({ tab: 'orders' })} 
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!overviewData?.recentOrders || overviewData.recentOrders.length === 0 ? (
                    <EmptyState
                      type="orders"
                      title="No recent orders"
                      description="Items you order will appear here with live tracking."
                      actionText="Browse Products"
                      onAction={() => window.location.href = '/products'}
                      className="border-0 shadow-none py-8 text-slate-700"
                    />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {overviewData.recentOrders.map((ord) => (
                        <div key={ord._id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs text-slate-900">{ord.orderId}</span>
                              <StatusBadge status={ord.orderStatus} />
                            </div>
                            <p className="text-xs text-slate-500">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN')} • {ord.items?.length || 1} Item(s) • Total: ₹{ord.finalAmount?.toLocaleString('en-IN')}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <Link to={`/order-details/${ord.orderId || ord._id}/tracking`} className="flex-1 sm:flex-initial">
                              <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200 transition-colors">
                                Track
                              </button>
                            </Link>
                            <Link to={`/order-details/${ord.orderId || ord._id}`} className="flex-1 sm:flex-initial">
                              <button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors">
                                Details
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Delivery Status Snapshot */}
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900">Delivery Serviceability</h3>
                    </div>
                    <button
                      onClick={openLocationModal}
                      className="text-xs font-semibold text-amber-700 hover:underline cursor-pointer"
                    >
                      Change Pin
                    </button>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {deliveryLocation?.city ? `${deliveryLocation.city} - ${deliveryLocation.postalCode || ''}` : 'Location not set'}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {deliveryInfo?.isServiceable ? 'Within active service radius' : 'Check serviceability for instant delivery'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                      deliveryInfo?.isServiceable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {deliveryInfo?.isServiceable ? 'Serviceable' : 'Standard Delivery'}
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 2: MY ORDERS                                                    */}
            {/* =================================================================== */}
            {activeTab === 'orders' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Order History ({orders.length})
                  </h3>
                  <p className="text-xs text-slate-500">All completed and active purchases</p>
                </div>

                {loadingOrders ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <EmptyState
                    type="orders"
                    title="No orders placed yet"
                    description="Explore leading electronics brands with genuine warranties."
                    actionText="Browse Products"
                    onAction={() => window.location.href = '/products'}
                    className="border-0 shadow-none py-10 text-slate-700"
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <div key={ord._id} className="py-4 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs text-slate-900">{ord.orderId}</span>
                              <StatusBadge status={ord.orderStatus} />
                            </div>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN')} • Payment: <strong className="text-slate-700 uppercase">{ord.paymentStatus}</strong>
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-slate-900 text-base">
                              ₹{ord.finalAmount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Items Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs">
                          {ord.items?.map((item, itIdx) => (
                            <div key={itIdx} className="flex justify-between items-center">
                              <span className="font-medium text-slate-800 truncate max-w-[200px]">{item.productName || item.name}</span>
                              <span className="text-slate-500 font-mono text-[11px]">Qty: {item.quantity || item.qty}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-2 pt-1">
                          <Link to={`/order-details/${ord.orderId || ord._id}/tracking`}>
                            <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200 transition-colors">
                              Live Tracking
                            </button>
                          </Link>
                          <Link to={`/order-details/${ord.orderId || ord._id}`}>
                            <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors">
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
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-500" />
                        <span>Delivery Location & Serviceability</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Check coverage and fulfillment center distance
                      </p>
                    </div>
                    <button
                      onClick={openLocationModal}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Change Location</span>
                    </button>
                  </div>

                  {/* Current Active Location Card */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Location</span>
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        deliveryInfo?.isServiceable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {deliveryInfo?.isServiceable ? 'Serviceable' : 'Outside Radius'}
                      </span>
                    </div>

                    <div className="text-xs space-y-0.5 text-slate-700">
                      <p className="font-bold text-slate-900">
                        {deliveryLocation?.recipientName || user?.name || 'Customer'}
                      </p>
                      <p className="text-slate-600">
                        {deliveryLocation?.addressLine1 || deliveryLocation?.area || 'No address specified'}, {deliveryLocation?.city} - <strong className="font-mono text-slate-900">{deliveryLocation?.postalCode || 'Not set'}</strong>
                      </p>
                    </div>

                    {deliveryInfo && deliveryInfo.nearestLocation && (
                      <div className="pt-2 border-t border-slate-200 text-xs flex justify-between text-slate-600">
                        <span>Fulfillment Center: <strong>{deliveryInfo.nearestLocation}</strong></span>
                        {deliveryInfo.distance !== null && (
                          <span className="font-mono font-semibold text-amber-700">
                            {deliveryInfo.distance} KM away
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <DeliveryChecker showTitle={true} />
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 3: RETURNS & REFUNDS                                            */}
            {/* =================================================================== */}
            {activeTab === 'returns' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Returns & Replacement ({returns.length})
                  </h3>
                  <p className="text-xs text-slate-500">Manage return claims and replacement tracking</p>
                </div>

                {loadingReturns ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : returns.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <RotateCcw className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-800">No active return requests.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {returns.map((ret) => (
                      <div key={ret._id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{ret.returnId}</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-md">
                              {ret.status?.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="font-medium text-xs text-slate-800">{ret.productId?.name || 'Item'}</p>
                          <span className="text-[11px] text-slate-500">Reason: {ret.reason}</span>
                        </div>

                        <Link to={`/account/returns/${ret._id}`}>
                          <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200 transition-colors">
                            View Status
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
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Registered Warranties ({warranties.length})
                  </h3>
                  <p className="text-xs text-slate-500">Manufacturer warranty records with serial numbers</p>
                </div>

                {loadingWarranties ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : warranties.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <Award className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-800">No product warranties registered yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {warranties.map((w) => (
                      <div key={w._id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-amber-700 text-xs uppercase">{w.brand?.name}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                            {w.status || 'Active'}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900 truncate">{w.product?.name || 'Product'}</p>
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
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Tax Invoices ({invoices.length})
                  </h3>
                  <p className="text-xs text-slate-500">Official invoices with GST breakdown</p>
                </div>

                {loadingInvoices ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-800">No invoices available yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <div key={inv._id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-mono font-bold text-slate-900 text-xs">{inv.invoiceNumber}</p>
                          <span className="text-xs text-slate-500">
                            {inv.brandId?.name} • ₹{inv.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <a
                          href={`http://localhost:5000/api/invoices/${inv._id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-700 hover:underline bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
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
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    My Reviews ({reviews.length})
                  </h3>
                  <p className="text-xs text-slate-500">Feedback submitted for verified orders</p>
                </div>

                {loadingReviews ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-800">No reviews submitted yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {reviews.map((r) => (
                      <div key={r._id} className="py-3.5 space-y-1.5 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            {r.product?.images?.[0] && (
                              <img
                                src={r.product.images[0]?.url || r.product.images[0]}
                                alt=""
                                className="w-10 h-10 object-contain bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0"
                              />
                            )}
                            <div>
                              <Link
                                to={`/product/${r.product?.slug || r.product?._id}`}
                                className="font-semibold text-xs text-slate-900 hover:text-amber-600 transition-colors line-clamp-1"
                              >
                                {r.product?.name || 'Product'}
                              </Link>
                              <div className="flex items-center space-x-2 pt-0.5">
                                <div className="flex text-amber-500">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3 h-3 ${
                                        s <= r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 font-mono">{r.rating}/5</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 self-end sm:self-center">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <button
                              onClick={async () => {
                                if (!window.confirm('Delete this review?')) return;
                                try {
                                  await axiosInstance.delete(`/reviews/${r._id}`);
                                  setReviews((prev) => prev.filter((item) => item._id !== r._id));
                                } catch (err) {
                                  alert(err.response?.data?.message || 'Error deleting review');
                                }
                              }}
                              className="text-[11px] font-bold text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {r.title && <p className="font-semibold text-xs text-slate-800">{r.title}</p>}
                        <p className="text-xs text-slate-600">{r.comment}</p>
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
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Saved Wishlist ({contextWishlist?.products?.length || 0})
                    </h3>
                    <p className="text-xs text-slate-500">Track saved products and prices</p>
                  </div>
                  <Link to="/wishlist" className="text-xs font-semibold text-amber-700 hover:underline">
                    View Full Page
                  </Link>
                </div>

                {loadingWishlist ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : (contextWishlist?.products?.length || 0) === 0 ? (
                  <EmptyState
                    type="wishlist"
                    title="Your wishlist is empty"
                    description="Save items to buy them later."
                    actionText="Browse Marketplace"
                    onAction={() => window.location.href = '/products'}
                    className="border-0 shadow-none py-10 text-slate-700"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {contextWishlist.products.map((it) => {
                      const prod = it.product || {};
                      const pId = prod._id || prod.id || it._id;
                      const isAvailable = it.isAvailable !== false && (it.availableStock > 0 || (prod.stock?.quantity ?? 10) > 0);
                      return (
                        <div key={pId} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3 text-xs text-left">
                          <div className="flex items-center space-x-3">
                            {prod.images?.[0] && (
                              <img
                                src={prod.images[0]?.url || prod.images[0]}
                                alt=""
                                className="w-12 h-12 object-contain bg-white border border-slate-200 rounded-lg p-1 shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/product/${prod.slug || pId}`}
                                className="font-semibold text-slate-900 hover:text-amber-600 transition-colors line-clamp-1 block"
                              >
                                {prod.name || 'Product'}
                              </Link>
                              <div className="flex items-center space-x-2 pt-0.5">
                                <span className="font-bold text-slate-950 font-mono">
                                  ₹{(it.unitPrice || prod.sellingPrice || 0).toLocaleString('en-IN')}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  isAvailable ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                                }`}>
                                  {isAvailable ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                            <button
                              onClick={() => moveWishlistToCart(pId, 1)}
                              disabled={!isAvailable}
                              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs transition-colors ${
                                isAvailable
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <span>{isAvailable ? 'Move to Cart' : 'Out of Stock'}</span>
                            </button>

                            <button
                              onClick={() => removeFromWishlist(pId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 8: SAVED ADDRESSES                                              */}
            {/* =================================================================== */}
            {activeTab === 'addresses' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Saved Addresses ({addresses.length})
                    </h3>
                    <p className="text-xs text-slate-500">Manage shipping addresses for checkout</p>
                  </div>
                  <button 
                    onClick={() => { setShowAddressForm(true); setEditAddressId(null); }} 
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </button>
                </div>

                {/* Add/Edit Address Form Modal */}
                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-900">
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
                      <label className="font-semibold text-slate-700 block mb-1">Address Line 1 *</label>
                      <input type="text" required value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Area / Street</label>
                        <input type="text" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Landmark</label>
                        <input type="text" placeholder="e.g. Near Metro Station" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
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

                    <div className="flex justify-end space-x-2 pt-2">
                      <button type="button" onClick={() => setShowAddressForm(false)} className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2 px-4 rounded-lg border border-slate-200">
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-4 rounded-lg">
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs relative">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{addr.name}</span>
                        {addr.isDefault ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">Default</span>
                        ) : (
                          <button onClick={() => handleSetDefaultAddress(addr._id)} className="text-[11px] text-amber-700 hover:underline font-semibold">Set Default</button>
                        )}
                      </div>
                      <p className="text-slate-600">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                      <p className="text-slate-500 font-mono text-[11px]">Phone: {addr.phone}</p>
                      <div className="pt-2 flex justify-end space-x-2 border-t border-slate-200">
                        <button onClick={() => handleDeleteAddress(addr._id)} className="text-rose-600 hover:underline text-xs flex items-center space-x-1 font-semibold">
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
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Notifications
                      </h3>
                      {notifications.filter((n) => !n.read).length > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {notifications.filter((n) => !n.read).length} Unread
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Order milestones and account security updates</p>
                  </div>

                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      Mark All Read
                    </button>
                  )}
                </div>

                {loadingNotifications ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-800">No notifications.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`py-3.5 px-3 rounded-xl transition-colors flex items-start justify-between gap-4 ${
                          !n.read ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div
                          onClick={() => !n.read && handleMarkNotificationRead(n._id)}
                          className="flex-1 cursor-pointer space-y-0.5"
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-transparent'}`} />
                            <p className={`text-xs ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                              {n.title}
                            </p>
                          </div>
                          <p className="text-xs text-slate-600 pl-4">{n.message}</p>
                          <div className="pl-4 pt-0.5 flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
                            <span>{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                            {n.link && (
                              <Link
                                to={n.link}
                                className="text-amber-700 font-bold hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Details
                              </Link>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                          {!n.read && (
                            <button
                              onClick={() => handleMarkNotificationRead(n._id)}
                              title="Mark as read"
                              className="p-1 rounded text-slate-400 hover:text-amber-600"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCustomerNotification(n._id)}
                            title="Delete"
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Profile Settings
                  </h3>
                  <p className="text-xs text-slate-500">Manage your profile picture and contact details</p>
                </div>

                {formMsg.text && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${formMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {formMsg.text}
                  </div>
                )}

                <ProfileImageUploader variant="card" size="xl" shape="rounded" />

                <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">First Name</label>
                      <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
                      <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                      <input type="email" disabled value={user?.email || ''} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                      <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-amber-500 bg-white" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-5 rounded-xl shadow-sm">
                      {submitting ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 11: SECURITY & PASSWORD                                         */}
            {/* =================================================================== */}
            {activeTab === 'security' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Security & Password
                  </h3>
                  <p className="text-xs text-slate-500">Update your account password</p>
                </div>

                {formMsg.text && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${formMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {formMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs max-w-md">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Current Password *</label>
                    <input type="password" required value={securityForm.currentPassword} onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">New Password (Min 8 characters) *</label>
                    <input type="password" required minLength={8} value={securityForm.newPassword} onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Confirm New Password *</label>
                    <input type="password" required minLength={8} value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-5 rounded-xl shadow-sm">
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
