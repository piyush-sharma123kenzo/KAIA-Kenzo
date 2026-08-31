import mongoose from 'mongoose';

const sellerLedgerSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    sellerOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      index: true,
    },
    transactionType: {
      type: String,
      enum: [
        'SALE',
        'COMMISSION',
        'COMMISSION_TAX',
        'REFUND',
        'REFUND_REVERSAL',
        'ADJUSTMENT',
        'SETTLEMENT',
        'PAYOUT',
        'CHARGEBACK',
      ],
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
      default: 'SellerOrder', // 'SellerOrder', 'ReturnRequest', 'Settlement', 'ManualAdjustment'
    },
    referenceId: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

sellerLedgerSchema.index({ brandId: 1, createdAt: -1 });
sellerLedgerSchema.index({ sellerOrderId: 1, transactionType: 1 });

const SellerLedger = mongoose.models.SellerLedger || mongoose.model('SellerLedger', sellerLedgerSchema);
export default SellerLedger;
