/**
 * PaymentFailed.jsx — Payment Failed Page
 *
 * Shown when a payment attempt is declined or cancelled.
 * Provides safe retry options without creating duplicate orders.
 */

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { XCircle, RefreshCw, ShoppingCart, CreditCard, Phone } from 'lucide-react';
import Container from '../../components/ui/Container';
import Button from '../../components/ui/Button';
import { retryPayment } from '../../services/paymentService';

// Safe, customer-friendly failure reasons (no internal error codes)
const SAFE_FAILURE_REASONS = [
  'Insufficient funds or card limit exceeded',
  'Payment was declined by your bank',
  'Transaction timed out — please try again',
  'UPI collect request was not approved',
  'Net banking session expired',
];

const PaymentFailed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId || new URLSearchParams(location.search).get('orderId');
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  const handleRetryPayment = async () => {
    if (!orderId || retrying) return;

    setRetrying(true);
    setRetryError('');

    try {
      // Retry on the SAME order — does NOT create a new order
      const retryData = await retryPayment(orderId);

      if (retryData.success) {
        // Navigate back to checkout at the payment step with retry data
        navigate('/checkout', {
          state: {
            retryPayment: true,
            retryData,
            orderId,
          },
        });
      }
    } catch (err) {
      const safeMessage = err.response?.data?.message || 'Could not initiate retry. Please try again.';
      setRetryError(safeMessage);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Container className="py-16 max-w-xl mx-auto">
      <div className="bg-white border border-brand-gray-200 rounded-sm shadow-premium overflow-hidden">

        {/* Header */}
        <div className="bg-red-950 px-8 py-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            Payment Failed
          </h1>
          <p className="text-xs text-red-300/80 mt-1 font-semibold">
            Your payment could not be completed
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Order Reference */}
          {orderId && (
            <div className="bg-brand-light border border-brand-gray-200 rounded px-4 py-3 text-xs font-semibold text-brand-gray-650">
              <span className="text-brand-gray-400 uppercase tracking-wider text-[9px] block mb-1">Order Reference</span>
              <span className="font-mono font-extrabold text-brand-gray-900 text-sm">{orderId}</span>
            </div>
          )}

          {/* Possible Reasons (safe, generic) */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-brand-gray-700 uppercase tracking-wide">
              Common Reasons
            </h3>
            <ul className="space-y-2">
              {SAFE_FAILURE_REASONS.map((reason, idx) => (
                <li key={idx} className="flex items-center space-x-2 text-[10px] font-semibold text-brand-gray-550">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Retry Error */}
          {retryError && (
            <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-xs font-semibold text-red-700">
              {retryError}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2 border-t border-brand-gray-100">
            {/* Retry on same order */}
            {orderId && (
              <Button
                variant="primary"
                onClick={handleRetryPayment}
                disabled={retrying}
                className="w-full text-xs uppercase font-bold tracking-wider flex items-center justify-center space-x-2"
                id="retry-payment-btn"
              >
                <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Initiating Retry...' : 'Retry Payment'}</span>
              </Button>
            )}

            {/* Return to cart to re-initiate */}
            <Link to="/cart">
              <Button
                variant="secondary"
                className="w-full text-xs uppercase font-bold tracking-wider flex items-center justify-center space-x-2"
                id="return-to-cart-btn"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Return to Cart</span>
              </Button>
            </Link>

            <Link to="/account?tab=orders" className="block text-center text-xs font-bold text-brand-accent hover:underline uppercase tracking-wider pt-1">
              View My Orders
            </Link>
          </div>

          {/* Safety Note */}
          <div className="text-[9px] text-brand-gray-400 font-medium leading-relaxed border-t border-brand-gray-100 pt-4">
            Your order has not been cancelled. You can retry payment for the same order using the
            button above. No duplicate charges will be created.
          </div>
        </div>

      </div>
    </Container>
  );
};

export default PaymentFailed;
