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
 * RefundHistory sub-schema
 */
const refundHistorySchema = new mongoose.Schema(
  {
    refundId: { type: String, required: true },
    providerRefundId: { type: String, default: '' },
    amount: { type: Number, required: true },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
    },
    refundedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Payment Model — Gateway-level payment record for orders in KAIA Technologies.
 * NEVER store: card numbers, CVV, UPI PIN, bank credentials, secrets.
 */
const paymentSchema = new mongoose.Schema(
  {
    // Internal reference IDs (dual support for orderId & order, customerId & user)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // Provider info
    provider: {
      type: String,
      enum: ['razorpay', 'cashfree', 'cod'],
      required: true,
      default: 'razorpay',
    },
    providerOrderId: {
      type: String,
      default: '',
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: '',
      index: true,
    },
    providerPaymentId: {
      type: String,
      default: '',
      index: true,
    },
    razorpayPaymentId: {
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
    amountRefunded: {
      type: Number,
      default: 0,
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

    // Security & Gateway Verification flags
    signatureVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    webhookProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },

    // Selected payment method (populated after gateway callback)
    method: {
      type: String,
      enum: ['upi', 'netbanking', 'card', 'wallet', 'cod', 'other', ''],
      default: '',
    },

    // Payment attempt history (for retry tracking)
    attempts: [paymentAttemptSchema],

    // Refund tracking
    refunds: [refundHistorySchema],

    // Idempotency: track processed webhook event IDs to prevent duplicate processing
    processedWebhookEvents: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Keep dual-reference fields synchronized before saving
paymentSchema.pre('save', function (next) {
  if (this.orderId && !this.order) {
    this.order = this.orderId;
  } else if (this.order && !this.orderId) {
    this.orderId = this.order;
  }

  if (this.customerId && !this.user) {
    this.user = this.customerId;
  } else if (this.user && !this.customerId) {
    this.customerId = this.user;
  }

  if (this.providerOrderId && !this.razorpayOrderId) {
    this.razorpayOrderId = this.providerOrderId;
  } else if (this.razorpayOrderId && !this.providerOrderId) {
    this.providerOrderId = this.razorpayOrderId;
  }

  if (this.providerPaymentId && !this.razorpayPaymentId) {
    this.razorpayPaymentId = this.providerPaymentId;
  } else if (this.razorpayPaymentId && !this.providerPaymentId) {
    this.providerPaymentId = this.razorpayPaymentId;
  }

  next();
});

// Compound index for fast lookup by provider order
paymentSchema.index({ provider: 1, providerOrderId: 1 });
paymentSchema.index({ provider: 1, razorpayOrderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
