import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
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
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
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
    },
    gstRate: {
      type: Number,
      required: true,
      default: 18.0, // Standard tax rate in India for electronics
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' },
        order: { type: Number, default: 0 },
      },
    ],
    stock: {
      quantity: { type: Number, required: true, default: 0, min: 0 },
      reservedQuantity: { type: Number, required: true, default: 0, min: 0 },
      availableQuantity: { type: Number, required: true, default: 0, min: 0 }, // Handled via pre-save or controller
      reorderThreshold: { type: Number, default: 5 },
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed, // Flexible key-values (e.g. processor, ram, battery)
      default: {},
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected'],
      default: 'Pending Approval',
    },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate available stock: availableQuantity = quantity - reservedQuantity
productSchema.pre('save', function (next) {
  this.stock.availableQuantity = Math.max(0, this.stock.quantity - this.stock.reservedQuantity);
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
