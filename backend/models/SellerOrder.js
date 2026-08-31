import mongoose from 'mongoose';

const sellerOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, default: '' },
    price: { type: Number, required: true },
    unitPrice: { type: Number },
    qty: { type: Number, required: true, min: 1 },
    quantity: { type: Number },
    gstRate: { type: Number, default: 18.0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    lineTotal: { type: Number },
    image: { type: String, default: '' },
    // Array of Serial/IMEI mapped during packing/fulfillment
    serialNumbers: [{ type: String }],
  },
  { _id: false }
);

const sellerOrderSchema = new mongoose.Schema(
  {
    // Parent Master Order Reference
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    // Readable Seller Order Identifier (e.g. SO-ASUS-2026-00101)
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Brand entity reference
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    // Brand owner user reference
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Items belonging exclusively to this seller
    items: [sellerOrderItemSchema],
    
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    gstAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAllocation: {
      type: Number,
      default: 0,
    },
    shippingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingAllocation: {
      type: Number,
      default: 0,
    },
    discountAllocation: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      default: 5.0,
    },
    commissionAmount: {
      type: Number,
      required: true,
      default: 0, // Platform fee share
    },
    commissionTaxAmount: {
      type: Number,
      default: 0,
    },
    grossAmount: {
      type: Number,
      default: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    adjustmentAmount: {
      type: Number,
      default: 0,
    },
    sellerPayableAmount: {
      type: Number,
      default: 0,
    },
    settlementStatus: {
      type: String,
      enum: ['unsettled', 'eligible', 'held', 'settled', 'refund_adjusted'],
      default: 'unsettled',
      index: true,
    },
    commissionRuleSnapshot: {
      ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommissionRule' },
      ruleName: { type: String, default: 'Default Marketplace Commission' },
      scope: { type: String, default: 'marketplace_default' },
      type: { type: String, default: 'percentage' },
      value: { type: Number, default: 5.0 },
    },
    finalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Authorized', 'Paid', 'Failed', 'Cancelled', 'Refunded'],
      default: 'Pending',
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Processing',
      index: true,
    },
    // Snapshotted customer delivery details for packing & shipping label generation
    shippingAddress: {
      name: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      phone: { type: String },
    },
    logistics: {
      provider: { type: String, default: 'KAIA Logistics Express' },
      courierName: { type: String, default: 'Blue Dart Express' },
      trackingId: { type: String, default: '' },
      labelUrl: { type: String, default: '' },
      shipmentStatus: { type: String, default: '' },
    },
    invoiceNumber: {
      type: String,
      default: '',
    },
    payoutStatus: {
      type: String,
      enum: ['Unpaid', 'Ledgered', 'Paid'],
      default: 'Unpaid',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to synchronize alias fields
sellerOrderSchema.pre('save', function (next) {
  if (this.taxAllocation === 0 && this.gstAmount > 0) {
    this.taxAllocation = this.gstAmount;
  }
  if (this.shippingAllocation === 0 && this.shippingAmount > 0) {
    this.shippingAllocation = this.shippingAmount;
  }
  this.items.forEach((it) => {
    if (!it.unitPrice) it.unitPrice = it.price;
    if (!it.quantity) it.quantity = it.qty;
    if (!it.lineTotal) it.lineTotal = it.price * it.qty;
  });
  next();
});

const SellerOrder = mongoose.model('SellerOrder', sellerOrderSchema);
export default SellerOrder;
