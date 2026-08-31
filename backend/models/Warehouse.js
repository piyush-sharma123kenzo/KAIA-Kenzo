import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    contactName: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine2: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique warehouse codes per brand
warehouseSchema.index({ brandId: 1, code: 1 }, { unique: true });

const Warehouse = mongoose.models.Warehouse || mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
