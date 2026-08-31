import mongoose from 'mongoose';

const VALID_TRANSACTION_TYPES = [
  'stock_in',
  'stock_out',
  'reserve',
  'release',
  'sale',
  'return',
  'damage',
  'adjustment',
  'transfer_in',
  'transfer_out',
];

const inventoryTransactionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: VALID_TRANSACTION_TYPES,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    referenceType: {
      type: String,
      default: 'ManualAdjustment',
      enum: ['SellerOrder', 'Order', 'StockTransfer', 'ManualAdjustment', 'StockIn', 'InitialStock', 'Return', 'ReturnRequest', 'Damage'],
    },
    referenceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

inventoryTransactionSchema.index({ productId: 1, warehouseId: 1, createdAt: -1 });
inventoryTransactionSchema.index({ brandId: 1, createdAt: -1 });

const InventoryTransaction = mongoose.models.InventoryTransaction || mongoose.model('InventoryTransaction', inventoryTransactionSchema);
export default InventoryTransaction;
