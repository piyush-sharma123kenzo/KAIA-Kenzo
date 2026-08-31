import mongoose from 'mongoose';

const VALID_SERIAL_STATUSES = [
  'available',
  'reserved',
  'assigned',
  'packed',
  'shipped',
  'sold',
  'returned',
  'replaced',
  'damaged',
  // Backward compatibility cases
  'Available',
  'Reserved',
  'Sold',
  'Defective',
  'Returned',
  'Replaced',
];

const serialNumberSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    imei1: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    imei2: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
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
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      index: true,
    },
    status: {
      type: String,
      enum: VALID_SERIAL_STATUSES,
      default: 'available',
      index: true,
    },
    sellerOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      default: null,
      index: true,
    },
    assignedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerOrder',
      default: null,
    },
    masterOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: {
      type: Date,
    },
    packedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    packedAt: {
      type: Date,
    },
    soldAt: {
      type: Date,
    },
    returnedAt: {
      type: Date,
    },
    warrantyStart: {
      type: Date,
    },
    warrantyEnd: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
serialNumberSchema.index({ productId: 1, status: 1 });
serialNumberSchema.index({ brandId: 1, status: 1 });
serialNumberSchema.index({ warehouseId: 1, status: 1 });

// Pre-save synchronization
serialNumberSchema.pre('save', function (next) {
  if (!this.product && this.productId) this.product = this.productId;
  if (!this.productId && this.product) this.productId = this.product;
  if (!this.brand && this.brandId) this.brand = this.brandId;
  if (!this.brandId && this.brand) this.brandId = this.brand;
  if (!this.assignedOrderId && this.sellerOrderId) this.assignedOrderId = this.sellerOrderId;
  if (!this.sellerOrderId && this.assignedOrderId) this.sellerOrderId = this.assignedOrderId;
  if (!this.orderId && this.masterOrderId) this.orderId = this.masterOrderId;
  if (!this.masterOrderId && this.orderId) this.masterOrderId = this.orderId;

  // Normalize status casing to lowercase
  if (this.status) {
    this.status = this.status.toLowerCase();
  }

  next();
});

const SerialNumber = mongoose.models.SerialNumber || mongoose.model('SerialNumber', serialNumberSchema);
export default SerialNumber;
