import mongoose from 'mongoose';
import { formatIST } from '../utils/dateFormat.js';

const brandSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
      trim: true,
      index: true,
    },
    logo: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      default: '',
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
    warehouseAddress: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    bankDetails: {
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true, uppercase: true },
      bankName: { type: String, trim: true },
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
      default: 'Approved',
      index: true,
    },
    commissionOverride: {
      type: Number,
      default: null, // If null, uses Category-level commission
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    createdAtIST: {
      type: String,
      default: () => formatIST(new Date()),
    },
    updatedAtIST: {
      type: String,
      default: () => formatIST(new Date()),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

brandSchema.pre('save', function (next) {
  const now = new Date();
  this.updatedAtIST = formatIST(now);
  if (!this.createdAtIST) {
    this.createdAtIST = formatIST(this.createdAt || now);
  }
  next();
});

const Brand = mongoose.models.Brand || mongoose.model('Brand', brandSchema);
export default Brand;
