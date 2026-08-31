/**
 * paymentUtils.js — Safe payment utility functions for KAIA Technologies.
 *
 * Rules:
 * - NEVER log secrets, keys, card data, UPI PINs.
 * - Amount conversions are explicit and auditable.
 * - Signature verification uses crypto — never string equality for secrets.
 */

import crypto from 'crypto';

// ---------------------------------------------------------------------------
// AMOUNT CONVERSION UTILITIES
// ---------------------------------------------------------------------------

/**
 * Convert rupees (INR) to paise (smallest unit for Razorpay).
 * Razorpay accepts amounts in paise (1 INR = 100 paise).
 *
 * IMPORTANT: Do NOT accidentally pass paise as rupees or vice versa.
 * Example: ₹1,000 → 100000 paise (correct)
 *          ₹1,000 → 1000 paise (WRONG — charges ₹10)
 *
 * @param {number} rupees - Amount in Indian Rupees (e.g. 1000.50)
 * @returns {number} Amount in paise as integer (e.g. 100050)
 */
export function rupeesToPaise(rupees) {
  if (typeof rupees !== 'number' || isNaN(rupees) || rupees < 0) {
    throw new Error(`Invalid amount for conversion: ${rupees}`);
  }
  return Math.round(rupees * 100);
}

/**
 * Convert paise back to rupees (for display/logging purposes).
 * @param {number} paise - Amount in paise
 * @returns {number} Amount in Indian Rupees
 */
export function paiseToRupees(paise) {
  if (typeof paise !== 'number' || isNaN(paise) || paise < 0) {
    throw new Error(`Invalid paise value for conversion: ${paise}`);
  }
  return paise / 100;
}

/**
 * Validate that a rupee amount is safe to process.
 * Minimum: ₹1 (100 paise — Razorpay minimum)
 * Maximum: ₹5,00,000 (configurable business limit)
 *
 * @param {number} rupees - Amount in INR
 * @returns {{ valid: boolean, reason: string }}
 */
export function validatePaymentAmount(rupees) {
  const MIN_INR = 1;
  const MAX_INR = 500000; // ₹5 lakh per transaction limit

  if (typeof rupees !== 'number' || isNaN(rupees)) {
    return { valid: false, reason: 'Amount must be a number.' };
  }
  if (rupees < MIN_INR) {
    return { valid: false, reason: `Minimum payable amount is ₹${MIN_INR}.` };
  }
  if (rupees > MAX_INR) {
    return { valid: false, reason: `Maximum single transaction limit is ₹${MAX_INR.toLocaleString('en-IN')}.` };
  }
  return { valid: true, reason: '' };
}

// ---------------------------------------------------------------------------
// SIGNATURE VERIFICATION UTILITIES
// ---------------------------------------------------------------------------

/**
 * Verify Razorpay payment signature using HMAC SHA256.
 * This is the AUTHORITATIVE verification — do NOT skip this step.
 *
 * Razorpay signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 *
 * @param {string} razorpayOrderId - Razorpay order ID (from create order response)
 * @param {string} razorpayPaymentId - Razorpay payment ID (from checkout callback)
 * @param {string} razorpaySignature - Signature provided by Razorpay checkout
 * @param {string} keySecret - RAZORPAY_KEY_SECRET from env (NEVER from frontend)
 * @returns {boolean} true if signature is valid
 */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  keySecret
) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !keySecret) {
    return false;
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(razorpaySignature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verify Razorpay webhook signature.
 * Razorpay sends: X-Razorpay-Signature header = HMAC_SHA256(raw_body, webhook_secret)
 *
 * IMPORTANT: rawBody must be the raw Buffer — do NOT parse it first.
 *
 * @param {Buffer|string} rawBody - Raw request body (before JSON parsing)
 * @param {string} signature - X-Razorpay-Signature header value
 * @param {string} webhookSecret - RAZORPAY_WEBHOOK_SECRET from env
 * @returns {boolean}
 */
export function verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret) {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// SAFE ERROR RESPONSES
// ---------------------------------------------------------------------------

/**
 * Map internal payment errors to safe customer-facing messages.
 * Never expose provider error codes or internal details to customer.
 *
 * @param {string} internalCode - Internal error code
 * @returns {string} Safe customer-facing message
 */
export function getSafePaymentErrorMessage(internalCode) {
  const safeMessages = {
    SIGNATURE_INVALID: 'Payment could not be verified. Please try again.',
    WEBHOOK_INVALID_SIGNATURE: 'Webhook verification failed.',
    ORDER_NOT_FOUND: 'Order reference not found.',
    ORDER_ALREADY_PAID: 'This order has already been paid.',
    AMOUNT_MISMATCH: 'Payment amount does not match order amount.',
    PROVIDER_ERROR: 'Payment could not be completed. Please try again.',
    INSUFFICIENT_STOCK: 'Some items in your order are no longer available.',
    INVALID_INPUT: 'Invalid payment information provided.',
    GATEWAY_UNAVAILABLE: 'Payment gateway is currently unavailable. Please try again later.',
    DEFAULT: 'Payment could not be completed. Please try again.',
  };

  return safeMessages[internalCode] || safeMessages.DEFAULT;
}

// ---------------------------------------------------------------------------
// ORDER ID GENERATOR
// ---------------------------------------------------------------------------

/**
 * Generate a unique Razorpay receipt ID for a payment order.
 * Must be <= 40 characters for Razorpay.
 *
 * @param {string} internalOrderId - KAIA internal order ID
 * @returns {string}
 */
export function generateReceiptId(internalOrderId) {
  const timestamp = Date.now().toString().slice(-8);
  const receipt = `kaia_${timestamp}`;
  return receipt.slice(0, 40); // Razorpay 40 char limit
}

// ---------------------------------------------------------------------------
// SAFE PAYMENT LOG HELPER
// ---------------------------------------------------------------------------

/**
 * Log payment events safely — NEVER logs secrets or sensitive data.
 * @param {string} event - Event name
 * @param {object} data - Safe data to log (no secrets)
 */
export function logPaymentEvent(event, data = {}) {
  const safeData = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Sanitize: remove any accidental secret fields
  const forbiddenKeys = ['secret', 'key_secret', 'webhook_secret', 'password', 'cvv', 'pin', 'otp'];
  forbiddenKeys.forEach((key) => {
    if (safeData[key]) safeData[key] = '[REDACTED]';
  });

  console.log(`[KAIA Payment] ${JSON.stringify(safeData)}`);
}
