import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    billingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
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
    couponApplied: {
      code: { type: String, default: '' },
      discountValue: { type: Number, default: 0 },
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    paymentDetails: {
      provider: { type: String, default: 'MockGateway' },
      transactionId: { type: String, default: '' },
      signature: { type: String, default: '' },
    },
    childOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellerOrder',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
