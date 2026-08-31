import mongoose from 'mongoose';

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
      default: false,
      index: true,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'published', 'archived'],
      default: 'Approved',
      index: true,
    },
    ratings: {
      average: { type: Number, default: 4.5, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for compatibility
productSchema.virtual('price').get(function () {
  return this.sellingPrice;
});
productSchema.virtual('compareAtPrice').get(function () {
  return this.mrp;
});
productSchema.virtual('discount').get(function () {
  if (this.mrp && this.sellingPrice && this.mrp > this.sellingPrice) {
    return Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
  }
  return 0;
});

// Pre-save hook to calculate available stock: availableQuantity = quantity - reservedQuantity
productSchema.pre('save', function (next) {
  if (this.stock) {
    this.stock.availableQuantity = Math.max(0, (this.stock.quantity || 0) - (this.stock.reservedQuantity || 0));
  }
  this.reviewCount = this.ratings?.count || this.reviewCount || 0;
  next();
});

// Compound search index for fast text matching
productSchema.index({ name: 'text', modelNumber: 'text', SKU: 'text', description: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
