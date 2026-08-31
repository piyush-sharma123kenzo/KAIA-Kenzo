/**
 * paymentService.js — Frontend Payment API Service for KAIA Technologies
 *
 * Security Rules:
 * - This file NEVER contains any secret keys.
 * - RAZORPAY_KEY_SECRET is NEVER present here.
 * - All sensitive operations happen on the backend.
 * - This service only calls the backend API and handles the Razorpay checkout SDK.
 */

import axiosInstance from '../api/axiosInstance';

// ---------------------------------------------------------------------------
// CREATE PAYMENT ORDER
// Calls backend to create a provider-side payment order.
// Backend calculates the amount — never trust frontend amount.
// ---------------------------------------------------------------------------
export const createPaymentOrder = async (kaiaOrderId) => {
  const response = await axiosInstance.post('/payments/create-order', {
    orderId: kaiaOrderId,
  });
  return response.data;
};

// ---------------------------------------------------------------------------
// VERIFY PAYMENT
// Sends payment identifiers to backend for HMAC signature verification.
// Backend verifies — frontend result alone is NEVER authoritative.
// ---------------------------------------------------------------------------
export const verifyPayment = async ({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const response = await axiosInstance.post('/payments/verify', {
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return response.data;
};

// ---------------------------------------------------------------------------
// GET PAYMENT STATUS
// Poll the backend to check the current payment status for an order.
// Used on the payment-pending page.
// ---------------------------------------------------------------------------
export const getPaymentStatus = async (orderId) => {
  const response = await axiosInstance.get(`/payments/status/${orderId}`);
  return response.data;
};

// ---------------------------------------------------------------------------
// GET PAYMENT DETAILS
// Get details of a specific payment record by payment ID.
// ---------------------------------------------------------------------------
export const getPaymentById = async (paymentId) => {
  const response = await axiosInstance.get(`/payments/${paymentId}`);
  return response.data;
};

// ---------------------------------------------------------------------------
// RETRY PAYMENT
// Initiate a new payment attempt for an existing pending order.
// Does NOT create a duplicate order.
// ---------------------------------------------------------------------------
export const retryPayment = async (orderId) => {
  const response = await axiosInstance.post(`/payments/retry/${orderId}`);
  return response.data;
};

// ---------------------------------------------------------------------------
// OPEN RAZORPAY CHECKOUT
// Opens the Razorpay checkout modal with the payment order details.
// Handles success and failure callbacks.
//
// Parameters:
//   - paymentOrderData: returned from createPaymentOrder() backend call
//   - user: { name, email, phone }
//   - onSuccess: callback({ razorpayPaymentId, razorpayOrderId, razorpaySignature })
//   - onFailure: callback({ error })
//   - onDismiss: callback()
// ---------------------------------------------------------------------------
export const openRazorpayCheckout = ({ paymentOrderData, user, onSuccess, onFailure, onDismiss }) => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay SDK is loaded
    if (typeof window === 'undefined' || !window.Razorpay) {
      reject(new Error('Payment gateway is not available. Please refresh the page and try again.'));
      return;
    }

    const options = {
      // Public key only — NEVER the secret key
      key: paymentOrderData.razorpayKeyId,
      amount: paymentOrderData.amountPaise, // Amount in paise
      currency: paymentOrderData.currency || 'INR',
      name: 'KAIA Technologies',
      description: `Order ${paymentOrderData.orderId}`,
      order_id: paymentOrderData.providerOrderId,

      // Prefill customer details (optional, improves UX)
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '',
      },

      // Theme
      theme: {
        color: '#0A0A0A',
        backdrop_color: 'rgba(0,0,0,0.75)',
      },

      // Payment methods — handled by Razorpay gateway
      // Do NOT add custom banking forms here
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
          resolve({ dismissed: true });
        },
      },

      // Success handler — frontend receives payment identifiers
      // These must be verified by the backend before trusting
      handler: async (response) => {
        // response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
        if (onSuccess) {
          onSuccess({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
        }
        resolve({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
    };

    try {
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        const safeError = {
          code: response.error?.code || 'PAYMENT_FAILED',
          description: response.error?.description || 'Payment failed',
          // Do NOT expose: response.error.source, response.error.step, response.error.reason
          // (these may contain sensitive internal info)
        };

        if (onFailure) onFailure({ error: safeError });
        resolve({ failed: true, error: safeError });
      });

      rzp.open();
    } catch (err) {
      reject(new Error('Payment gateway could not be opened. Please try again.'));
    }
  });
};

// ---------------------------------------------------------------------------
// LOAD RAZORPAY SDK
// Dynamically injects the Razorpay checkout.js script.
// Must be called before openRazorpayCheckout().
// ---------------------------------------------------------------------------
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load payment gateway. Check your internet connection.'));

    document.head.appendChild(script);
  });
};

export default {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getPaymentById,
  retryPayment,
  openRazorpayCheckout,
  loadRazorpayScript,
};
