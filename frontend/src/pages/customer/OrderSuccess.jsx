/**
 * OrderSuccess.jsx — Order Success Page
 *
 * IMPORTANT: This page is NOT proof of payment.
 * The backend payment status is AUTHORITATIVE.
 * This page verifies the payment status from the backend before displaying success.
 */

import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight, Loader2, AlertCircle, Package } from 'lucide-react';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import axiosInstance from '../../api/axiosInstance';
import KaiaLogo from '../../components/common/KaiaLogo';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const orderId = location.state?.orderId || location.state?.order?.orderId;
  const paymentStatus = location.state?.paymentStatus;

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!!orderId && !location.state?.order);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  // Verify payment status from backend — success page alone is NOT authoritative
  useEffect(() => {
    if (!orderId) {
      setError('No order reference found. Please check your order history.');
      return;
    }

    const verifyOrderFromBackend = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/orders/${orderId}`);
        const fetchedOrder = res.data.order;

        if (!fetchedOrder) {
          setError('Order not found.');
          return;
        }

        // Authoritative check: backend paymentStatus must be 'Paid'
        if (fetchedOrder.paymentStatus !== 'Paid') {
          // Payment not confirmed — redirect to pending
          navigate('/payment-pending', { state: { orderId } });
          return;
        }

        setOrder(fetchedOrder);
        setVerified(true);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Order not found. Please check your order history.');
        } else {
          setError('Could not verify order status. Please check your orders.');
        }
      } finally {
        setLoading(false);
      }
    };

    // If we came from a payment verify flow, we already confirmed backend success
    // But still fetch fresh order details for display
    verifyOrderFromBackend();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <Container className="py-16 text-center max-w-xl mx-auto">
        <div className="bg-white border border-brand-gray-200 p-12 rounded-sm shadow-premium flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
          <p className="text-xs font-semibold text-brand-gray-500 uppercase tracking-wider">
            Verifying order status...
          </p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-16 max-w-xl mx-auto">
        <div className="bg-white border border-brand-gray-200 p-8 rounded-sm shadow-premium text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h1 className="text-xl font-black text-brand-gray-900 uppercase tracking-tight">
            Unable to Confirm
          </h1>
          <p className="text-xs text-brand-gray-500">{error}</p>
          <Link to="/account?tab=orders">
            <Button variant="primary" className="text-xs font-bold uppercase tracking-wider">
              View My Orders
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  if (!order) return null;

  const shippingAddr = order.shippingAddress;

  return (
    <Container className="py-16 text-left select-none max-w-xl mx-auto">
      <div className="bg-white border border-brand-gray-250 p-8 rounded-sm shadow-premium text-center space-y-6 flex flex-col items-center">
        
        {/* Brand Lockup */}
        <KaiaLogo to="/" variant="full" theme="light" size="md" />

        {/* Success Icon */}
        <div className="inline-block p-4 bg-green-50 border border-green-200 rounded-full text-green-700">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-brand-gray-900 tracking-tight uppercase">
            Payment Successful!
          </h1>
          <p className="text-xs text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
            Your payment has been verified and your order is now confirmed. Brand partners will prepare your items for dispatch.
          </p>
        </div>

        {/* Order Summary Receipt */}
        <div className="border border-brand-gray-200 rounded text-left p-6 space-y-4 text-xs font-semibold text-brand-gray-650 bg-brand-light">

          <div className="flex justify-between border-b pb-2">
            <span>Order Reference:</span>
            <span className="font-mono font-extrabold text-brand-gray-900">{order.orderId}</span>
          </div>

          {order.paymentDetails?.transactionId && (
            <div className="flex justify-between border-b pb-2">
              <span>Payment ID:</span>
              <span className="font-mono font-extrabold text-brand-gray-900 text-[10px]">
                {order.paymentDetails.transactionId}
              </span>
            </div>
          )}

          <div className="flex justify-between border-b pb-2">
            <span>Amount Paid:</span>
            <span className="font-extrabold text-brand-gray-900 text-sm">
              ₹{order.finalAmount?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>Payment Status:</span>
            <span className="font-extrabold text-green-600 uppercase tracking-wide">
              {order.paymentStatus}
            </span>
          </div>

          {/* Shipping Address */}
          {shippingAddr && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-brand-gray-450">
                Delivery Destination:
              </span>
              <p className="font-extrabold text-brand-gray-900">{shippingAddr.name}</p>
              <p className="text-brand-gray-550 leading-relaxed">
                {shippingAddr.street}, {shippingAddr.city}, {shippingAddr.state} — {shippingAddr.postalCode}
              </p>
              <p className="text-brand-gray-400 text-[10px]">Phone: {shippingAddr.phone}</p>
            </div>
          )}

          {/* Child Orders summary */}
          {order.childOrders?.length > 0 && (
            <div className="space-y-1 border-t pt-3">
              <span className="text-[10px] uppercase font-bold text-brand-gray-450 flex items-center space-x-1">
                <Package className="w-3 h-3" />
                <span>Brand Shipments ({order.childOrders.length})</span>
              </span>
              {order.childOrders.map((co, idx) => (
                <div key={idx} className="flex justify-between text-[10px] text-brand-gray-500">
                  <span>{co.orderId}</span>
                  <span className="text-brand-gray-400">{co.fulfillmentStatus}</span>
                </div>
              ))}
            </div>
          )}

          {/* Estimated delivery */}
          <div className="flex justify-between text-[10px] text-brand-gray-400 pt-2">
            <span>Estimated Delivery:</span>
            <span className="font-bold text-brand-gray-600">2–5 Business Days</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link to="/account?tab=orders" className="flex-1">
            <Button variant="primary" className="w-full text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>View Order</span>
            </Button>
          </Link>
          <Link to="/products" className="flex-1">
            <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2">
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Backend verification note */}
        <p className="text-[9px] text-brand-gray-350 font-medium">
          Payment confirmed by KAIA backend verification system.
          Order ID: {order.orderId}
        </p>

      </div>
    </Container>
  );
};

export default OrderSuccess;
