import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true },
    sku: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    refundAmount: { type: Number, required: true },
    serialNumbers: [{ type: String }],
    returnCondition: { type: String, default: 'opened' },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
  {
    returnId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    masterOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    sellerOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },

    items: [returnItemSchema],

    reason: {
      type: String,
      enum: [
        'defective',
        'damaged',
        'wrong_product',
        'missing_parts',
        'not_as_described',
        'performance_issue',
        'dead_on_arrival',
        'other',
      ],
      required: true,
    },
    customerComment: {
      type: String,
      default: '',
    },

    returnType: {
      type: String,
      enum: ['refund', 'replacement', 'exchange'],
      default: 'refund',
      required: true,
    },

    status: {
      type: String,
      enum: [
        'requested',
        'under_review',
        'approved',
        'rejected',
        'pickup_scheduled',
        'pickup_in_transit',
        'received',
        'inspection_pending',
        'inspection_passed',
        'inspection_failed',
        'refund_pending',
        'refund_processing',
        'refunded',
        'replacement_processing',
        'replacement_shipped',
        'replacement_delivered',
        'completed',
        'cancelled',
      ],
      default: 'requested',
      index: true,
    },

    // Reverse Logistics Details
    pickupDetails: {
      pickupAddress: {
        fullName: String,
        addressLine1: String,
        city: String,
        state: String,
        postalCode: String,
        phone: String,
      },
      returnWarehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
      },
      returnShipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
      },
      courierName: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      pickupScheduledAt: Date,
      receivedAt: Date,
      receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },

    // Inspection Breakdown
    inspectionDetails: {
      inspectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      inspectedAt: Date,
      result: {
        type: String,
        enum: ['pending', 'passed', 'failed'],
        default: 'pending',
      },
      serialMatched: { type: Boolean, default: true },
      packagingCondition: { type: String, default: 'good' },
      accessoriesComplete: { type: Boolean, default: true },
      physicalDamage: { type: Boolean, default: false },
      functionalTest: { type: String, default: 'passed' },
      inspectionNotes: { type: String, default: '' },
      failureReason: { type: String, default: '' },
    },

    // Resolution: Refund or Replacement
    resolutionDetails: {
      resolutionType: {
        type: String,
        enum: ['refund', 'replacement'],
      },
      refundId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Refund',
      },
      refundAmount: { type: Number, default: 0 },
      replacementOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellerOrder',
      },
      replacementProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      replacementSerial: { type: String, default: '' },
    },

    rejectionReason: { type: String, default: '' },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,

    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,

    completedAt: Date,
    cancelledAt: Date,

    timeline: [timelineEventSchema],
  },
  {
    timestamps: true,
  }
);

returnRequestSchema.index({ brandId: 1, createdAt: -1 });
returnRequestSchema.index({ customerId: 1, createdAt: -1 });
returnRequestSchema.index({ sellerOrderId: 1, status: 1 });

const ReturnRequest = mongoose.models.ReturnRequest || mongoose.model('ReturnRequest', returnRequestSchema);
export default ReturnRequest;
