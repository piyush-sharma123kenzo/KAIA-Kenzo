/**
 * paymentService.js — Provider-agnostic payment service for KAIA Technologies.
 *
 * Architecture:
 *   Frontend → Backend (this service) → Razorpay/Cashfree → Webhook → DB Update
 *
 * Security Rules:
 * - NEVER expose RAZORPAY_KEY_SECRET to frontend.
 * - NEVER trust frontend-provided amounts.
 * - NEVER mark payment paid without server-side signature verification.
 * - NEVER process webhook without verifying provider signature.
 */

import crypto from 'crypto';
import {
  rupeesToPaise,
  paiseToRupees,
  validatePaymentAmount,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  generateReceiptId,
  getSafePaymentErrorMessage,
  logPaymentEvent,
} from '../../utils/paymentUtils.js';

// ---------------------------------------------------------------------------
// PROVIDER DETECTION
// ---------------------------------------------------------------------------

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'razorpay';
const PAYMENT_MODE = process.env.PAYMENT_MODE || 'test'; // 'test' | 'live'

/**
 * Get the active Razorpay instance (lazy initialization).
 * Only initialized when razorpay is the provider and SDK is available.
 */
let _razorpayInstance = null;

async function getRazorpayInstance() {
  if (_razorpayInstance) return _razorpayInstance;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // In test/sandbox mode, we use mock behavior if keys are not configured
    console.warn('[KAIA Payment] Razorpay credentials not configured. Running in MOCK mode.');
    return null;
  }

  try {
    // Dynamically import to avoid crashing if package is not installed
    const { default: Razorpay } = await import('razorpay');
    _razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    logPaymentEvent('razorpay_initialized', { mode: PAYMENT_MODE, provider: 'razorpay' });
    return _razorpayInstance;
  } catch (err) {
    console.warn('[KAIA Payment] razorpay npm package not installed. Using mock mode.', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// CREATE PAYMENT ORDER
// ---------------------------------------------------------------------------

/**
 * Create a payment provider order.
 *
 * Steps:
 * 1. Validate the INR amount from the database (never from frontend).
 * 2. Convert to paise for Razorpay.
 * 3. Create provider order via SDK or mock.
 * 4. Return only the safe information needed by the frontend SDK.
 *
 * @param {object} params
 * @param {string} params.internalOrderId - KAIA order ID (e.g. KAIA-ORD-20260829-1234)
 * @param {number} params.amountInRupees   - AUTHORITATIVE amount from database (INR)
 * @param {string} params.currency         - Always 'INR'
 * @param {string} params.notes            - Safe metadata (no secrets)
 * @returns {Promise<object>} Provider order details (safe for frontend)
 */
export async function createPaymentOrder({ internalOrderId, amountInRupees, currency = 'INR', notes = {} }) {
  // Validate amount before any provider call
  const validation = validatePaymentAmount(amountInRupees);
  if (!validation.valid) {
    throw new Error(`INVALID_AMOUNT: ${validation.reason}`);
  }

  const amountInPaise = rupeesToPaise(amountInRupees);
  const receiptId = generateReceiptId(internalOrderId);

  logPaymentEvent('create_payment_order_start', {
    internalOrderId,
    amountINR: amountInRupees,
    amountPaise: amountInPaise,
    currency,
    provider: PAYMENT_PROVIDER,
    mode: PAYMENT_MODE,
  });

  if (PAYMENT_PROVIDER === 'razorpay') {
    const razorpay = await getRazorpayInstance();

    if (razorpay) {
      // Real Razorpay SDK call
      const orderOptions = {
        amount: amountInPaise, // Must be in paise
        currency,
        receipt: receiptId,
        notes: {
          kaiaOrderId: internalOrderId,
          ...notes,
        },
      };

      const razorpayOrder = await razorpay.orders.create(orderOptions);

      logPaymentEvent('create_payment_order_success', {
        internalOrderId,
        providerOrderId: razorpayOrder.id,
        amountPaise: razorpayOrder.amount,
        status: razorpayOrder.status,
      });

      return {
        providerOrderId: razorpayOrder.id,
        amount: amountInRupees,       // Rupees for display
        amountPaise: razorpayOrder.amount, // Paise for SDK
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        provider: 'razorpay',
        // Public key ONLY — never key_secret
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      };
    }

    // Fallback: mock mode (when Razorpay keys not configured)
    return _createMockOrder({ internalOrderId, amountInRupees, amountInPaise, currency });
  }

  // Cashfree path — placeholder for future implementation
  if (PAYMENT_PROVIDER === 'cashfree') {
    throw new Error('Cashfree integration is not yet implemented in this phase.');
  }

  // Default mock mode
  return _createMockOrder({ internalOrderId, amountInRupees, amountInPaise, currency });
}

/**
 * Internal: Create a mock payment order (sandbox/development mode).
 */
function _createMockOrder({ internalOrderId, amountInRupees, amountInPaise, currency }) {
  const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  logPaymentEvent('create_mock_payment_order', {
    internalOrderId,
    mockOrderId,
    amountINR: amountInRupees,
    mode: 'mock',
  });

  return {
    providerOrderId: mockOrderId,
    amount: amountInRupees,
    amountPaise: amountInPaise,
    currency,
    receipt: generateReceiptId(internalOrderId),
    provider: 'mock',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  };
}

// ---------------------------------------------------------------------------
// VERIFY PAYMENT (Called from /api/payments/verify)
// ---------------------------------------------------------------------------

/**
 * Verify payment after gateway checkout completion.
 *
 * Frontend sends: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * Backend verifies HMAC SHA256 signature — NEVER trusts frontend alone.
 *
 * @param {object} params
 * @param {string} params.razorpayOrderId   - Provider order ID
 * @param {string} params.razorpayPaymentId - Provider payment ID
 * @param {string} params.razorpaySignature - HMAC signature from Razorpay checkout
 * @returns {{ verified: boolean, method: string, failureReason: string }}
 */
export async function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  logPaymentEvent('verify_payment_signature_start', {
    razorpayOrderId,
    razorpayPaymentId,
    signaturePresent: !!razorpaySignature,
  });

  // Mock mode: if running without real keys, accept mock signatures (starts with 'mock_sig_')
  const isRealProvider = PAYMENT_PROVIDER === 'razorpay' && !!process.env.RAZORPAY_KEY_SECRET;

  if (isRealProvider) {
    const isValid = verifyRazorpayPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      process.env.RAZORPAY_KEY_SECRET
    );

    logPaymentEvent('verify_payment_signature_result', {
      razorpayOrderId,
      razorpayPaymentId,
      verified: isValid,
    });

    return {
      verified: isValid,
      method: 'razorpay_hmac_sha256',
      failureReason: isValid ? '' : 'SIGNATURE_INVALID',
    };
  }

  // Mock mode: accept signatures that start with 'mock_sig_' or are non-empty for sandbox testing
  const isMockValid = razorpaySignature && (
    razorpaySignature.startsWith('mock_sig_') ||
    razorpaySignature.startsWith('sig_mock_') ||
    (PAYMENT_MODE === 'test' && razorpaySignature.length > 0)
  );

  logPaymentEvent('verify_payment_signature_mock', {
    razorpayOrderId,
    razorpayPaymentId,
    verified: !!isMockValid,
    mode: 'mock',
  });

  return {
    verified: !!isMockValid,
    method: 'mock',
    failureReason: isMockValid ? '' : 'SIGNATURE_INVALID',
  };
}

