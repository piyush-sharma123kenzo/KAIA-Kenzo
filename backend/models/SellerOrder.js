import mongoose from 'mongoose';

const sellerOrderSchema = new mongoose.Schema(
  {
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true },
        gstRate: { type: Number, default: 18.0 },
        serialNumbers: [{ type: String }], // Array of Serial/IMEI mapped during packing/fulfillment
      },
    ],
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
    commissionRate: {
      type: Number,
      required: true,
      default: 5.0, // Calculated during splitting based on category or override
    },
    commissionAmount: {
      type: Number,
      required: true,
      default: 0, // platform share
    },
    shippingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    fulfillmentStatus: {
      type: String,
      enum: ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Processing',
    },
    logistics: {
      provider: { type: String, default: 'MockLogistics' },
      trackingId: { type: String, default: '' },
      labelUrl: { type: String, default: '' },
      courierName: { type: String, default: '' },
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
  },
  {
    timestamps: true,
  }
);

const SellerOrder = mongoose.model('SellerOrder', sellerOrderSchema);
export default SellerOrder;
