import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    returnRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReturnRequest',
      required: true,
      index: true,
    },
    sellerOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      required: true,
      index: true,
    },
    masterOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      index: true,
    },
    providerPaymentId: {
      type: String,
      default: '',
      index: true,
    },
    providerRefundId: {
      type: String,
      default: '',
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
    status: {
      type: String,
      enum: ['pending', 'processing', 'processed', 'failed'],
      default: 'pending',
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
    idempotencyKey: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    refundedAt: Date,
  },
  {
    timestamps: true,
  }
);

const Refund = mongoose.models.Refund || mongoose.model('Refund', refundSchema);
export default Refund;
