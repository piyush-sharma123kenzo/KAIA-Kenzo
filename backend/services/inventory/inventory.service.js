import mongoose from 'mongoose';
import Inventory from '../../models/Inventory.js';
import InventoryTransaction from '../../models/InventoryTransaction.js';
import Warehouse from '../../models/Warehouse.js';
import Product from '../../models/Product.js';
import AuditLog from '../../models/AuditLog.js';
import StockTransfer from '../../models/StockTransfer.js';

export class InventoryService {
  /**
   * 1. Add Stock (Stock-In) to Warehouse
   */
  async addStock({ productId, warehouseId, brandId, quantity, reason = 'Stock In', referenceType = 'StockIn', referenceId = null, user }) {
    if (!productId || !brandId || !quantity || quantity <= 0) {
      throw new Error('Valid Product ID, Brand ID, and positive quantity are required.');
    }

    // Verify product belongs to brand
    const product = await Product.findOne({ _id: productId, brand: brandId });
    if (!product) {
      throw new Error('Product not found or does not belong to your brand.');
    }

    // Find or assign warehouse
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      let primaryWh = await Warehouse.findOne({ brandId, isPrimary: true });
      if (!primaryWh) {
        primaryWh = await Warehouse.findOne({ brandId });
      }
      if (!primaryWh) {
        // Auto-create default primary warehouse for brand if none exists
        primaryWh = await Warehouse.create({
          name: `${product.brandName || 'Brand'} Central Depot`,
          brandId,
          code: `WH-${brandId.toString().slice(-4).toUpperCase()}-01`,
          addressLine1: 'Main Industrial Warehouse Estate',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          isPrimary: true,
        });
      }
      targetWarehouseId = primaryWh._id;
    }

    // Find or create inventory document
    let inventory = await Inventory.findOne({ productId, warehouseId: targetWarehouseId });
    const prevQty = inventory ? inventory.availableQuantity : 0;

    if (!inventory) {
      inventory = new Inventory({
        productId,
        product: productId,
        brandId,
        brand: brandId,
        warehouseId: targetWarehouseId,
        sku: product.SKU || `SKU-${product._id.toString().slice(-6).toUpperCase()}`,
        totalQuantity: quantity,
        availableQuantity: quantity,
        reservedQuantity: 0,
        soldQuantity: 0,
      });
    } else {
      inventory.totalQuantity += quantity;
      inventory.availableQuantity += quantity;
    }

    await inventory.save();

    // Create Audit Transaction
    await InventoryTransaction.create({
      productId,
      inventoryId: inventory._id,
      warehouseId: targetWarehouseId,
      brandId,
      type: 'stock_in',
      quantity,
      referenceType,
      referenceId,
      previousQuantity: prevQty,
      newQuantity: inventory.availableQuantity,
      reason,
      createdBy: user?._id || brandId,
    });

    // Synchronize Product level aggregate stock
    await this.syncProductAggregateStock(productId);