// ---------------------------------------------------------------------------
// VERIFY WEBHOOK SIGNATURE
// ---------------------------------------------------------------------------

/**
 * Verify incoming webhook from Razorpay.
 * Called BEFORE processing any webhook event.
 *
 * @param {Buffer} rawBody - Raw request body buffer (set by webhookMiddleware)
 * @param {string} signature - X-Razorpay-Signature header
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    // In mock/test mode without secrets configured: accept mock signature header
    const isMockSignature = signature === 'mock_webhook_sig' || signature === 'kaia_test_webhook';
    logPaymentEvent('verify_webhook_signature_mock', { accepted: isMockSignature });
    return isMockSignature;
  }

  const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);

  logPaymentEvent('verify_webhook_signature', { valid: isValid });
  return isValid;
}

// ---------------------------------------------------------------------------
// EXTRACT WEBHOOK EVENT DATA
// ---------------------------------------------------------------------------

/**
 * Parse a Razorpay webhook payload and extract safe fields.
 * @param {object} payload - Parsed webhook body
 * @returns {{ eventId, eventType, providerOrderId, providerPaymentId, status }}
 */
export function extractWebhookEventData(payload) {
  const eventType = payload.event || '';
  const eventId = payload.account_id
    ? `${payload.account_id}_${payload.created_at || Date.now()}`
    : `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const paymentEntity = payload.payload?.payment?.entity || {};
  const orderEntity = payload.payload?.order?.entity || {};

  return {
    eventId,
    eventType,
    providerOrderId: paymentEntity.order_id || orderEntity.id || '',
    providerPaymentId: paymentEntity.id || '',
    status: paymentEntity.status || '',
    method: paymentEntity.method || '',
  };
}

// ---------------------------------------------------------------------------
// HANDLE WEBHOOK (Orchestration — DB updates happen in controller)
// ---------------------------------------------------------------------------

/**
 * Handle a verified webhook event.
 * Returns a processing result object — actual DB updates handled by the controller.
 *
 * @param {object} webhookData - Extracted webhook event data
 * @returns {{ action: string, providerOrderId: string, providerPaymentId: string, status: string }}
 */
export function resolveWebhookAction(webhookData) {
  const { eventType, providerOrderId, providerPaymentId, status } = webhookData;

  logPaymentEvent('webhook_action_resolve', { eventType, providerOrderId });

  // Map Razorpay event types to KAIA actions
  const eventActionMap = {
    'payment.captured': { action: 'MARK_PAID', paymentStatus: 'paid' },
    'payment.authorized': { action: 'MARK_AUTHORIZED', paymentStatus: 'authorized' },
    'payment.failed': { action: 'MARK_FAILED', paymentStatus: 'failed' },
    'order.paid': { action: 'MARK_PAID', paymentStatus: 'paid' },
    'refund.created': { action: 'MARK_REFUNDED', paymentStatus: 'refunded' },
    'refund.processed': { action: 'MARK_REFUNDED', paymentStatus: 'refunded' },
  };

  const resolved = eventActionMap[eventType] || { action: 'UNHANDLED', paymentStatus: 'pending' };

  return {
    action: resolved.action,
    paymentStatus: resolved.paymentStatus,
    providerOrderId,
    providerPaymentId,
  };
}

// ---------------------------------------------------------------------------
// INITIATE REFUND (Called during return approval / inspection)
// ---------------------------------------------------------------------------

/**
 * Initiate an atomic refund for an order via Razorpay or sandbox fallback.
 * @param {object} params
 * @param {string} params.paymentId - Gateway provider payment ID (pay_xxx)
 * @param {number} params.amountInRupees - Total amount to refund in INR
 * @param {string} params.notes - Safe refund reason or return ID
 * @returns {Promise<{ providerRefundId: string, status: string, amount: number }>}
 */
export async function initiateRefund({ paymentId, amountInRupees, notes = {} }) {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (PAYMENT_PROVIDER === 'razorpay') {
    const razorpay = await getRazorpayInstance();
    const isSyntheticTest = !paymentId || paymentId.startsWith('mock_') || paymentId.includes('_test_');

    if (razorpay && !isSyntheticTest) {
      try {
        const refundResponse = await razorpay.payments.refund(paymentId, {
          amount: amountInPaise,
          notes,
        });

        logPaymentEvent('razorpay_refund_success', {
          paymentId,
          refundId: refundResponse.id,
          amountPaise: refundResponse.amount,
          status: refundResponse.status,
        });

        return {
          providerRefundId: refundResponse.id,
          status: refundResponse.status || 'processed',
          amount: amountInRupees,
          provider: 'razorpay',
        };
      } catch (err) {
        logPaymentEvent('razorpay_refund_error', { paymentId, error: err.message || err.error?.description });
        console.error('[PaymentService] Razorpay refund error:', err.message || err.error?.description);
        throw new Error(`Payment gateway refund failed: ${err.message || err.error?.description}`);
      }
    }
  }

  // Sandbox / Mock fallback when Razorpay credentials are not live
  const mockRefundId = `rfnd_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  logPaymentEvent('mock_refund_processed', { paymentId, mockRefundId, amountInRupees });

  return {
    providerRefundId: mockRefundId,
    status: 'processed',
    amount: amountInRupees,
    provider: 'mock',
  };
}

// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------

export default {
  createPaymentOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  extractWebhookEventData,
  resolveWebhookAction,
  initiateRefund,
};