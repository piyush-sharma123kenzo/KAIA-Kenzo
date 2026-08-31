import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema(
  {
    settlementNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    grossSales: {
      type: Number,
      required: true,
      default: 0,
    },
    commission: {
      type: Number,
      required: true,
      default: 0,
    },
    commissionTax: {
      type: Number,
      default: 0,
    },
    refunds: {
      type: Number,
      default: 0,
    },
    adjustments: {
      type: Number,
      default: 0,
    },
    netPayable: {
      type: Number,
      required: true,
      default: 0,
    },
    sellerOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellerOrder',
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'processing', 'paid', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentProvider: {
      type: String,
      enum: ['razorpay_route', 'bank_transfer', 'mock'],
      default: 'mock',
    },
    providerSettlementId: {
      type: String,
      default: '',
    },
    providerPayoutId: {
      type: String,
      default: '',
    },
    payoutDetails: {
      accountHolderName: String,
      bankAccountLast4: String,
      ifsc: String,
      bankName: String,
      upiId: String,
    },
    failureReason: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    processedAt: Date,
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

settlementSchema.index({ brandId: 1, createdAt: -1 });
settlementSchema.index({ status: 1, createdAt: -1 });

const Settlement = mongoose.models.Settlement || mongoose.model('Settlement', settlementSchema);
export default Settlement;
