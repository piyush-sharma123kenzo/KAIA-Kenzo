import mongoose from 'mongoose';

const serialNumberSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    imei1: {
      type: String,
      trim: true,
      default: '',
    },
    imei2: {
      type: String,
      trim: true,
      default: '',
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
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Sold', 'Defective'],
      default: 'Available',
    },
    assignedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SerialNumber = mongoose.model('SerialNumber', serialNumberSchema);
export default SerialNumber;
