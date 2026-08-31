import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    // Backward compatibility aliases
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      index: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total quantity cannot be negative'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Available quantity cannot be negative'],
    },
    reservedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
    soldQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Sold quantity cannot be negative'],
    },
    damagedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Damaged quantity cannot be negative'],
    },
    returnedQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Returned quantity cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
      index: true,
    },
    warehouse: {
      name: { type: String, default: 'Primary Warehouse' },
      location: { type: String, default: 'India Central Depot' },
      bin: { type: String, default: 'A1-01' },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
inventorySchema.index({ productId: 1, warehouseId: 1 });
inventorySchema.index({ brandId: 1, warehouseId: 1 });

// Pre-save synchronization: ensure fields & status are consistent
inventorySchema.pre('save', function (next) {
  if (!this.product && this.productId) this.product = this.productId;
  if (!this.productId && this.product) this.productId = this.product;
  if (!this.brand && this.brandId) this.brand = this.brandId;
  if (!this.brandId && this.brand) this.brandId = this.brand;

  // Backward compatibility calculation
  if (this.isModified('quantity') && !this.isModified('totalQuantity') && this.quantity !== undefined) {
    this.totalQuantity = this.quantity;
  }

  // Derive status
  if (this.availableQuantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.availableQuantity <= this.lowStockThreshold) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }

  next();
});

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
export default Inventory;
