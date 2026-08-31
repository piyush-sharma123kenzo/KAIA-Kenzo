import mongoose from 'mongoose';

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String, required: true },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    brandName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Readable Unique Master Order Identifier (e.g. KAIA-2026-00101)
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Complete snapshot of all products in this master order
    items: [orderItemSnapshotSchema],
    
    shippingAddress: {
      name: { type: String, required: true },
      fullName: { type: String },
      phone: { type: String, required: true },
      street: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      type: { type: String, default: 'Home' },
    },
    billingAddress: {
      name: { type: String, required: true },
      fullName: { type: String },
      phone: { type: String, required: true },
      street: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      type: { type: String, default: 'Home' },
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    couponApplied: {
      code: { type: String, default: '' },
      discountValue: { type: Number, default: 0 },
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Authorized', 'Paid', 'Failed', 'Cancelled', 'Refunded', 'PartiallyRefunded'],
      default: 'Pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'pending_payment',
        'paid',
        'processing',
        'partially_shipped',
        'shipped',
        'delivered',
        'cancelled',
        'partially_cancelled',
        'refunded',
      ],
      default: 'pending_payment',
      index: true,
    },
    paymentDetails: {
      provider: { type: String, default: 'razorpay' },
      transactionId: { type: String, default: '' },
      signature: { type: String, default: '' },
    },
    providerOrderId: {
      type: String,
      default: '',
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    // Multi-brand seller orders split from this master order
    childOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellerOrder',
      },
    ],
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual helper alias for sellerOrders
orderSchema.virtual('sellerOrders', {
  ref: 'SellerOrder',
  localField: 'childOrders',
  foreignField: '_id',
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
