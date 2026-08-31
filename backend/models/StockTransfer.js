import mongoose from 'mongoose';

const stockTransferSchema = new mongoose.Schema(
  {
    transferId: {
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
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    serialNumbers: [{ type: String, uppercase: true, trim: true }],
    status: {
      type: String,
      enum: ['requested', 'approved', 'in_transit', 'received', 'cancelled'],
      default: 'requested',
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const StockTransfer = mongoose.models.StockTransfer || mongoose.model('StockTransfer', stockTransferSchema);
export default StockTransfer;
