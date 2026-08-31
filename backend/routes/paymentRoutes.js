/**
 * paymentRoutes.js — Payment API Routes for KAIA Technologies
 *
 * Route Structure:
 *   POST /api/payments/create-order    — Create gateway order (authenticated)
 *   POST /api/payments/verify          — Verify payment after checkout (authenticated)
 *   POST /api/payments/webhook         — Receive provider webhooks (signature-verified, public)
 *   GET  /api/payments/status/:orderId — Poll payment status (authenticated)
 *   GET  /api/payments/:paymentId      — Get payment details (authenticated)
 *   POST /api/payments/retry/:orderId  — Retry a failed payment (authenticated)
 *
 * Security:
 * - Customer endpoints protected with JWT auth middleware.
 * - Webhook endpoint: NOT JWT-protected (provider calls it directly).
 *   Security comes from Razorpay webhook signature verification in the controller.
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createPaymentOrder,
  verifyPayment,
  confirmCodOrder,
  paymentWebhook,
  getPaymentById,
  retryPayment,
  getPaymentStatusByOrderId,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// RATE LIMITING — Prevent abuse of payment endpoints
// ---------------------------------------------------------------------------

// Limit payment creation: 10 attempts per IP per 15 minutes
const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many payment requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit verification: 20 per IP per 10 minutes
const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { message: 'Too many verification attempts. Please wait before retrying.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit retry: 5 per IP per 15 minutes
const retryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many retry attempts. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

/**
 * POST /api/payments/create-order
 * Create a Razorpay/provider payment order for a KAIA order.
 * Frontend uses the providerOrderId + razorpayKeyId to open checkout.
 * Secret key is NEVER returned.
 */
router.post('/create-order', protect, createOrderLimiter, createPaymentOrder);

/**
 * POST /api/payments/verify
 * Verify payment after Razorpay checkout completes.
 * Frontend sends razorpayOrderId, razorpayPaymentId, razorpaySignature.
 * Backend verifies HMAC — NEVER marks paid based on frontend claim alone.
 */
router.post('/verify', protect, verifyLimiter, verifyPayment);

/**
 * POST /api/payments/cod
 * Confirm Cash on Delivery order.
 */
router.post('/cod', protect, confirmCodOrder);

/**
 * POST /api/payments/webhook
 * Receive Razorpay webhook events.
 * NOT JWT-protected — Razorpay calls this directly.
 * Security: Webhook signature is verified inside the controller using HMAC SHA256.
 *
 * IMPORTANT: This route does NOT use express.json() from the global middleware
 * because we need the raw body for webhook signature verification.
 * The rawBodyPreserver is applied globally in server.js via express.json({ verify: ... })
 */
router.post('/webhook', paymentWebhook);

/**
 * GET /api/payments/status/:orderId
 * Poll payment status for a pending order.
 * Used by the frontend polling mechanism on the payment-pending page.
 */
router.get('/status/:orderId', protect, getPaymentStatusByOrderId);

/**
 * POST /api/payments/retry/:orderId
 * Create a new payment attempt for a failed/pending order.
 * Prevents creating duplicate orders.
 */
router.post('/retry/:orderId', protect, retryLimiter, retryPayment);

/**
 * GET /api/payments/:paymentId
 * Get details for a specific payment record.
 * Customer can only view their own payment.
 */
router.get('/:paymentId', protect, getPaymentById);

export default router;
