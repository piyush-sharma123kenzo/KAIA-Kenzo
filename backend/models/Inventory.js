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
    quantity: {
      type: Number,
      default: 0,
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

// Pre-validate synchronization: ensure required fields are present before validation checks
inventorySchema.pre('validate', function (next) {
  if (!this.productId && this.product) this.productId = this.product;
  if (!this.product && this.productId) this.product = this.productId;
  if (!this.brandId && this.brand) this.brandId = this.brand;
  if (!this.brand && this.brandId) this.brand = this.brandId;

  if (this.totalQuantity === undefined && this.quantity !== undefined) {
    this.totalQuantity = this.quantity;
  }
  if (this.availableQuantity === undefined) {
    this.availableQuantity = this.totalQuantity || this.quantity || 0;
  }
  if (this.reservedQuantity === undefined) this.reservedQuantity = 0;
  if (this.soldQuantity === undefined) this.soldQuantity = 0;
  if (this.damagedQuantity === undefined) this.damagedQuantity = 0;
  if (this.returnedQuantity === undefined) this.returnedQuantity = 0;

  // Derive status
  if (this.availableQuantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.availableQuantity <= (this.lowStockThreshold || 5)) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }

  next();
});

// Pre-save synchronization
inventorySchema.pre('save', function (next) {
  if (!this.product && this.productId) this.product = this.productId;
  if (!this.productId && this.product) this.productId = this.product;
  if (!this.brand && this.brandId) this.brand = this.brandId;
  if (!this.brandId && this.brand) this.brandId = this.brand;

  next();
});

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
export default Inventory;
