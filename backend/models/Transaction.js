import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    childOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    commissionAmount: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    netSellerPayout: {
      type: Number,
      required: true, // totalAmount - commissionAmount
    },
    payoutStatus: {
      type: String,
      enum: ['Pending', 'Settled', 'Refunded'],
      default: 'Pending',
    },
    settledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
