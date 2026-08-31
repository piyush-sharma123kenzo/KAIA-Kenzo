import mongoose from 'mongoose';

/**
 * WebhookEvent Model — Idempotent store for incoming payment provider webhook events.
 * NEVER store full sensitive payload. Store only what is needed for processing.
 */
const webhookEventSchema = new mongoose.Schema(
  {
    // Unique event ID from the payment provider (used for idempotency)
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ['razorpay', 'cashfree', 'mock', 'shiprocket', 'delhivery', 'bluedart', 'shipping'],
      required: true,
    },

    eventType: {
      type: String,
      required: true, // e.g. 'payment.captured', 'payment.failed', 'order.paid'
    },

    // References
    providerOrderId: { type: String, default: '' },
    providerPaymentId: { type: String, default: '' },
    internalOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    // Processing state
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processingError: {
      type: String,
      default: '', // Safe error message, no secrets
    },

    // Timestamps
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
export default WebhookEvent;
