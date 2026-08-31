/**
 * PaymentCheckout.jsx — Razorpay Checkout Integration Component
 *
 * Security:
 * - Only uses the PUBLIC razorpayKeyId (never the secret).
 * - All verification happens on the backend after checkout.
 * - Handles all gateway states: loading, success, failure, dismiss.
 */

import React, { useState, useCallback } from 'react';
import { Shield, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  createPaymentOrder,
  verifyPayment,
  loadRazorpayScript,
  openRazorpayCheckout,
} from '../../services/paymentService';

const PaymentCheckout = ({
  kaiaOrderId,       // Internal KAIA order ID (e.g. KAIA-ORD-20260829-1234)
  user,              // { name, email, phone }
  onPaymentSuccess,  // callback(verificationData)
  onPaymentFailure,  // callback(errorMessage)
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading-sdk | creating-order | gateway-open | verifying | done

  const handleProceedToPayment = useCallback(async () => {
    if (loading || disabled) return;

    setLoading(true);
    setError('');
    setPhase('loading-sdk');

    try {
      // Step 1: Load Razorpay checkout.js SDK
      await loadRazorpayScript();

      // Step 2: Create payment order on backend
      // Backend calculates the amount from the database — never trust frontend amount
      setPhase('creating-order');
      const paymentOrderData = await createPaymentOrder(kaiaOrderId);

      if (!paymentOrderData.success) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      // Step 3: Open Razorpay checkout modal
      setPhase('gateway-open');
      const checkoutResult = await openRazorpayCheckout({
        paymentOrderData,
        user,

        onSuccess: async ({ razorpayPaymentId, razorpayOrderId, razorpaySignature }) => {
          // Step 4: Verify payment on backend (AUTHORITATIVE step)
          setPhase('verifying');
          try {
            const verificationData = await verifyPayment({
              orderId: kaiaOrderId,
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature,
            });

            if (verificationData.success) {
              setPhase('done');
              if (onPaymentSuccess) onPaymentSuccess(verificationData);
            } else {
              setError('Payment verification failed. Please contact support if amount was debited.');
              if (onPaymentFailure) onPaymentFailure('Verification failed');
            }
          } catch (verifyErr) {
            // Verification API error — do NOT mark as paid
            setError('Payment verification could not be completed. If you were charged, please contact KAIA support with your order ID.');
            if (onPaymentFailure) onPaymentFailure('Verification API error');
          }
        },

        onFailure: ({ error: gatewayError }) => {
          setError('Payment could not be completed. Please try again or use a different payment method.');
          if (onPaymentFailure) onPaymentFailure(gatewayError?.description || 'Gateway failure');
          setPhase('idle');
          setLoading(false);
        },

        onDismiss: () => {
          setPhase('idle');
          setLoading(false);
        },
      });

      if (checkoutResult?.dismissed) {
        setPhase('idle');
        setLoading(false);
      }
    } catch (err) {
      const safeMessage =
        err.message?.includes('Payment gateway')
          ? err.message
          : 'Payment could not be initiated. Please try again.';
      setError(safeMessage);
      if (onPaymentFailure) onPaymentFailure(safeMessage);
      setPhase('idle');
      setLoading(false);
    }
  }, [loading, disabled, kaiaOrderId, user, onPaymentSuccess, onPaymentFailure]);

  const phaseLabel = {
    'idle': 'Proceed to Payment',
    'loading-sdk': 'Loading Gateway...',
    'creating-order': 'Creating Payment Order...',
    'gateway-open': 'Complete payment in the gateway...',
    'verifying': 'Verifying Payment...',
    'done': 'Payment Verified ✓',
  };

  return (
    <div className="space-y-4">
      {/* Security Badge */}
      <div className="flex items-center space-x-2 text-[10px] font-semibold text-brand-gray-500 bg-brand-light border border-brand-gray-200 rounded px-3 py-2">
        <Shield className="w-3.5 h-3.5 text-green-600 shrink-0" />
        <span>
          Payments secured by{' '}
          <strong className="text-brand-gray-800">Razorpay</strong>. KAIA never stores
          your card, UPI PIN, or banking credentials.
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded px-4 py-3 text-xs font-semibold text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handleProceedToPayment}
        disabled={loading || disabled || phase === 'done'}
        className={`w-full py-3.5 rounded font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
          phase === 'done'
            ? 'bg-green-600 text-white cursor-default'
            : loading
            ? 'bg-brand-gray-800 text-white cursor-wait opacity-80'
            : 'bg-brand-dark hover:bg-brand-gray-850 text-white active:scale-[0.98]'
        } disabled:opacity-60`}
        id="payment-checkout-btn"
      >
        {phase === 'done' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Payment Confirmed</span>
          </>
        ) : loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{phaseLabel[phase]}</span>
          </>
        ) : (
          <span>{phaseLabel.idle}</span>
        )}
      </button>

      {/* Helper text */}
      {phase === 'gateway-open' && (
        <p className="text-[10px] text-brand-gray-450 text-center font-semibold">
          Please complete the payment in the Razorpay window. Do not close this page.
        </p>
      )}
    </div>
  );
};

export default PaymentCheckout;
