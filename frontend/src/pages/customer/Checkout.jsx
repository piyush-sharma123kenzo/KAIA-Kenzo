import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Truck, CreditCard, ChevronRight, CheckCircle, 
  Smartphone, Building, MapPin, Plus, AlertCircle, Landmark, X 
} from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { cart, getCartTotals, clearCart } = useContext(CartContext);

  const passedCoupon = location.state?.couponCode || '';

  const [step, setStep] = useState(1); // 1: Address Selection, 2: GST Details, 3: Order Review, 4: Payment Portal
  const [loading, setLoading] = useState(false);
  const [checkoutPayload, setCheckoutPayload] = useState(null);

  // Address Selection States
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
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

  // Load saved addresses from localstorage
  useEffect(() => {
    const cached = localStorage.getItem('kaia_addresses');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSavedAddresses(parsed);
        // Pre-select default address
        const defIndex = parsed.findIndex(a => a.isDefault);
        if (defIndex !== -1) {
          setSelectedAddressIndex(defIndex);
        } else if (parsed.length > 0) {
          setSelectedAddressIndex(0);
        }
      } catch (e) {
        setSavedAddresses([]);
      }
    }
  }, []);

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.pinCode) {
      alert('Please fill out all required address fields.');
      return;
    }

    const updated = [...savedAddresses];
    const itemToAdd = { ...newAddress, isDefault: updated.length === 0 };
    updated.push(itemToAdd);

    setSavedAddresses(updated);
    localStorage.setItem('kaia_addresses', JSON.stringify(updated));
    setSelectedAddressIndex(updated.length - 1);
    setShowNewAddressForm(false);
    setNewAddress({
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
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (selectedAddressIndex === null || !savedAddresses[selectedAddressIndex]) {
      alert('Please select or configure a delivery address.');
      return;
    }
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
    const selectedAddress = savedAddresses[selectedAddressIndex];
    
    // Adapt payload to match backend draft checks
    const targetAddress = {
      name: selectedAddress.fullName,
      street: selectedAddress.line1 + (selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''),
      city: selectedAddress.city,
      state: selectedAddress.state,
      postalCode: selectedAddress.pinCode,
      country: selectedAddress.country,
      phone: selectedAddress.phone,
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
      alert(err.response?.data?.message || 'Error creating order draft.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessOrderPayment = () => {
    if (paymentMethod === 'COD') {
      // Direct success for COD simulation
      setPaymentProcessing(true);
      setTimeout(() => {
        setPaymentProcessing(false);
        clearCart();
        navigate('/order-success', {
          state: {
            order: {
              orderId: checkoutPayload?.order?.orderId || 'KAIA-' + Math.floor(100000 + Math.random() * 900000),
              finalAmount: totals.total - (passedCoupon ? 1000 : 0),
              shippingAddress: savedAddresses[selectedAddressIndex]
            }
          }
        });
      }, 1500);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleConfirmMockGateway = () => {
    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
        const orderId = checkoutPayload.order.orderId;
        const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
        const mockSignature = `sig_mock_${Math.random().toString(36).substring(2, 11)}`;

        // Call backend payment verify endpoint
        const res = await axiosInstance.post('/payments/verify', {
          orderId,
          paymentId: mockPaymentId,
          signature: mockSignature,
        });

        if (res.data.success) {
          clearCart();
          navigate('/order-success', {
            state: {
              order: {
                orderId,
                finalAmount: checkoutPayload.order.finalAmount,
                shippingAddress: savedAddresses[selectedAddressIndex]
              }
            }
          });
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Mock payment confirmation failed.');
      } finally {
        setPaymentProcessing(false);
        setShowPaymentModal(false);
      }
    }, 2000);
  };

  return (
    <Container className="py-10 space-y-8 select-none text-left">
      
      {/* Steps indicators */}
      <div className="flex justify-between items-center max-w-xl mx-auto border-b pb-6 select-none">
        {[
          { num: 1, name: 'Address' },
          { num: 2, name: 'GST Details' },
          { num: 3, name: 'Summary' },
          { num: 4, name: 'Payment' }
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= s.num ? 'bg-brand-accent text-white' : 'bg-brand-gray-200 text-brand-gray-500'
            }`}>
              {s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? 'text-brand-gray-900' : 'text-brand-gray-400'}`}>
              {s.name}
            </span>
            {s.num < 4 && <ChevronRight className="w-4 h-4 text-brand-gray-300" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Step details panels */}
        <div className="lg:col-span-8 bg-white border border-brand-gray-200 p-8 rounded-sm shadow-premium min-h-[400px]">
          
          {/* STEP 1: Address selection */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">Select Delivery Address</h2>
              
              {showNewAddressForm ? (
                <form onSubmit={handleAddNewAddress} className="space-y-4 bg-brand-light p-6 rounded border text-xs font-semibold">
                  <h3 className="font-extrabold text-brand-gray-900 uppercase">New Address Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-brand-gray-650">Recipient Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-brand-gray-650">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-brand-gray-650">Address Line 1 *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-brand-gray-650">Address Line 2</label>
                      <input
                        type="text"
                        value={newAddress.line2}
                        onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-brand-gray-655">City *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-brand-gray-655">State *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-brand-gray-655">PIN Code *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddress.pinCode}
                        onChange={(e) => setNewAddress({ ...newAddress, pinCode: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-brand-gray-655">Label Type</label>
                      <select
                        value={newAddress.type}
                        onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <Button type="submit" variant="primary" className="text-xs uppercase font-bold tracking-wider">Save Address</Button>
                    <Button variant="secondary" onClick={() => setShowNewAddressForm(false)} className="text-xs uppercase font-bold tracking-wider">Cancel</Button>
                  </div>
                </form>
              ) : savedAddresses.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <MapPin className="w-12 h-12 text-brand-gray-300 mx-auto" />
                  <p className="text-xs text-brand-gray-500 italic">No saved delivery addresses found.</p>
                  <Button variant="primary" onClick={() => setShowNewAddressForm(true)} className="text-xs uppercase font-bold tracking-wider">
                    Add delivery address
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-brand-gray-650">
                    {savedAddresses.map((addr, idx) => (
                      <label 
                        key={idx} 
                        className={`flex items-start space-x-3 p-4 border rounded-sm cursor-pointer hover:bg-brand-gray-50 transition-all ${
                          selectedAddressIndex === idx ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="checkout_address"
                          checked={selectedAddressIndex === idx}
                          onChange={() => setSelectedAddressIndex(idx)}
                          className="text-brand-accent focus:ring-brand-accent mt-0.5 w-4 h-4"
                        />
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="bg-brand-dark text-white px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold">{addr.type}</span>
                            {addr.isDefault && <span className="text-[8px] text-brand-accent uppercase font-black">Default</span>}
                          </div>
                          <p className="font-extrabold text-brand-gray-900 mt-1">{addr.fullName}</p>
                          <p className="font-medium text-brand-gray-550 leading-relaxed">
                            {addr.line1}, {addr.city}, {addr.state} - {addr.pinCode}
                          </p>
                          <p className="text-[10px] text-brand-gray-400">Phone: {addr.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(true)}
                      className="text-xs font-bold text-brand-accent hover:underline flex items-center space-x-1 uppercase tracking-wider"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Configure New Address</span>
                    </button>
                    <Button type="submit" variant="primary" className="text-xs uppercase font-bold tracking-wider">
                      Proceed to GST Details
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: GST Configuration */}
          {step === 2 && (
            <form onSubmit={handleGstSubmit} className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">GST / Business Details</h2>
              
              <label className="flex items-start space-x-3 p-4 bg-brand-light border border-brand-gray-250 rounded-sm cursor-pointer hover:bg-brand-gray-150">
                <input
                  type="checkbox"
                  checked={isBusiness}
                  onChange={(e) => setIsBusiness(e.target.checked)}
                  className="rounded text-brand-accent focus:ring-brand-accent w-4.5 h-4.5 mt-0.5"
                />
                <div>
                  <span className="font-extrabold text-xs text-brand-gray-900 uppercase block">Buying for a business?</span>
                  <span className="text-[10px] text-brand-gray-500 leading-relaxed block mt-1">
                    Toggle this to register your corporate GSTIN details. We will apply invoice tax coordinates on all split orders.
                  </span>
                </div>
              </label>

              {isBusiness && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="text-brand-gray-650">Corporate GSTIN *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 07AAAAA1111A1Z1"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm uppercase tracking-wider font-extrabold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-brand-gray-655">Business / Legal Trade Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KAIA Enterprises Ltd"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-brand-light border-brand-gray-250 p-2.5 rounded-sm"
                    />
                  </div>
                  <p className="text-[10px] text-brand-gray-400 font-medium">
                    * GST details will be verified during order processing.
                  </p>
                  {gstError && <p className="text-xs text-red-500 font-bold">{gstError}</p>}
                </div>
              )}

              <div className="flex space-x-4 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1 text-xs uppercase font-bold tracking-wider">
                  Back to Address
                </Button>
                <Button type="submit" variant="primary" className="flex-1 text-xs uppercase font-bold tracking-wider">
                  Proceed to Review
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Order Review */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">Review Order Items</h2>
              
              {/* Shipping brief */}
              <div className="bg-brand-light border border-brand-gray-250 rounded p-4 text-xs font-semibold text-brand-gray-650 space-y-2">
                <h4 className="font-extrabold text-brand-gray-900 uppercase">Fulfillment Destination</h4>
                <p>{savedAddresses[selectedAddressIndex]?.fullName}</p>
                <p>{savedAddresses[selectedAddressIndex]?.line1}, {savedAddresses[selectedAddressIndex]?.city}, {savedAddresses[selectedAddressIndex]?.state} - {savedAddresses[selectedAddressIndex]?.pinCode}</p>
                <p>Phone: {savedAddresses[selectedAddressIndex]?.phone}</p>
                {isBusiness && <p className="text-brand-accent font-extrabold">GST Claim Registration: {gstin.toUpperCase()} ({businessName})</p>}
              </div>

              {/* Split products list */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs text-brand-gray-400 uppercase tracking-wider">Split Shipments</h3>
                <div className="space-y-4 border rounded-sm p-6 bg-white shadow-premium">
                  {Object.keys(brandSplitItems).map((brandName, index) => (
                    <div key={index} className="space-y-3 pb-4 border-b last:border-none last:pb-0">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-brand-accent">
                        <span>Fulfillments: {brandName} Depot</span>
                        <span className="text-brand-gray-500 font-semibold lowercase">Estimated delivery: 2–5 business days</span>
                      </div>
                      
                      {brandSplitItems[brandName].map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-center text-xs font-semibold">
                          <div className="space-y-0.5">
                            <p className="text-brand-gray-900 font-extrabold">{item.product.name}</p>
                            <p className="text-[10px] text-brand-gray-450">Quantity: {item.quantity}</p>
                          </div>
                          <span className="font-extrabold text-brand-gray-950">₹{(item.product.sellingPrice * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketplace notice info */}
              <div className="bg-blue-50/50 border border-blue-200 text-blue-800 text-[10px] font-semibold leading-relaxed p-4 rounded flex items-start space-x-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-blue-600 mt-0.5" />
                <p>
                  Your order may contain products from multiple brands. KAIA Technologies coordinates the marketplace checkout while each brand fulfills its own products.
                </p>
              </div>

              <div className="flex space-x-4 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1 text-xs uppercase font-bold tracking-wider">
                  Back to GST Details
                </Button>
                <Button 
                  type="button" 
                  variant="primary" 
                  disabled={loading}
                  onClick={handleInitiateOrderDraft} 
                  className="flex-1 text-xs uppercase font-bold tracking-wider bg-brand-accent hover:bg-brand-accentHover border-none text-white flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Initiating Checkout...' : 'Proceed to Payment Selector'}</span>
                </Button>
              </div>

            </div>
          )}

          {/* STEP 4: Payment Selector */}
          {step === 4 && checkoutPayload && (
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-brand-gray-900 uppercase tracking-tight">Select Payment Method</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-brand-gray-650">
                {[
                  { name: 'UPI', desc: 'Secure local UPI application callback / QR Code' },
                  { name: 'Net Banking', desc: 'Pre-selected list of Indian banking portals' },
                  { name: 'Card', desc: 'Credit / Debit Visa, Mastercard, RuPay' },
                  { name: 'COD', desc: 'Cash on delivery sandbox payments' }
                ].map((m) => (
                  <label key={m.name} className={`flex items-start space-x-3 p-4 border rounded-sm cursor-pointer hover:bg-brand-gray-50 transition-all ${
                    paymentMethod === m.name ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-gray-250'
                  }`}>
                    <input
                      type="radio"
                      name="payment_method_radio"
                      value={m.name}
                      checked={paymentMethod === m.name}
                      onChange={() => setPaymentMethod(m.name)}
                      className="text-brand-accent focus:ring-brand-accent mt-0.5 w-4.5 h-4.5"
                    />
                    <div>
                      <span className="font-extrabold text-brand-gray-900 block">{m.name}</span>
                      <span className="text-[10px] text-brand-gray-500 block mt-1">{m.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Payment sub-panels based on choice */}
              {paymentMethod === 'UPI' && (
                <div className="bg-brand-light p-6 rounded border border-brand-gray-250 space-y-4 text-xs font-semibold">
                  <h4 className="font-extrabold text-brand-gray-900 uppercase">UPI Address Config</h4>
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-brand-gray-655">Enter UPI VPA Address</label>
                    <input
                      type="text"
                      placeholder="e.g. piyush@hdfc"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'Net Banking' && (
                <div className="bg-brand-light p-6 rounded border border-brand-gray-250 space-y-4 text-xs font-semibold">
                  <h4 className="font-extrabold text-brand-gray-900 uppercase font-sans">Select Banking Institution</h4>
                  <select
                    value={netbankBank}
                    onChange={(e) => setNetbankBank(e.target.value)}
                    className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                  >
                    <option value="HDFC Bank">HDFC Bank Retail</option>
                    <option value="ICICI Bank">ICICI Bank Corporate</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="Axis Bank">Axis Bank</option>
                  </select>
                </div>
              )}

              {paymentMethod === 'Card' && (
                <div className="bg-brand-light p-6 rounded border border-brand-gray-250 space-y-4 text-xs font-semibold max-w-sm">
                  <h4 className="font-extrabold text-brand-gray-900 uppercase">Debit / Credit Card Details</h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-brand-gray-650">Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-white border border-brand-gray-250 p-2.5 rounded-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => setStep(3)} className="flex-1 text-xs uppercase font-bold tracking-wider">
                  Back to Review
                </Button>
                <Button 
                  type="button" 
                  variant="primary" 
                  disabled={paymentProcessing}
                  onClick={handleProcessOrderPayment} 
                  className="flex-1 text-xs uppercase font-bold tracking-wider bg-brand-dark hover:bg-brand-gray-850 border-none text-white"
                >
                  <span>{paymentProcessing ? 'Processing Transaction...' : paymentMethod === 'COD' ? 'Place Order (COD)' : 'Proceed to Payment'}</span>
                </Button>
              </div>

            </div>
          )}

        </div>

        {/* Right Side: Price Details Card */}
        <div className="lg:col-span-4 bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium space-y-4 select-none">
          <h3 className="font-extrabold text-brand-gray-900 text-xs tracking-wider uppercase border-b pb-3">Checkout Summary</h3>
          <div className="space-y-3 text-xs font-semibold text-brand-gray-650">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (GST Components):</span>
              <span>₹{totals.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Charges:</span>
              <span>{totals.shipping > 0 ? `₹${totals.shipping.toLocaleString()}` : 'FREE'}</span>
            </div>
            {passedCoupon && (
              <div className="flex justify-between text-green-600 font-bold">
                <span>Coupon Applied:</span>
                <span>- ₹1,000</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between font-black text-sm text-brand-gray-900">
              <span>Final Total Amount:</span>
              <span>₹{Math.max(0, totals.total - (passedCoupon ? 1000 : 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* UPI/Bank Mock Verification Dialog */}
      {showPaymentModal && checkoutPayload && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-dark text-white max-w-md w-full border border-brand-gray-800 rounded-sm shadow-premiumDark overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="bg-brand-surface px-6 py-4 border-b border-brand-gray-850 flex justify-between items-center text-xs font-semibold">
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-tight text-white uppercase">KAIA Technologies Gateway</span>
                <span className="text-[9px] uppercase tracking-wider text-brand-accent mt-0.5 font-bold">Secure Local Sandbox</span>
              </div>
              <span className="text-brand-gray-400">Order: {checkoutPayload.order.orderId}</span>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-center">
              <div className="space-y-2">
                <p className="text-xs text-brand-gray-400">Secure Payment Amount</p>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  ₹{checkoutPayload.order.finalAmount.toLocaleString()}
                </h3>
              </div>

              {paymentMethod === 'UPI' ? (
                <div className="bg-brand-surface p-6 border border-brand-gray-850 rounded-sm space-y-4 flex flex-col items-center">
                  <div className="w-36 h-36 bg-white p-2 rounded flex items-center justify-center select-none">
                    <div className="w-full h-full border-2 border-brand-dark flex flex-col items-center justify-center p-4 text-brand-dark">
                      <Building className="w-10 h-10 text-brand-accent mb-2" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">UPI SCAN CODE</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-brand-gray-450 leading-relaxed max-w-xs font-bold">
                    Scan using your UPI app. Address: <strong>{upiId || 'piyush@kaia'}</strong>. Sandbox callback will verify details.
                  </p>
                </div>
              ) : (
                <div className="bg-brand-surface p-6 border border-brand-gray-850 rounded-sm text-left space-y-3 text-xs font-semibold text-brand-gray-400">
                  <p>Netbanking Gateway: {netbankBank}</p>
                  <p className="text-[10px] leading-relaxed">
                    Click authorize to complete the bank settlement verification loop.
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  disabled={paymentProcessing}
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentProcessing(false);
                  }}
                  className="flex-1 border border-brand-gray-850 py-3 rounded text-xs font-bold hover:bg-brand-gray-850 disabled:opacity-40 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  disabled={paymentProcessing}
                  onClick={handleConfirmMockGateway}
                  className="flex-1 bg-brand-accent hover:bg-brand-accentHover text-white py-3 rounded text-xs font-bold transition-colors flex items-center justify-center space-x-2 disabled:opacity-40 uppercase tracking-wider"
                >
                  <span>{paymentProcessing ? 'Authorizing Sandbox...' : 'Authorize Payment'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </Container>
  );
};

export default Checkout;
