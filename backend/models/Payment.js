import mongoose from 'mongoose';

/**
 * PaymentAttempt sub-schema
 * Tracks each individual payment attempt for a given payment record.
 */
const paymentAttemptSchema = new mongoose.Schema(
  {
    attemptNumber: { type: Number, required: true },
    providerPaymentId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['initiated', 'pending', 'authorized', 'paid', 'failed', 'cancelled'],
      default: 'initiated',
    },
    failureReason: { type: String, default: '' }, // Safe public reason, no sensitive data
    method: { type: String, default: '' }, // upi, netbanking, card, cod
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Payment Model — Represents a gateway-level payment record for a master order.
 * NEVER store: card numbers, CVV, UPI PIN, bank credentials, secrets.
 */
const paymentSchema = new mongoose.Schema(
  {
    // Internal reference IDs
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Provider info
    provider: {
      type: String,
      enum: ['razorpay', 'cashfree', 'cod', 'mock'],
      required: true,
      default: 'razorpay',
    },
    providerOrderId: {
      type: String,
      default: '',
      index: true,
    },
    providerPaymentId: {
      type: String,
      default: '',
      index: true,
    },

    // Financials
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },

    // Payment state machine
    status: {
      type: String,
      enum: [
        'created',
        'pending',
        'authorized',
        'paid',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded',
      ],
      default: 'created',
      index: true,
    },

    // Selected payment method (populated after gateway callback)
    method: {
      type: String,
      enum: ['upi', 'netbanking', 'card', 'wallet', 'cod', 'other', ''],
      default: '',
    },

    // Payment attempt history (for retry tracking)
    attempts: [paymentAttemptSchema],

    // Idempotency: track processed webhook event IDs to prevent duplicate processing
    processedWebhookEvents: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup by provider order
paymentSchema.index({ provider: 1, providerOrderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
