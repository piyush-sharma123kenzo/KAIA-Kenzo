import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, Ticket, Heart } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import axiosInstance from '../../api/axiosInstance';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cart, updateQuantity, removeFromCart, getCartTotals } = useContext(CartContext);
  const toast = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const totals = getCartTotals();

  // Group cart items by Brand
  const groupItemsByBrand = () => {
    const groups = {};
    cart.items.forEach((item) => {
      if (!item.product) return;
      const brandId = item.product.brand?._id || item.product.brand;
      const brandName = item.product.brand?.name || item.product.brandName || 'Authorized Warehouse';
      
      if (!groups[brandId]) {
        groups[brandId] = { brandName, items: [] };
      }
      groups[brandId].items.push(item);
    });
    return groups;
  };

  const brandGroups = groupItemsByBrand();

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    setCouponDiscount(0);

    if (!user) {
      setCouponError('Please sign in to apply coupon codes.');
      return;
    }

    try {
      const res = await axiosInstance.post('/coupons/verify', {
        code: couponCode,
        cartTotal: totals.subtotal + totals.tax,
      });

      if (res.data.success) {
        const val = res.data.coupon.value;
        let calculated = 0;
        
        if (res.data.coupon.type === 'PERCENTAGE') {
          calculated = (totals.subtotal + totals.tax) * (val / 100);
          if (res.data.coupon.maxDiscount && calculated > res.data.coupon.maxDiscount) {
            calculated = res.data.coupon.maxDiscount;
          }
        } else {
          calculated = val;
        }

        setCouponDiscount(calculated);
        setCouponSuccess(`Coupon Applied: Save ₹${calculated.toLocaleString()}!`);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code.');
    }
  };

  const handleMoveToWishlist = async (item) => {
    try {
      if (user) {
        await axiosInstance.post('/account/wishlist', { productId: item.product._id });
      } else {
        const history = localStorage.getItem('kaia_wishlist');
        let parsed = history ? JSON.parse(history) : [];
        if (!Array.isArray(parsed)) parsed = [];
        if (!parsed.some((w) => w._id === item.product._id)) {
          parsed.push(item.product);
          localStorage.setItem('kaia_wishlist', JSON.stringify(parsed));
        }
      }
      // Remove from cart
      await removeFromCart(item.product._id, item.selectedSpecs);
      toast.showToast('Item moved to Wishlist.', 'success');
    } catch (err) {
      console.error('Error moving to wishlist:', err);
    }
  };

  if (cart.items.length === 0) {
    return (
      <Container className="py-20 text-center space-y-6 select-none text-left">
        <ShoppingBag className="w-16 h-16 text-brand-gray-400 mx-auto" />
        <h3 className="text-xl font-bold text-brand-gray-800">Your cart is empty.</h3>
        <p className="text-xs text-brand-gray-500 max-w-sm mx-auto">
          Discover technology from leading brands on KAIA Technologies.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/products">
            <Button variant="primary" className="text-xs font-bold uppercase tracking-wider">
              Explore Products
            </Button>
          </Link>
          <Link to="/categories">
            <Button variant="outline" className="text-xs font-bold uppercase tracking-wider">
              Explore Categories
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  const finalCartTotal = Math.max(0, totals.total - couponDiscount);

  return (
    <Container className="py-10 space-y-8 select-none text-left">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-brand-gray-900 uppercase tracking-tight">Your Shopping Cart</h1>
        <p className="text-xs text-brand-gray-500">Review your technology before checkout.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Grouped by brand */}
        <div className="lg:col-span-8 space-y-6">
          {Object.keys(brandGroups).map((brandId) => {
            const group = brandGroups[brandId];
            return (
              <div key={brandId} className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">
                {/* Brand Group Header */}
                <div className="bg-brand-gray-50 px-6 py-3 border-b border-brand-gray-200 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-brand-gray-700">
                    Seller Depot: {group.brandName}
                  </span>
                  <span className="text-brand-accent">Direct Brand Fulfillment</span>
                </div>

                {/* Items */}
                <div className="divide-y divide-brand-gray-200">
                  {group.items.map((item, idx) => {
                    const prod = item.product || {};
                    const sellingPrice = Number(prod.sellingPrice ?? prod.price ?? 0);
                    const availableStock = prod.stock ? (prod.stock.quantity - prod.stock.reservedQuantity) : 5;
                    const isLimitHit = item.quantity >= availableStock;

                    return (
                      <div key={prod._id || prod.id || `cart-item-${idx}`} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-16 h-16 rounded-sm bg-brand-light border p-2 flex items-center justify-center shrink-0">
                            <img src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100'} alt="" className="object-contain max-h-full max-w-full" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-sm text-brand-gray-900 leading-tight">
                              {prod.name || 'Product'}
                            </h3>
                            {item.selectedSpecs && Object.keys(item.selectedSpecs).length > 0 && (
                              <p className="text-[10px] text-brand-accent uppercase font-bold">
                                Variant: {Object.values(item.selectedSpecs).join(' / ')}
                              </p>
                            )}
                            <p className="text-[10px] text-brand-gray-450 font-bold">Unit Price: ₹{sellingPrice.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Quantity Controls & Actions */}
                        <div className="flex items-center space-x-6">
                          <div className="space-y-1.5 flex flex-col items-center">
                            <div className="flex items-center border border-brand-gray-250 rounded bg-brand-light">
                              <button
                                disabled={item.quantity <= 1}
                                onClick={() => updateQuantity(prod._id, item.quantity - 1, item.selectedSpecs)}
                                className="p-1.5 hover:bg-brand-gray-200 disabled:opacity-40"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 text-xs font-bold text-brand-gray-800">{item.quantity}</span>
                              <button
                                disabled={isLimitHit}
                                onClick={() => updateQuantity(prod._id, item.quantity + 1, item.selectedSpecs)}
                                className="p-1.5 hover:bg-brand-gray-200 disabled:opacity-40"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {isLimitHit && (
                              <span className="text-[9px] text-red-500 font-extrabold">Only {availableStock} available</span>
                            )}
                          </div>

                          <div className="text-right w-24">
                            <p className="font-extrabold text-sm text-brand-gray-950">
                              ₹{(sellingPrice * item.quantity).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleMoveToWishlist(item)}
                              className="p-1.5 text-brand-gray-400 hover:text-brand-accent hover:bg-brand-accent/5 rounded transition-colors"
                              title="Move to Wishlist"
                            >
                              <Heart className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                removeFromCart(prod._id, item.selectedSpecs);
                                toast.showToast('Item removed from cart.', 'info');
                              }}
                              className="p-1.5 text-brand-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Coupon */}
          <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium text-left space-y-4">
            <h3 className="font-extrabold text-brand-gray-900 text-xs tracking-wider uppercase flex items-center space-x-2 pb-2 border-b">
              <Ticket className="w-4 h-4 text-brand-accent" />
              <span>Apply Coupon</span>
            </h3>
            
            <form onSubmit={handleApplyCoupon} className="flex space-x-2">
              <input
                type="text"
                placeholder="PROMOCODE"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full bg-brand-light border-brand-gray-250 p-2 rounded-sm text-xs focus:ring-0 uppercase font-bold"
              />
              <button
                type="submit"
                className="bg-brand-dark hover:bg-brand-gray-850 text-white font-bold px-4 text-xs rounded-sm transition-colors uppercase tracking-wider"
              >
                Apply
              </button>
            </form>

            {couponError && <p className="text-xs text-red-500 font-semibold">{couponError}</p>}
            {couponSuccess && <p className="text-xs text-green-600 font-semibold">{couponSuccess}</p>}
          </div>

          {/* Pricing Math */}
          <div className="bg-white border border-brand-gray-200 p-6 rounded-sm shadow-premium text-left space-y-4 text-xs font-semibold text-brand-gray-650">
            <h3 className="font-extrabold text-brand-gray-900 text-xs tracking-wider uppercase border-b pb-3">
              Order Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal (Excl. Tax):</span>
                <span>₹{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax Component:</span>
                <span>₹{totals.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Charges:</span>
                <span>{totals.shipping > 0 ? `₹${totals.shipping.toLocaleString()}` : 'FREE'}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Coupon Discount:</span>
                  <span>- ₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t border-brand-gray-200 pt-3 flex justify-between font-black text-sm text-brand-gray-900">
                <span>Total Amount:</span>
                <span>₹{finalCartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/checkout', { state: { couponCode: couponDiscount > 0 ? couponCode : '' } })}
                className="w-full bg-brand-accent hover:bg-brand-accentHover text-white font-extrabold py-3 rounded-sm text-xs transition-colors flex items-center justify-center space-x-2 uppercase tracking-wider"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <p className="text-[10px] text-brand-gray-400 text-center leading-relaxed font-semibold">
              GST invoices will be generated per seller child order automatically. Input credit claimed on business purchases.
            </p>
          </div>

        </div>

      </div>

    </Container>
  );
};

export default Cart;
