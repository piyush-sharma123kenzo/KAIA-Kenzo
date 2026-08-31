import mongoose from 'mongoose';
import SerialNumber from '../../models/SerialNumber.js';
import Product from '../../models/Product.js';
import Warehouse from '../../models/Warehouse.js';
import SellerOrder from '../../models/SellerOrder.js';
import Order from '../../models/Order.js';
import AuditLog from '../../models/AuditLog.js';
import inventoryService from './inventory.service.js';

export class SerialService {
  /**
   * 1. Register Single Serial Number & IMEI
   */
  async registerSingleSerial({ serialNumber, imei1 = '', imei2 = '', productId, warehouseId, brandId, user }) {
    const sNorm = (serialNumber || '').trim().toUpperCase();
    if (!sNorm) throw new Error('Serial number is required.');

    // Check duplicate serial
    const existing = await SerialNumber.findOne({ serialNumber: sNorm });
    if (existing) {
      throw new Error(`Serial number "${sNorm}" already exists in the system.`);
    }

    // Check duplicate IMEI 1 / 2
    if (imei1 && imei1.trim()) {
      const imei1Norm = imei1.trim().toUpperCase();
      const existingImei = await SerialNumber.findOne({ $or: [{ imei1: imei1Norm }, { imei2: imei1Norm }] });
      if (existingImei) throw new Error(`IMEI 1 "${imei1Norm}" already exists in the system.`);
    }

    if (imei2 && imei2.trim()) {
      const imei2Norm = imei2.trim().toUpperCase();
      const existingImei = await SerialNumber.findOne({ $or: [{ imei1: imei2Norm }, { imei2: imei2Norm }] });
      if (existingImei) throw new Error(`IMEI 2 "${imei2Norm}" already exists in the system.`);
    }

    // Verify Product & Brand
    const product = await Product.findOne({ _id: productId, brand: brandId });
    if (!product) throw new Error('Product not found or unauthorized for this brand.');

    // Ensure warehouse
    let targetWhId = warehouseId;
    if (!targetWhId) {
      const defaultWh = await Warehouse.findOne({ brandId });
      targetWhId = defaultWh?._id;
    }

    const serialDoc = await SerialNumber.create({
      serialNumber: sNorm,
      imei1: (imei1 || '').trim().toUpperCase(),
      imei2: (imei2 || '').trim().toUpperCase(),
      productId: product._id,
      product: product._id,
      brandId,
      brand: brandId,
      warehouseId: targetWhId,
      status: 'available',
    });

    // Increment physical warehouse stock
    await inventoryService.addStock({
      productId: product._id,
      warehouseId: targetWhId,
      brandId,
      quantity: 1,
      reason: `Serial Ingestion: ${sNorm}`,
      user,
    });

    return { success: true, serial: serialDoc };
  }

