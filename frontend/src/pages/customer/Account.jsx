import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  User, ShoppingBag, Award, Landmark, ShieldCheck, Download, Truck, 
  ExternalLink, FileText, MapPin, Heart, Lock, Trash2, Plus, AlertCircle 
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import axiosInstance from '../../api/axiosInstance';
import Button from '../../components/ui/Button';

const Account = () => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  // Data states
  const [orders, setOrders] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingWarranties, setLoadingWarranties] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editAddressIndex, setEditAddressIndex] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India',
    type: 'Home',
    isDefault: false
  });

  // Wishlist state
  const [wishlist, setWishlist] = useState([]);

  // Security password state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Edit profile states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    gstin: user?.gstin || '',
  });

  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const tabs = [
    { id: 'profile', name: 'My Profile', icon: User },
    { id: 'orders', name: 'My Orders', icon: ShoppingBag },
    { id: 'warranties', name: 'My Warranties', icon: Award },
    { id: 'addresses', name: 'Saved Addresses', icon: MapPin },
    { id: 'wishlist', name: 'My Wishlist', icon: Heart },
    { id: 'security', name: 'Account Security', icon: Lock },
    { id: 'gst', name: 'GST Settings', icon: Landmark },
  ];

  // Fetch orders when tab is clicked
  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await axiosInstance.get('/orders/customer/my-orders');
          if (res.data.success) {
            setOrders(res.data.orders);
          }
        } catch (err) {
          console.error('Error fetching customer orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  // Fetch warranties when tab is clicked
  useEffect(() => {
    if (activeTab === 'warranties') {
      const fetchWarranties = async () => {
        setLoadingWarranties(true);
        try {
          const res = await axiosInstance.get('/warranties');
          if (res.data.success) {
            setWarranties(res.data.warranties);
          }
        } catch (err) {
          console.error('Error fetching warranties:', err);
        } finally {
          setLoadingWarranties(false);
        }
      };
      fetchWarranties();
    }
  }, [activeTab]);

  // Load addresses & wishlist from localstorage on mount
  useEffect(() => {
    const localAddrs = localStorage.getItem('kaia_addresses');
    if (localAddrs) {
      try {
        setAddresses(JSON.parse(localAddrs));
      } catch (e) {
        setAddresses([]);
      }
    }

    const localWish = localStorage.getItem('kaia_wishlist');
    if (localWish) {
      try {
        setWishlist(JSON.parse(localWish));
      } catch (e) {
        setWishlist([]);
      }
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    try {
      await updateProfile(profileForm.name, profileForm.phone, profileForm.gstin);
      setFormMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message || 'Update failed.' });
    }
  };

  const handleClaimWarranty = async (id) => {
    try {
      const res = await axiosInstance.post(`/warranties/${id}/claim`);
      if (res.data.success) {
        alert(res.data.message);
        // Refresh warranties
        const wRes = await axiosInstance.get('/warranties');
        if (wRes.data.success) setWarranties(wRes.data.warranties);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to file claim.');
    }
  };

  const handleDownloadInvoice = (childOrderId) => {
    const win = window.open(`http://localhost:5000/api/orders/${childOrderId}/invoice`, '_blank');
    if (win) win.focus();
  };

  // Saved Addresses Handlers
  const handleSaveAddress = (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    if (!addressForm.fullName || !addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.pinCode) {
      setFormMsg({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    let updated = [...addresses];

    // If setting default, unset other defaults
    if (addressForm.isDefault) {
      updated = updated.map(addr => ({ ...addr, isDefault: false }));
    }

    if (editAddressIndex !== null) {
      // Edit mode
      updated[editAddressIndex] = addressForm;
    } else {
      // Add mode
      // Auto default if first address
      const isDefault = updated.length === 0 ? true : addressForm.isDefault;
      updated.push({ ...addressForm, isDefault });
    }

    setAddresses(updated);
    localStorage.setItem('kaia_addresses', JSON.stringify(updated));
    setShowAddressForm(false);
    setEditAddressIndex(null);
    setAddressForm({
      fullName: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pinCode: '',
      country: 'India',
      type: 'Home',
      isDefault: false
    });
    setFormMsg({ type: 'success', text: 'Address saved successfully.' });
  };

  const handleSetDefaultAddress = (index) => {
    const updated = addresses.map((addr, idx) => ({
      ...addr,
      isDefault: idx === index
    }));
    setAddresses(updated);
    localStorage.setItem('kaia_addresses', JSON.stringify(updated));
  };

  const handleDeleteAddress = (index) => {
    const updated = addresses.filter((_, idx) => idx !== index);
    // If deleted address was default and other addresses exist, set first as default
    if (addresses[index]?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    localStorage.setItem('kaia_addresses', JSON.stringify(updated));
  };

  // Wishlist Handlers
  const handleRemoveFromWishlist = (prodId) => {
    const updated = wishlist.filter(item => item._id !== prodId);
    setWishlist(updated);
    localStorage.setItem('kaia_wishlist', JSON.stringify(updated));
  };

  // Security password handler (Sandbox)
  const handleSecurityUpdate = (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setFormMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(securityForm.newPassword)) {
      setFormMsg({ type: 'error', text: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.' });
      return;
    }

    setFormMsg({ type: 'success', text: 'Security credentials updated (Sandbox).' });
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left select-none">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-brand-gray-900 tracking-tight uppercase">Dashboard Workspace</h1>
          <p className="text-xs text-brand-gray-500 mt-1">Manage credentials, local addresses, warranties, and orders.</p>
        </div>
        <button
          onClick={logout}
          className="text-xs text-red-500 hover:underline font-bold uppercase tracking-wider flex items-center space-x-1"
        >
          <XIcon className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Sidebar Tab triggers */}
        <div className="lg:col-span-3 bg-white border border-brand-gray-200 p-4 rounded-sm shadow-premium space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSearchParams({ tab: tab.id });
                  setFormMsg({ type: '', text: '' });
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-dark text-white font-extrabold'
                    : 'text-brand-gray-650 hover:bg-brand-gray-50 hover:text-brand-gray-900'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right column: Content panels */}
        <div className="lg:col-span-9 bg-white border border-brand-gray-200 p-8 rounded-sm shadow-premium min-h-[400px]">
          
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">My Profile Settings</h2>
              
              {formMsg.text && (
                <div className={`p-3 rounded text-xs font-semibold ${
                  formMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {formMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-brand-gray-650">Registered Email Address (Cannot change):</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-brand-gray-50 border-brand-gray-200 p-2.5 rounded-sm text-brand-gray-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-gray-650">Full Name:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-gray-650">Mobile Number:</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="text-xs font-bold uppercase tracking-wider">
                Save Profile Changes
              </Button>
            </form>
          )}

          {/* TAB 2: Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">My Purchase Orders</h2>
              
              {loadingOrders ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-brand-light animate-pulse rounded-sm" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <p className="text-xs text-brand-gray-500 py-6 italic">You have not placed any orders yet.</p>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order._id} className="border rounded-sm overflow-hidden shadow-premium">
                      <div className="bg-brand-gray-50 px-6 py-4 border-b border-brand-gray-200 flex flex-wrap justify-between items-center text-[10px] text-brand-gray-500 font-bold uppercase tracking-wider gap-4">
                        <div>
                          <p>Order Placed</p>
                          <p className="text-brand-gray-800 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p>Total Value</p>
                          <p className="text-brand-gray-800 mt-0.5">₹{order.totalAmount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p>Order ID</p>
                          <p className="text-brand-gray-800 mt-0.5 font-mono">{order._id}</p>
                        </div>
                        <div>
                          <p>Payment</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] mt-0.5 ${
                            order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border' : 'bg-orange-50 text-orange-700 border'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Order items lists */}
                      <div className="p-6 divide-y space-y-4 text-xs font-semibold">
                        {(order.sellerOrders || []).map((so) => (
                          <div key={so._id} className="pt-4 first:pt-0 space-y-4">
                            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-brand-accent">
                              <span>Brand Group: {so.brand?.name || 'Seller'}</span>
                              <span className="bg-brand-light px-2 py-0.5 rounded text-brand-gray-700">{so.fulfillmentStatus}</span>
                            </div>

                            {so.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <p className="font-extrabold text-brand-gray-900">{item.productName}</p>
                                  <p className="text-[10px] text-brand-gray-450">Qty: {item.quantity} • Rate: ₹{item.price?.toLocaleString()}</p>
                                </div>
                                <span className="font-extrabold text-brand-gray-950 shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}

                            <div className="flex justify-end space-x-3 pt-2">
                              <button
                                onClick={() => handleDownloadInvoice(so._id)}
                                className="text-[10px] font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase tracking-wider"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Invoice PDF</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Warranties */}
          {activeTab === 'warranties' && (
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">My Active Warranties</h2>
              
              {loadingWarranties ? (
                <div className="space-y-4">
                  {Array(2).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-brand-light animate-pulse rounded-sm" />
                  ))}
                </div>
              ) : warranties.length === 0 ? (
                <p className="text-xs text-brand-gray-500 py-6 italic">No warranties registered yet. Warranties lock automatically after dispatches.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {warranties.map((w) => (
                    <div key={w._id} className="border border-brand-gray-200 p-6 rounded-sm shadow-premium flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5 text-xs font-semibold">
                        <span className="font-bold tracking-wider text-brand-accent uppercase block text-[10px]">
                          {w.brand?.name} Coverage
                        </span>
                        <h3 className="font-bold text-sm text-brand-gray-900 line-clamp-1">{w.product?.name}</h3>
                        <p className="text-brand-gray-400">Serial Code: <span className="text-brand-gray-700">{w.serialNumber}</span></p>
                        <p className="text-brand-gray-400 font-medium">Expiry Date: <span className="text-brand-gray-750">{new Date(w.endDate).toLocaleDateString()}</span></p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t text-xs font-semibold">
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          w.status === 'Active' ? 'bg-green-50 text-green-700 border' : 'bg-orange-50 text-orange-700 border'
                        }`}>
                          {w.status}
                        </span>
                        {w.status === 'Active' && (
                          <button
                            onClick={() => handleClaimWarranty(w._id)}
                            className="bg-brand-dark hover:bg-brand-gray-850 text-white px-3 py-1.5 rounded-sm font-bold uppercase tracking-wider text-[10px]"
                          >
                            Claim Service
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Saved Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">Saved Shipping Addresses</h2>
                {!showAddressForm && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditAddressIndex(null);
                      setAddressForm({
                        fullName: '',
                        phone: '',
                        line1: '',
                        line2: '',
                        city: '',
                        state: '',
                        pinCode: '',
                        country: 'India',
                        type: 'Home',
                        isDefault: false
                      });
                      setShowAddressForm(true);
                    }}
                    className="text-xs flex items-center space-x-1 border-none bg-brand-accent hover:bg-brand-accentHover"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Address</span>
                  </Button>
                )}
              </div>

              {formMsg.text && activeTab === 'addresses' && (
                <div className={`p-3 rounded text-xs font-semibold ${
                  formMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {formMsg.text}
                </div>
              )}

              {showAddressForm ? (
                <form onSubmit={handleSaveAddress} className="space-y-4 text-xs font-semibold bg-brand-light p-6 rounded-sm border border-brand-gray-250">
                  <h3 className="font-extrabold text-brand-gray-900 uppercase">{editAddressIndex !== null ? 'Edit Address' : 'New Address Details'}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-brand-gray-650">Recipient Name *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-gray-655">Mobile Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label className="text-brand-gray-655">Address Line 1 *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.line1}
                        onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label className="text-brand-gray-655">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={addressForm.line2}
                        onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-gray-655">City *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-gray-655">State *</label>
                      <input
                        type="text"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-gray-655">PIN Code *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={addressForm.pinCode}
                        onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-gray-655">Address Label Type</label>
                      <select
                        value={addressForm.type}
                        onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm focus:ring-0"
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work/Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <label className="flex items-center space-x-2 cursor-pointer pt-2 col-span-2">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="rounded text-brand-accent w-4.5 h-4.5"
                      />
                      <span className="text-[11px] text-brand-gray-600">Set as Default Shipping Address</span>
                    </label>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button type="submit" variant="primary" className="text-xs font-bold uppercase tracking-wider">
                      Save Address
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditAddressIndex(null);
                      }}
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : addresses.length === 0 ? (
                <p className="text-xs text-brand-gray-500 py-6 italic">No shipping addresses configured. Add an address for checkout convenience.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-brand-gray-650">
                  {addresses.map((addr, idx) => (
                    <div key={idx} className={`border p-6 rounded-sm space-y-4 shadow-sm flex flex-col justify-between ${addr.isDefault ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-gray-200'}`}>
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="bg-brand-dark text-white px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold">{addr.type}</span>
                          {addr.isDefault && <span className="text-[9px] text-brand-accent font-black uppercase">Default</span>}
                        </div>
                        <p className="font-extrabold text-brand-gray-900 mt-2">{addr.fullName}</p>
                        <p className="font-semibold text-brand-gray-600">{addr.line1}</p>
                        {addr.line2 && <p className="text-brand-gray-550 font-semibold">{addr.line2}</p>}
                        <p className="font-semibold text-brand-gray-600">{addr.city}, {addr.state} - {addr.pinCode}</p>
                        <p className="text-[10px] text-brand-gray-450 font-semibold">Phone: {addr.phone}</p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t text-[10px] font-bold uppercase tracking-wider">
                        {!addr.isDefault ? (
                          <button onClick={() => handleSetDefaultAddress(idx)} className="text-brand-accent hover:underline">
                            Set default
                          </button>
                        ) : (
                          <span />
                        )}
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setEditAddressIndex(idx);
                              setAddressForm(addr);
                              setShowAddressForm(true);
                            }}
                            className="text-brand-gray-600 hover:text-brand-gray-800"
                          >
                            Edit
                          </button>
                          <button onClick={() => handleDeleteAddress(idx)} className="text-red-500 hover:text-red-700">
                            Delete
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">My Technology Wishlist</h2>
              
              {wishlist.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <p className="text-xs text-brand-gray-500 italic">Your wishlist is currently waiting for something great.</p>
                  <Link to="/products" className="inline-block">
                    <Button variant="primary" size="sm" className="text-xs font-bold uppercase tracking-wider border-none">
                      Explore Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y text-xs font-semibold text-brand-gray-600">
                  {wishlist.map((item) => {
                    const imageUrl = item.images?.[0]?.url || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100';
                    const inStock = item.stock && (item.stock.quantity - item.stock.reservedQuantity) > 0;
                    return (
                      <div key={item._id} className="py-4 flex justify-between items-center gap-6 text-left">
                        <div className="flex items-center space-x-4">
                          <img src={imageUrl} alt="" className="w-14 h-14 object-contain bg-brand-light border rounded p-1 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-[10px] text-brand-gray-450 uppercase font-bold">{item.brand?.name || 'Authorized Brand'}</p>
                            <Link to={`/product/${item.slug}`} className="font-extrabold text-brand-gray-900 hover:text-brand-accent transition-colors line-clamp-1">{item.name}</Link>
                            <p className="font-extrabold text-brand-gray-950">₹{item.sellingPrice?.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          {inStock ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                addToCart(item, 1, {});
                                handleRemoveFromWishlist(item._id);
                              }}
                              className="text-[9px] font-bold uppercase tracking-wider py-1.5"
                            >
                              Add To Cart
                            </Button>
                          ) : (
                            <span className="text-[9px] bg-red-50 border text-red-650 px-2 py-1 rounded font-extrabold uppercase">Out of Stock</span>
                          )}

                          <button
                            onClick={() => handleRemoveFromWishlist(item._id)}
                            className="p-1.5 text-brand-gray-450 hover:text-red-500 border rounded-sm"
                            aria-label="Remove wishlist item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Security */}
          {activeTab === 'security' && (
            <form onSubmit={handleSecurityUpdate} className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">Security Credentials</h2>
              
              {formMsg.text && activeTab === 'security' && (
                <div className={`p-3 rounded text-xs font-semibold ${
                  formMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {formMsg.text}
                </div>
              )}

              <div className="max-w-md space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-brand-gray-655">Current Active Password:</label>
                  <input
                    type="password"
                    required
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-gray-655">New Security Password:</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters, with 1 uppercase, 1 lowercase, 1 number"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-gray-655">Confirm New Password:</label>
                  <input
                    type="password"
                    required
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="text-xs font-bold uppercase tracking-wider">
                Reset Account Password
              </Button>
            </form>
          )}

          {/* TAB 7: GST Settings */}
          {activeTab === 'gst' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">Business Billing Settings</h2>
              
              {formMsg.text && activeTab === 'gst' && (
                <div className={`p-3 rounded text-xs font-semibold ${
                  formMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {formMsg.text}
                </div>
              )}

              <div className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5 max-w-md">
                  <label className="text-brand-gray-650">Company GSTIN Number:</label>
                  <input
                    type="text"
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    value={profileForm.gstin}
                    onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                    className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm uppercase tracking-wider font-extrabold text-brand-gray-800"
                  />
                </div>
                <p className="text-xs text-brand-gray-400 leading-relaxed font-semibold">
                  Saving your corporate GSTIN registers it inside your central profile, allowing you to checkout seamlessly without configuring it every time.
                </p>
              </div>

              <Button type="submit" variant="primary" className="text-xs font-bold uppercase tracking-wider">
                Save GST Profile
              </Button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};

// Reusable SVG loader for logout button
const XIcon = ({ className = '', ...props }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default Account;
