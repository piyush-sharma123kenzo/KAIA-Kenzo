import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    logo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    businessDetails: {
      gstin: { type: String, trim: true, uppercase: true },
      pan: { type: String, trim: true, uppercase: true },
      address: { type: String, trim: true },
    },
    bankDetails: {
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true, uppercase: true },
      bankName: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
      default: 'Pending',
    },
    commissionOverride: {
      type: Number,
      default: null, // If null, uses Category-level commission
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
