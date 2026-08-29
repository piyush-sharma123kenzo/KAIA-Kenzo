import mongoose from 'mongoose';

const warrantySchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Claimed'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

const Warranty = mongoose.model('Warranty', warrantySchema);
export default Warranty;
