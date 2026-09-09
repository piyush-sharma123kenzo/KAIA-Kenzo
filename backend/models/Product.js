import mongoose from 'mongoose';
import { formatIST } from '../utils/dateFormat.js';

const productSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
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
    modelNumber: {
      type: String,
      required: true,
      trim: true,
    },
    SKU: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      default: '',
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    gstRate: {
      type: Number,
      required: true,
      default: 18.0, // Standard GST rate in India for electronics
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    stock: {
      quantity: { type: Number, required: true, default: 0, min: 0 },
      reservedQuantity: { type: Number, required: true, default: 0, min: 0 },
      availableQuantity: { type: Number, required: true, default: 0, min: 0 },
      reorderThreshold: { type: Number, default: 5 },
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed, // Flexible dynamic category specifications
      default: {},
    },
    highlights: {
      type: [String],
      default: [],
    },
    warranty: {
      type: String,
      default: '1 Year Manufacturer Limited Warranty',
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewArrival: {
      type: Boolean,
      default: true,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestDeal: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    weight: {
      type: Number,
      default: 0,
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      unit: { type: String, default: 'cm' },
    },
    salesCount: {
      type: Number,
      default: 0,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'published', 'archived', 'Inactive'],
      default: 'Approved',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    approvedAt: {
      type: Date,
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    reviewCount: {
      type: Number,
      default: 0,
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

// Virtual aliases for compatibility across all customer and admin components
productSchema.virtual('price').get(function () {
  return this.sellingPrice;
});
productSchema.virtual('originalPrice').get(function () {
  return this.mrp;
});
productSchema.virtual('compareAtPrice').get(function () {
  return this.mrp;
});
productSchema.virtual('featured').get(function () {
  return this.isFeatured;
});
productSchema.virtual('ratingAverage').get(function () {
  return this.ratings?.average || 4.5;
});
productSchema.virtual('thumbnail').get(function () {
  if (Array.isArray(this.images) && this.images.length > 0) {
    const primary = this.images.find((img) => img.isPrimary);
    if (primary) return primary.url || (typeof primary === 'string' ? primary : '');
    const first = this.images[0];
    return first.url || (typeof first === 'string' ? first : '');
  }
  return '';
});
productSchema.virtual('discount').get(function () {
  if (this.mrp && this.sellingPrice && this.mrp > this.sellingPrice) {
    return Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
  }
  return 0;
});

// Pre-save hook to calculate available stock and IST timestamps
productSchema.pre('save', function (next) {
  const now = new Date();
  this.updatedAtIST = formatIST(now);
  if (!this.createdAtIST) {
    this.createdAtIST = formatIST(this.createdAt || now);
  }
  if (this.stock) {
    const qty = Number(this.stock.quantity ?? 0);
    const reserved = Number(this.stock.reservedQuantity ?? 0);
    this.stock.availableQuantity = Math.max(0, qty - reserved);
  }
  this.reviewCount = this.ratings?.count || this.reviewCount || 0;
  next();
});

// Compound search index for fast text matching
productSchema.index({ name: 'text', modelNumber: 'text', SKU: 'text', description: 'text', tags: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
