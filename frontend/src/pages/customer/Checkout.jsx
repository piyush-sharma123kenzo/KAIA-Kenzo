import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Truck, CreditCard, ChevronRight, CheckCircle, 
  Smartphone, Building, MapPin, Plus, AlertCircle, Landmark, X, 
  Edit3, Navigation, CheckCircle2
} from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';
import axiosInstance from '../../api/axiosInstance';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import PaymentCheckout from '../../components/payment/PaymentCheckout';
import PaymentMethodSelector from '../../components/payment/PaymentMethodSelector';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { cart, getCartTotals, clearCart } = useContext(CartContext);
  const toast = useToast();
  const { 
    deliveryLocation, 
    deliveryInfo,
    savedAddresses, 
    openLocationModal, 
    selectDeliveryAddress,
    saveNewAddress 
  } = useLocationContext();

  const passedCoupon = location.state?.couponCode || '';

  const [step, setStep] = useState(1); // 1: Address Selection, 2: GST Details, 3: Order Review, 4: Payment Portal
  const [loading, setLoading] = useState(false);
  const [checkoutPayload, setCheckoutPayload] = useState(null);

  // Address Selection States
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    type: 'Home',
    isDefault: false
  });

  // GST Option States
  const [isBusiness, setIsBusiness] = useState(false);
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [businessName, setBusinessName] = useState('');
  const [gstError, setGstError] = useState('');

  // Payment Selection States
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [netbankBank, setNetbankBank] = useState('HDFC Bank');
  const [cardNumber, setCardNumber] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const totals = getCartTotals();

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=%2Fcheckout');
    }
  }, [user, navigate]);

  // Sync active address index from LocationContext or savedAddresses
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      const idx = savedAddresses.findIndex(
        (a) => a._id === deliveryLocation?._id || (a.addressLine1 === deliveryLocation?.addressLine1 && a.postalCode === deliveryLocation?.postalCode)
      );
      if (idx !== -1) {
        setSelectedAddressIndex(idx);
      } else {
        setSelectedAddressIndex(0);
      }
    }
  }, [savedAddresses, deliveryLocation]);

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
      toast.showToast('Please fill out all required address fields.', 'warning');
      return;
    }

    try {
      await saveNewAddress(newAddress);
      setShowNewAddressForm(false);
      setNewAddress({
        fullName: user?.name || '',
        phone: user?.phone || '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        type: 'Home',
        isDefault: false
      });
    } catch (err) {
      toast.showToast(err.message || 'Error saving address.', 'error');
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const currentAddr = savedAddresses[selectedAddressIndex] || deliveryLocation;
    if (!currentAddr || (!currentAddr.addressLine1 && !currentAddr.street)) {
      toast.showToast('Please select or configure a delivery address.', 'warning');
      return;
    }

    if (deliveryInfo && deliveryInfo.isServiceable === false) {
      toast.showToast(deliveryInfo.message || 'Delivery is currently unavailable at this address (Outside 10 KM radius).', 'error');
      return;
    }

    selectDeliveryAddress(currentAddr);
    setStep(2);
  };

  const handleGstSubmit = (e) => {
    e.preventDefault();
    setGstError('');

    if (isBusiness) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstin.toUpperCase())) {
        setGstError('Invalid Indian GSTIN format (e.g. 07AAAAA1111A1Z1).');
        return;
      }
      if (!businessName) {
        setGstError('Please enter your business trade name.');
        return;
      }
    }

    setStep(3);
  };

  // Groups checkout items by brand
  const groupCartByBrand = () => {
    const groups = {};
    cart.items.forEach(item => {
      if (!item.product) return;
      const brandName = item.product.brand?.name || item.product.brandName || 'Authorized Store';
      if (!groups[brandName]) groups[brandName] = [];
      groups[brandName].push(item);
    });
    return groups;
  };

  const brandSplitItems = groupCartByBrand();

  const handleInitiateOrderDraft = async () => {
    setLoading(true);
    const chosen = savedAddresses[selectedAddressIndex] || deliveryLocation;
    
    // Complete Snapshot Payload preserving all delivery fields
    const targetAddress = {
      name: chosen.fullName || chosen.name || chosen.recipientName || user?.name || 'Customer',
      fullName: chosen.fullName || chosen.name || chosen.recipientName || user?.name || 'Customer',
      phone: chosen.phone || user?.phone || '9999999999',
      street: chosen.addressLine1 || chosen.street || 'Address Line 1',
      addressLine1: chosen.addressLine1 || chosen.street || 'Address Line 1',
      addressLine2: chosen.addressLine2 || '',
      landmark: chosen.landmark || '',
      city: chosen.city || 'Delhi',
      state: chosen.state || 'Delhi',
      postalCode: chosen.postalCode || chosen.pinCode || '110001',
      country: chosen.country || 'India',
      latitude: chosen.latitude || null,
      longitude: chosen.longitude || null,
      type: chosen.type || chosen.label || 'Home',
    };

    try {
      const res = await axiosInstance.post('/orders/checkout', {
        shippingAddress: targetAddress,
        billingAddress: targetAddress,
        gstNumber: isBusiness ? gstin.toUpperCase() : '',
        couponCode: passedCoupon,
      });

      if (res.data.success) {
        setCheckoutPayload(res.data);
        setStep(4);
      }
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Error creating order draft.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOrderPayment = async () => {
    if (paymentMethod === 'COD') {
      setPaymentProcessing(true);
      try {
        const res = await axiosInstance.post('/payments/cod', {
          orderId: checkoutPayload?.order?.orderId,
        });
        if (res.data?.success) {
          clearCart();
          navigate('/order-success', {
            state: {
              orderId: checkoutPayload?.order?.orderId,
              paymentStatus: 'pending_cod',
            },
          });
        }
      } catch (err) {
        toast.showToast(err.response?.data?.message || 'Error processing Cash on Delivery order.', 'error');
      } finally {
        setPaymentProcessing(false);
      }
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleRazorpaySuccess = (verificationData) => {
    clearCart();
    setShowPaymentModal(false);
    setPaymentProcessing(false);
    navigate('/order-success', {
      state: {
        orderId: checkoutPayload?.order?.orderId,
        paymentStatus: 'paid',
      }
    });
  };

  const handleRazorpayFailure = (errorMessage) => {
    setShowPaymentModal(false);
    setPaymentProcessing(false);
    navigate('/payment-failed', {
      state: { orderId: checkoutPayload?.order?.orderId }
    });
  };

  const activeAddress = savedAddresses[selectedAddressIndex] || deliveryLocation;

  return (
    <Container className="py-8 space-y-8 select-none text-left font-sans">
      
      {/* Steps indicators */}
      <div className="flex justify-between items-center max-w-xl mx-auto border-b border-slate-100 pb-6 select-none">
        {[
          { num: 1, name: 'Delivery Location' },
          { num: 2, name: 'B2B GST Details' },
          { num: 3, name: 'Review Items' },
          { num: 4, name: 'Payment' }
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= s.num ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${
              step >= s.num ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}>
              {s.name}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Step Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ================================================================= */}
          {/* STEP 1: DELIVERY ADDRESS SELECTION                                */}
          {/* ================================================================= */}
          {step === 1 && (
            <div className="space-y-6 bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Select Delivery Address</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Choose where your genuine electronics should be delivered</p>
                </div>
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Use Map / Search</span>
                </button>
              </div>

              {showNewAddressForm ? (
                <form onSubmit={handleAddNewAddress} className="space-y-4 bg-slate-50/80 p-6 rounded-xl border border-slate-200 text-xs">
                  <h3 className="font-bold text-slate-900 text-sm">Add New Delivery Location</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Recipient Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">Flat / House No. / Building *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.addressLine1}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Street / Area</label>
                      <input
                        type="text"
                        value={newAddress.addressLine2}
                        onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Landmark</label>
                      <input
                        type="text"
                        value={newAddress.landmark}
                        onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">PIN Code *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Address Type</label>
                      <select
                        value={newAddress.type}
                        onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                        className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-2.5 pt-2">
                    <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-all">
                      Save & Select
                    </button>
                    <button type="button" onClick={() => setShowNewAddressForm(false)} className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2 px-4 rounded-lg border border-slate-200 transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  
                  {/* Saved addresses cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {savedAddresses.map((addr, idx) => {
                      const isSelected = selectedAddressIndex === idx;
                      return (
                        <label 
                          key={idx} 
                          className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-500'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="checkout_address"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedAddressIndex(idx);
                              selectDeliveryAddress(addr);
                            }}
                            className="text-amber-500 focus:ring-amber-400 mt-1 w-4 h-4"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900 text-xs">{addr.fullName || addr.name}</span>
                              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                {addr.type || addr.label || 'Home'}
                              </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                              {addr.addressLine1 || addr.street}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                              {addr.landmark ? `, Near ${addr.landmark}` : ''}
                            </p>
                            <p className="text-slate-500 font-medium">
                              {addr.city}, {addr.state} - <span className="font-mono font-bold text-slate-800">{addr.postalCode || addr.pinCode}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">Phone: {addr.phone}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Live Delivery Serviceability Status Indicator */}
                  {deliveryInfo && deliveryInfo.isServiceable !== null && (
                    <div className={`p-4 rounded-xl border text-xs ${
                      deliveryInfo.isServiceable 
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50/90 border-rose-200 text-rose-800'
                    }`}>
                      <div className="flex items-center space-x-2 font-bold">
                        {deliveryInfo.isServiceable ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>
                          {deliveryInfo.isServiceable 
                            ? 'Delivery Available to this address' 
                            : 'Delivery Unavailable to this address'}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed pl-6">
                        {deliveryInfo.isServiceable ? (
                          <>
                            Serviceable via <strong>{deliveryInfo.nearestLocation || 'Authorized Hub'}</strong>
                            {deliveryInfo.distance !== null ? ` (${deliveryInfo.distance} KM away • Max limit: ${deliveryInfo.deliveryRadius || 10} KM)` : ''}.
                          </>
                        ) : (
                          <>
                            {deliveryInfo.message || 'This address is outside our 10 KM delivery radius. Please choose or add a serviceable location.'}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(true)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Delivery Address</span>
                    </button>
                    <button
                      type="submit"
                      disabled={deliveryInfo?.isServiceable === false}
                      className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-amber-400 font-bold text-xs py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center space-x-2 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Proceed to GST Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: GST B2B DETAILS                                           */}
          {/* ================================================================= */}
          {step === 2 && (
            <form onSubmit={handleGstSubmit} className="space-y-6 bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Business Purchase & GST Invoicing</h2>
                <p className="text-xs text-slate-500 mt-0.5">Claim up to 28% Input Tax Credit with genuine OEM tax invoices</p>
              </div>

              {/* Delivery brief */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Delivering to: {activeAddress.fullName || activeAddress.name}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {activeAddress.addressLine1 || activeAddress.street}, {activeAddress.city}, {activeAddress.state} - {activeAddress.postalCode || activeAddress.pinCode}
                  </p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-amber-700 hover:underline">
                  Change
                </button>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="gst_claim_box"
                  checked={isBusiness}
                  onChange={(e) => setIsBusiness(e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-500 focus:ring-amber-400 rounded"
                />
                <label htmlFor="gst_claim_box" className="cursor-pointer">
                  <span className="font-bold text-slate-900 block text-xs">I am buying for a registered business entity</span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                    Generate standard B2B tax invoice mapped with your GSTIN for tax credit claims.
                  </span>
                </label>
              </div>

              {isBusiness && (
                <div className="space-y-3.5 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Company GSTIN Number (15 Digits) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 07AAAAA1111A1Z1"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-lg uppercase font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Registered Trade / Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Technologies Private Limited"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {gstError && <p className="text-xs text-red-600 font-bold">{gstError}</p>}
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setStep(1)} className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 px-5 rounded-lg border border-slate-200 transition-all">
                  Back to Address
                </button>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center space-x-2">
                  <span>Proceed to Review</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* STEP 3: ORDER ITEMS & MULTI-BRAND SPLIT REVIEW                    */}
          {/* ================================================================= */}
          {step === 3 && (
            <div className="space-y-6 bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Review Order Items & Shipping</h2>
                <p className="text-xs text-slate-500 mt-0.5">Multi-brand fulfillment directly from manufacturer depots</p>
              </div>

              {/* Delivery destination card with mini map pin */}
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-5 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>Delivering To: {activeAddress.fullName || activeAddress.name}</span>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-amber-700 hover:underline">
                    Edit Address
                  </button>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {activeAddress.addressLine1 || activeAddress.street}
                  {activeAddress.addressLine2 ? `, ${activeAddress.addressLine2}` : ''}
                  {activeAddress.landmark ? `, Near ${activeAddress.landmark}` : ''}, {activeAddress.city}, {activeAddress.state} - {activeAddress.postalCode || activeAddress.pinCode}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">Contact Phone: {activeAddress.phone}</p>
                {isBusiness && (
                  <p className="text-amber-800 font-bold bg-amber-100/70 p-2 rounded-lg text-[11px] mt-2">
                    GST Claim Registered: {gstin.toUpperCase()} ({businessName})
                  </p>
                )}
              </div>

              {/* Brand Split Items List */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Split Shipments</h3>
                <div className="space-y-4 border border-slate-100 rounded-xl p-5 bg-white shadow-sm">
                  {Object.keys(brandSplitItems).map((brandName, index) => (
                    <div key={index} className="space-y-3 pb-4 border-b border-slate-100 last:border-none last:pb-0">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        <span>Fulfillment: {brandName} Depot</span>
                        <span className="text-slate-500 font-normal lowercase">Fast courier tracking included</span>
                      </div>
                      
                      {brandSplitItems[brandName].map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <p className="text-slate-900 font-bold">{item.product.name}</p>
                            <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-extrabold text-slate-900">₹{(item.product.sellingPrice * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setStep(2)} className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 px-5 rounded-lg border border-slate-200 transition-all">
                  Back
                </button>
                <button 
                  type="button" 
                  disabled={loading || deliveryInfo?.isServiceable === false}
                  onClick={handleInitiateOrderDraft}
                  className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-amber-400 font-bold text-xs py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center space-x-2 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{loading ? 'Creating Order...' : 'Proceed to Payment'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 4: PAYMENT PORTAL                                            */}
          {/* ================================================================= */}
          {step === 4 && checkoutPayload && (
            <div className="space-y-6 bg-white p-7 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Select Payment Method</h2>
                <p className="text-xs text-slate-500 mt-0.5">Order ID: <span className="font-mono font-bold text-slate-900">{checkoutPayload?.order?.orderId}</span></p>
              </div>

              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onSelectMethod={setPaymentMethod}
                upiId={upiId}
                setUpiId={setUpiId}
                netbankBank={netbankBank}
                setNetbankBank={setNetbankBank}
                cardNumber={cardNumber}
                setCardNumber={setCardNumber}
              />

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 px-5 rounded-lg border border-slate-200 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={handleProcessOrderPayment}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {paymentProcessing
                      ? 'Confirming Order...'
                      : paymentMethod === 'COD'
                      ? `Confirm Cash On Delivery (₹${checkoutPayload?.order?.finalAmount?.toLocaleString('en-IN')})`
                      : `Pay ₹${checkoutPayload?.order?.finalAmount?.toLocaleString('en-IN')} Securely`}
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Col: Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] space-y-4 text-xs font-semibold">
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight border-b border-slate-100 pb-3">
              Order Pricing Breakdown
            </h3>

            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Cart Subtotal</span>
                <span className="font-bold text-slate-900">₹{totals.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (18%)</span>
                <span className="font-bold text-slate-900">₹{totals.tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Logistics & Shipping</span>
                <span className="font-bold text-emerald-700">{totals.shipping === 0 ? 'FREE' : `₹${totals.shipping}`}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="font-extrabold text-slate-900 text-sm">Final Amount</span>
              <span className="text-xl font-black text-slate-900">₹{totals.total.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 space-y-1.5 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Genuine Serial Allocation</span>
              </div>
              <p>Direct manufacturer warehouse dispatch with verified warranty certificate.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Razorpay Checkout Modal for online payment */}
      {showPaymentModal && checkoutPayload && (
        <PaymentCheckout
          order={checkoutPayload.order}
          razorpayOrder={checkoutPayload.razorpayOrder}
          onSuccess={handleRazorpaySuccess}
          onFailure={handleRazorpayFailure}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

    </Container>
  );
};

export default Checkout;
