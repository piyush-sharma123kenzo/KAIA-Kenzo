import mongoose from 'mongoose';

const warrantySchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    imei1: {
      type: String,
      default: '',
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      required: true,
      index: true,
    },
    masterOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      index: true,
    },
    warrantyMonths: {
      type: Number,
      default: 12,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    terms: {
      type: String,
      default: 'Standard Manufacturer Limited Hardware Warranty. Covers hardware defects during normal use.',
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Claimed', 'Void'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Warranty = mongoose.models.Warranty || mongoose.model('Warranty', warrantySchema);
export default Warranty;