  /**
   * 2. Bulk Import Serials from CSV / JSON
   * Rows format: [{ sku, serialNumber, imei1, imei2, warehouseCode }]
   */
  async bulkImportSerials({ rows = [], brandId, user }) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('No valid serial rows provided for bulk ingestion.');
    }

    let successful = 0;
    let failed = 0;
    const errors = [];
    const createdSerials = [];

    // Pre-fetch all brand products by SKU
    const brandProducts = await Product.find({ brand: brandId });
    const productBySku = {};
    brandProducts.forEach((p) => {
      if (p.SKU) productBySku[p.SKU.toUpperCase()] = p;
    });

    // Pre-fetch all brand warehouses
    const brandWarehouses = await Warehouse.find({ brandId });
    const warehouseByCode = {};
    brandWarehouses.forEach((w) => {
      if (w.code) warehouseByCode[w.code.toUpperCase()] = w;
    });
    const defaultWh = brandWarehouses[0];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIdx = i + 1;
      const sku = (row.sku || row.SKU || '').trim().toUpperCase();
      const serial = (row.serialNumber || row.serial || row.SerialNumber || '').trim().toUpperCase();
      const imei1 = (row.imei1 || row.IMEI1 || '').trim().toUpperCase();
      const imei2 = (row.imei2 || row.IMEI2 || '').trim().toUpperCase();
      const whCode = (row.warehouseCode || row.warehouse || '').trim().toUpperCase();

      if (!serial) {
        errors.push({ row: rowIdx, error: 'Serial number is missing' });
        failed++;
        continue;
      }

      if (!sku || !productBySku[sku]) {
        errors.push({ row: rowIdx, serial, error: `Invalid SKU "${sku}" or not owned by brand` });
        failed++;
        continue;
      }

      const product = productBySku[sku];
      const targetWh = warehouseByCode[whCode] || defaultWh;
      if (!targetWh) {
        errors.push({ row: rowIdx, serial, error: 'No valid warehouse found for brand' });
        failed++;
        continue;
      }

      // Check unique serial
      const exists = await SerialNumber.findOne({ serialNumber: serial });
      if (exists) {
        errors.push({ row: rowIdx, serial, error: `Duplicate serial "${serial}" already in database` });
        failed++;
        continue;
      }

      // Check unique IMEIs
      if (imei1) {
        const imeiExists = await SerialNumber.findOne({ $or: [{ imei1 }, { imei2: imei1 }] });
        if (imeiExists) {
          errors.push({ row: rowIdx, serial, error: `Duplicate IMEI 1 "${imei1}" already in database` });
          failed++;
          continue;
        }
      }

      try {
        const sDoc = await SerialNumber.create({
          serialNumber: serial,
          imei1,
          imei2,
          productId: product._id,
          product: product._id,
          brandId,
          brand: brandId,
          warehouseId: targetWh._id,
          status: 'available',
        });

        await inventoryService.addStock({
          productId: product._id,
          warehouseId: targetWh._id,
          brandId,
          quantity: 1,
          reason: `Bulk Import: ${serial}`,
          user,
        });

        createdSerials.push(sDoc);
        successful++;
      } catch (err) {
        errors.push({ row: rowIdx, serial, error: err.message });
        failed++;
      }
    }

    return {
      success: successful > 0,
      total: rows.length,
      successful,
      failed,
      errors,
      createdSerials,
    };
  }

  /**
   * 3. Assign Serial to a Seller Order
   */
  async assignSerialToOrder({ serialNumber, sellerOrderId, productId, brandId, user }) {
    const sNorm = (serialNumber || '').trim().toUpperCase();
    if (!sNorm) throw new Error('Serial number is required.');

    const serial = await SerialNumber.findOne({ serialNumber: sNorm });
    if (!serial) {
      throw new Error(`Serial barcode "${sNorm}" was not found in registered inventory.`);
    }

    if (serial.brandId.toString() !== brandId.toString() && serial.brand?.toString() !== brandId.toString()) {
      throw new Error(`Serial "${sNorm}" does not belong to your brand.`);
    }

    if (productId && serial.productId.toString() !== productId.toString()) {
      throw new Error(`Serial "${sNorm}" does not belong to this product.`);
    }

    if (serial.status === 'sold') {
      throw new Error(`Serial "${sNorm}" is already sold.`);
    }

    if (serial.status !== 'available') {
      if (serial.sellerOrderId && serial.sellerOrderId.toString() !== sellerOrderId.toString()) {
        throw new Error(`Serial "${sNorm}" is already assigned to another order.`);
      }
    }

    // Atomic assignment
    serial.status = 'assigned';
    serial.sellerOrderId = sellerOrderId;
    serial.assignedOrderId = sellerOrderId;
    serial.assignedBy = user?._id || brandId;
    serial.assignedAt = new Date();
    await serial.save();

    // Update Seller Order item serial numbers array
    const sellerOrder = await SellerOrder.findById(sellerOrderId);
    if (sellerOrder) {
      let item = sellerOrder.items.find(
        (it) => it.product.toString() === serial.productId.toString() || it.productId?.toString() === serial.productId.toString()
      );
      if (item) {
        item.serialNumbers = item.serialNumbers || [];
        if (!item.serialNumbers.includes(sNorm)) {
          item.serialNumbers.push(sNorm);
          await sellerOrder.save();
        }
      }
    }

    return { success: true, serial };
  }

  /**
   * 4. Complete Packing Checklist & Mark Serials Packed
   */
  async markSerialsPacked({ sellerOrderId, brandId, checklist = {}, user }) {
    const sellerOrder = await SellerOrder.findOne({ _id: sellerOrderId, seller: brandId }).populate('parentOrder');
    if (!sellerOrder) throw new Error('Seller Order not found or unauthorized.');

    // Validate Checklist
    const requiredChecks = ['productVerified', 'serialVerified', 'packagingSealed'];
    const missingChecks = requiredChecks.filter((k) => !checklist[k]);
    if (missingChecks.length > 0) {
      throw new Error(`Packing checklist incomplete. Missing: ${missingChecks.join(', ')}.`);
    }

    // Verify all serial-tracked items have their serial numbers assigned
    for (let it of sellerOrder.items) {
      const prod = await Product.findById(it.product);
      if (prod && prod.isSerialTracked) {
        if (!it.serialNumbers || it.serialNumbers.length < it.qty) {
          throw new Error(
            `Serial assignment incomplete for "${it.name}". Expected ${it.qty}, assigned ${it.serialNumbers?.length || 0}.`
          );
        }
      }
    }

    // Mark all assigned serials as packed
    const serialsList = [];
    sellerOrder.items.forEach((it) => {
      if (it.serialNumbers) serialsList.push(...it.serialNumbers);
    });

    if (serialsList.length > 0) {
      await SerialNumber.updateMany(
        { serialNumber: { $in: serialsList } },
        {
          $set: {
            status: 'packed',
            packedBy: user?._id || brandId,
            packedAt: new Date(),
          },
        }
      );
    }

    sellerOrder.fulfillmentStatus = 'Packed';
    await sellerOrder.save();

    await AuditLog.create({
      user: user?._id || brandId,
      brand: brandId,
      action: 'ORDER_PACKED',
      entity: 'SellerOrder',
      entityId: sellerOrder._id,
      changes: {
        orderId: sellerOrder.orderId,
        fulfillmentStatus: 'Packed',
        serialsCount: serialsList.length,
        checklist,
      },
    });

    return {
      success: true,
      message: `Order #${sellerOrder.orderId} successfully packed and verified. Ready for courier pickup!`,
      sellerOrder,
    };
  }

  /**
   * 5. Transition Serials to Shipped
   */
  async markSerialsShipped({ sellerOrderId }) {
    await SerialNumber.updateMany(
      { sellerOrderId },
      { $set: { status: 'shipped' } }
    );
  }

  /**
   * 6. Transition Serials to Sold upon Delivery
   */
  async markSerialsSold({ sellerOrderId }) {
    await SerialNumber.updateMany(
      { sellerOrderId },
      { $set: { status: 'sold', soldAt: new Date() } }
    );
  }
}

export const serialService = new SerialService();
export default serialService;