    return {
      success: true,
      inventory,
      message: `Successfully stocked in ${quantity} units.`,
    };
  }

  /**
   * 2. Adjust Inventory (Manual Count Correction / Damage / Loss)
   */
  async adjustStock({ productId, warehouseId, brandId, newQuantity, reason = 'Count Correction', user }) {
    if (newQuantity < 0) {
      throw new Error('Total quantity cannot be negative.');
    }

    const inventory = await Inventory.findOne({ productId, warehouseId, brandId });
    if (!inventory) {
      throw new Error('Inventory record not found for this product and warehouse.');
    }

    const prevAvailable = inventory.availableQuantity;
    const diff = newQuantity - inventory.totalQuantity;

    inventory.totalQuantity = newQuantity;
    inventory.availableQuantity = Math.max(0, newQuantity - inventory.reservedQuantity - inventory.soldQuantity - inventory.damagedQuantity);
    await inventory.save();

    await InventoryTransaction.create({
      productId,
      inventoryId: inventory._id,
      warehouseId,
      brandId,
      type: 'adjustment',
      quantity: diff,
      referenceType: 'ManualAdjustment',
      previousQuantity: prevAvailable,
      newQuantity: inventory.availableQuantity,
      reason,
      createdBy: user?._id || brandId,
    });

    await AuditLog.create({
      user: user?._id || brandId,
      brand: brandId,
      action: 'STOCK_ADJUSTED',
      entity: 'Inventory',
      entityId: inventory._id,
      changes: { previous: prevAvailable, new: inventory.availableQuantity, reason },
    });

    await this.syncProductAggregateStock(productId);

    return {
      success: true,
      inventory,
      message: `Inventory adjusted to ${inventory.availableQuantity} available units.`,
    };
  }

  /**
   * 3. Reserve Stock Atomically (Prevents Race Conditions & Overselling)
   */
  async reserveStock({ productId, warehouseId, brandId, quantity, referenceType = 'SellerOrder', referenceId = null, user = null }) {
    if (quantity <= 0) throw new Error('Quantity to reserve must be greater than zero.');

    const query = {
      productId,
      availableQuantity: { $gte: quantity },
    };
    if (warehouseId) query.warehouseId = warehouseId;
    if (brandId) query.brandId = brandId;

    // Atomic findAndModify to guarantee concurrency protection
    const inventory = await Inventory.findOneAndUpdate(
      query,
      {
        $inc: {
          availableQuantity: -quantity,
          reservedQuantity: quantity,
        },
      },
      { new: true }
    );

    if (!inventory) {
      throw new Error('Insufficient available stock to fulfill this order item.');
    }

    await InventoryTransaction.create({
      productId,
      inventoryId: inventory._id,
      warehouseId: inventory.warehouseId,
      brandId: inventory.brandId,
      type: 'reserve',
      quantity,
      referenceType,
      referenceId,
      previousQuantity: inventory.availableQuantity + quantity,
      newQuantity: inventory.availableQuantity,
      reason: `Stock reserved for ${referenceType} ${referenceId || ''}`,
      createdBy: user?._id || inventory.brandId,
    });

    await this.syncProductAggregateStock(productId);

    return {
      success: true,
      inventory,
    };
  }

  /**
   * 4. Release Reserved Stock (Order Cancellation / Expiry)
   */
  async releaseStock({ productId, warehouseId, brandId, quantity, referenceType = 'SellerOrder', referenceId = null, user = null }) {
    if (quantity <= 0) return { success: true };

    const query = {
      productId,
      reservedQuantity: { $gte: quantity },
    };
    if (warehouseId) query.warehouseId = warehouseId;
    if (brandId) query.brandId = brandId;

    const inventory = await Inventory.findOneAndUpdate(
      query,
      {
        $inc: {
          availableQuantity: quantity,
          reservedQuantity: -quantity,
        },
      },
      { new: true }
    );

    if (!inventory) {
      // Idempotent: fallback if already released
      return { success: true, message: 'Stock already released or not reserved.' };
    }

    await InventoryTransaction.create({
      productId,
      inventoryId: inventory._id,
      warehouseId: inventory.warehouseId,
      brandId: inventory.brandId,
      type: 'release',
      quantity,
      referenceType,
      referenceId,
      previousQuantity: inventory.availableQuantity - quantity,
      newQuantity: inventory.availableQuantity,
      reason: `Reserved stock released for ${referenceType} ${referenceId || ''}`,
      createdBy: user?._id || inventory.brandId,
    });

    await this.syncProductAggregateStock(productId);

    return { success: true, inventory };
  }

  /**
   * 5. Commit Sale (Convert Reserved to Sold upon Finalization)
   */
  async commitSale({ productId, warehouseId, brandId, quantity, referenceType = 'SellerOrder', referenceId = null, user = null }) {
    if (quantity <= 0) return { success: true };

    const query = {
      productId,
      reservedQuantity: { $gte: quantity },
    };
    if (warehouseId) query.warehouseId = warehouseId;
    if (brandId) query.brandId = brandId;

    const inventory = await Inventory.findOneAndUpdate(
      query,
      {
        $inc: {
          reservedQuantity: -quantity,
          soldQuantity: quantity,
        },
      },
      { new: true }
    );

    if (!inventory) {
      // Direct commit if reserve was skipped
      await Inventory.findOneAndUpdate(
        { productId, availableQuantity: { $gte: quantity } },
        { $inc: { availableQuantity: -quantity, soldQuantity: quantity } }
      );
    }

    await this.syncProductAggregateStock(productId);
    return { success: true };
  }

  /**
   * 6. Warehouse-to-Warehouse Stock Transfer
   */
  async transferStock({ fromWarehouseId, toWarehouseId, productId, brandId, quantity, serials = [], user }) {
    if (fromWarehouseId.toString() === toWarehouseId.toString()) {
      throw new Error('Source and destination warehouse cannot be the same.');
    }

    const sourceInv = await Inventory.findOne({ productId, warehouseId: fromWarehouseId, brandId });
    if (!sourceInv || sourceInv.availableQuantity < quantity) {
      throw new Error('Insufficient available stock at source warehouse for transfer.');
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const transferId = `TRF-${dateStr}-${rand}`;

    // Deduct source warehouse stock
    sourceInv.totalQuantity -= quantity;
    sourceInv.availableQuantity -= quantity;
    await sourceInv.save();

    // Add destination warehouse stock
    let destInv = await Inventory.findOne({ productId, warehouseId: toWarehouseId, brandId });
    if (!destInv) {
      destInv = new Inventory({
        productId,
        product: productId,
        brandId,
        brand: brandId,
        warehouseId: toWarehouseId,
        sku: sourceInv.sku,
        totalQuantity: quantity,
        availableQuantity: quantity,
      });
    } else {
      destInv.totalQuantity += quantity;
      destInv.availableQuantity += quantity;
    }
    await destInv.save();

    const transfer = await StockTransfer.create({
      transferId,
      brandId,
      productId,
      fromWarehouse: fromWarehouseId,
      toWarehouse: toWarehouseId,
      quantity,
      serialNumbers: serials,
      status: 'received',
      requestedBy: user._id,
      approvedBy: user._id,
      receivedBy: user._id,
      notes: `Transferred ${quantity} units from ${fromWarehouseId} to ${toWarehouseId}`,
    });

    return { success: true, transfer };
  }

  /**
   * 7. Real-Time Cart & Checkout Availability Check
   */
  async checkAvailability({ items = [] }) {
    const results = [];
    let allAvailable = true;

    for (let item of items) {
      const prodId = item.product?._id || item.product || item.productId;
      const requestedQty = Number(item.quantity || item.qty || 1);

      const product = await Product.findById(prodId);
      if (!product || !product.isActive) {
        results.push({
          productId: prodId,
          available: false,
          reason: 'Product no longer available in store catalog.',
        });
        allAvailable = false;
        continue;
      }

      // Check sum of available stock across all warehouses
      const aggregate = await Inventory.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(prodId) } },
        { $group: { _id: '$productId', totalAvailable: { $sum: '$availableQuantity' } } },
      ]);

      const totalAvailable = aggregate[0]?.totalAvailable ?? product.stock?.quantity ?? 0;

      if (totalAvailable < requestedQty) {
        results.push({
          productId: prodId,
          name: product.name,
          available: false,
          availableQuantity: totalAvailable,
          requestedQuantity: requestedQty,
          reason: totalAvailable === 0 ? 'Out of Stock' : `Only ${totalAvailable} units left in stock.`,
        });
        allAvailable = false;
      } else {
        results.push({
          productId: prodId,
          name: product.name,
          available: true,
          availableQuantity: totalAvailable,
        });
      }
    }

    return { allAvailable, results };
  }

  /**
   * 8. Synchronize Product Aggregation Stock Cache
   */
  async syncProductAggregateStock(productId) {
    try {
      const pId = new mongoose.Types.ObjectId(productId);
      const agg = await Inventory.aggregate([
        { $match: { productId: pId } },
        {
          $group: {
            _id: '$productId',
            totalAvailable: { $sum: '$availableQuantity' },
            totalReserved: { $sum: '$reservedQuantity' },
            totalSold: { $sum: '$soldQuantity' },
          },
        },
      ]);

      const totalAvailable = agg[0]?.totalAvailable || 0;
      const status = totalAvailable > 0 ? (totalAvailable <= 5 ? 'Low Stock' : 'In Stock') : 'Out of Stock';

      await Product.findByIdAndUpdate(productId, {
        'stock.quantity': totalAvailable,
        'stock.status': status,
      });
    } catch (err) {
      console.error('Error syncing product aggregate stock:', err);
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
