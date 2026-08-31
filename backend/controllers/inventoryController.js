import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import SerialNumber from '../models/SerialNumber.js';
import Warehouse from '../models/Warehouse.js';
import Product from '../models/Product.js';
import SellerOrder from '../models/SellerOrder.js';
import Order from '../models/Order.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import inventoryService from '../services/inventory/inventory.service.js';
import serialService from '../services/inventory/serial.service.js';

// ==========================================
// 1. BRAND SELLER INVENTORY CONTROLLERS
// ==========================================

// @desc    Get Brand Warehouse Inventory listings with stats
// @route   GET /api/brand/inventory
// @access  Private (Role: BRAND)
export const getBrandInventory = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { search, warehouseId, lowStockOnly, status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { brandId };
    if (warehouseId && warehouseId !== 'all') query.warehouseId = warehouseId;
    if (status && status !== 'all') query.status = status;
    if (lowStockOnly === 'true') {
      query.$expr = { $lte: ['$availableQuantity', '$lowStockThreshold'] };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchedProds = await Product.find({
        brand: brandId,
        $or: [{ name: searchRegex }, { SKU: searchRegex }, { modelNumber: searchRegex }],
      }).select('_id');

      query.$or = [
        { sku: searchRegex },
        { productId: { $in: matchedProds.map((p) => p._id) } },
      ];
    }

    const total = await Inventory.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const inventory = await Inventory.find(query)
      .populate('productId', 'name SKU modelNumber images isSerialTracked sellingPrice category')
      .populate('warehouseId', 'name code city state')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // KPI Summary
    const [totalUnitsAgg, lowStockCount, outOfStockCount] = await Promise.all([
      Inventory.aggregate([
        { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalQuantity' },
            available: { $sum: '$availableQuantity' },
            reserved: { $sum: '$reservedQuantity' },
            sold: { $sum: '$soldQuantity' },
          },
        },
      ]),
      Inventory.countDocuments({ brandId, status: 'low_stock' }),
      Inventory.countDocuments({ brandId, availableQuantity: 0 }),
    ]);

    const stats = totalUnitsAgg[0] || { total: 0, available: 0, reserved: 0, sold: 0 };
    stats.lowStock = lowStockCount;
    stats.outOfStock = outOfStockCount;

    res.status(200).json({
      success: true,
      inventory,
      total,
      page: pageNum,
      totalPages,
      stats,
    });
  } catch (error) {
    console.error('Error fetching brand inventory:', error);
    res.status(500).json({ message: 'Error retrieving inventory records.' });
  }
};

// @desc    Stock In Inventory
// @route   POST /api/brand/inventory/stock-in
// @access  Private (Role: BRAND)
export const stockInInventory = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { productId, warehouseId, quantity, reason } = req.body;

    const result = await inventoryService.addStock({
      productId,
      warehouseId,
      brandId,
      quantity: Number(quantity),
      reason,
      user: req.user,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in stock-in:', error.message);
    res.status(400).json({ message: error.message || 'Error adding stock.' });
  }
};

// @desc    Adjust Inventory Quantity with Reason
// @route   POST /api/brand/inventory/adjust
// @access  Private (Role: BRAND)
export const adjustBrandStock = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { productId, warehouseId, newQuantity, reason } = req.body;

    const result = await inventoryService.adjustStock({
      productId,
      warehouseId,
      brandId,
      newQuantity: Number(newQuantity),
      reason,
      user: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error adjusting inventory:', error.message);
    res.status(400).json({ message: error.message || 'Error adjusting stock.' });
  }
};

// @desc    Warehouse-to-Warehouse Stock Transfer
// @route   POST /api/brand/inventory/transfer
// @access  Private (Role: BRAND)
export const transferBrandStock = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { productId, fromWarehouseId, toWarehouseId, quantity, serials } = req.body;

    const result = await inventoryService.transferStock({
      productId,
      fromWarehouseId,
      toWarehouseId,
      brandId,
      quantity: Number(quantity),
      serials,
      user: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in stock transfer:', error.message);
    res.status(400).json({ message: error.message || 'Error transferring stock.' });
  }
};

// ==========================================
// 2. WAREHOUSE MANAGEMENT CONTROLLERS
// ==========================================

// @desc    Get Brand Warehouses
// @route   GET /api/brand/warehouses
// @access  Private (Role: BRAND)
export const getBrandWarehouses = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const warehouses = await Warehouse.find({ brandId }).sort({ isPrimary: -1, createdAt: 1 });
    res.status(200).json({ success: true, warehouses });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving warehouses.' });
  }
};

// @desc    Create Brand Warehouse
// @route   POST /api/brand/warehouses
// @access  Private (Role: BRAND)
export const createBrandWarehouse = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { name, code, contactName, phone, addressLine1, addressLine2, city, state, postalCode, country, isPrimary } = req.body;

    if (!name || !code || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({ message: 'Please provide all required warehouse fields.' });
    }

    const codeNorm = code.trim().toUpperCase();
    const existing = await Warehouse.findOne({ brandId, code: codeNorm });
    if (existing) {
      return res.status(400).json({ message: `Warehouse code "${codeNorm}" already exists for your brand.` });
    }

    if (isPrimary) {
      await Warehouse.updateMany({ brandId }, { $set: { isPrimary: false } });
    }

    const warehouse = await Warehouse.create({
      name: name.trim(),
      brandId,
      code: codeNorm,
      contactName: contactName || '',
      phone: phone || '',
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 || '',
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country || 'India',
      isPrimary: Boolean(isPrimary),
      isActive: true,
    });

    res.status(201).json({ success: true, warehouse });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating warehouse.' });
  }
};

// @desc    Update Brand Warehouse
// @route   PATCH /api/brand/warehouses/:id
// @access  Private (Role: BRAND)
export const updateBrandWarehouse = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { id } = req.params;

    const warehouse = await Warehouse.findOne({ _id: id, brandId });
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found or unauthorized.' });

    const fields = ['name', 'contactName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) warehouse[f] = req.body[f];
    });

    if (req.body.isPrimary) {
      await Warehouse.updateMany({ brandId }, { $set: { isPrimary: false } });
      warehouse.isPrimary = true;
    }

    await warehouse.save();
    res.status(200).json({ success: true, warehouse });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating warehouse.' });
  }
};

// ==========================================
// 3. SERIAL / IMEI REGISTRY CONTROLLERS
// ==========================================

// @desc    Get Brand Serials list
// @route   GET /api/brand/serials
// @access  Private (Role: BRAND)
export const getBrandSerials = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { search, productId, status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { brandId };
    if (productId && productId !== 'all') query.productId = productId;
    if (status && status !== 'all') query.status = status.toLowerCase();

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { serialNumber: searchRegex },
        { imei1: searchRegex },
        { imei2: searchRegex },
      ];
    }

    const total = await SerialNumber.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const serials = await SerialNumber.find(query)
      .populate('productId', 'name SKU modelNumber')
      .populate('warehouseId', 'name code city')
      .populate('sellerOrderId', 'orderId fulfillmentStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Serials summary by status
    const statusCounts = await SerialNumber.aggregate([
      { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const summary = {};
    statusCounts.forEach((s) => {
      summary[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      serials,
      total,
      page: pageNum,
      totalPages,
      summary,
    });
  } catch (error) {
    console.error('Error fetching brand serials:', error);
    res.status(500).json({ message: 'Error retrieving serial numbers.' });
  }
};

// @desc    Register single serial number
// @route   POST /api/brand/serials
// @access  Private (Role: BRAND)
export const createBrandSerial = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { serialNumber, imei1, imei2, productId, warehouseId } = req.body;

    const result = await serialService.registerSingleSerial({
      serialNumber,
      imei1,
      imei2,
      productId,
      warehouseId,
      brandId,
      user: req.user,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error registering serial number.' });
  }
};

// @desc    Bulk Import Serials (CSV / Array JSON)
// @route   POST /api/brand/serials/import
// @access  Private (Role: BRAND)
export const importBrandSerials = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { rows } = req.body;

    const result = await serialService.bulkImportSerials({
      rows,
      brandId,
      user: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error importing serials.' });
  }
};

// ==========================================
// 4. FULFILLMENT & PACKING CONTROLLERS
// ==========================================

// @desc    Get Brand Fulfillment Queue
// @route   GET /api/brand/fulfillment
// @access  Private (Role: BRAND)
export const getBrandFulfillmentQueue = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { status = 'all' } = req.query;

    const query = { seller: brandId };
    if (status === 'ready_to_pack') {
      query.fulfillmentStatus = { $in: ['Processing', 'Ready to Pack'] };
    } else if (status === 'packed') {
      query.fulfillmentStatus = 'Packed';
    } else if (status !== 'all') {
      query.fulfillmentStatus = status;
    } else {
      query.fulfillmentStatus = { $nin: ['Delivered', 'Cancelled'] };
    }

    const orders = await SellerOrder.find(query)
      .populate('parentOrder', 'orderId paymentStatus shippingAddress createdAt')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving fulfillment queue.' });
  }
};

// @desc    Assign Serial to Seller Order item
// @route   POST /api/brand/orders/:id/assign-serial
// @access  Private (Role: BRAND)
export const assignOrderSerial = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { id: sellerOrderId } = req.params;
    const { serialNumber, productId } = req.body;

    const result = await serialService.assignSerialToOrder({
      serialNumber,
      sellerOrderId,
      productId,
      brandId,
      user: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error assigning serial number.' });
  }
};

// @desc    Complete Packing Checklist and Mark Order Packed
// @route   POST /api/brand/orders/:id/pack
// @access  Private (Role: BRAND)
export const packSellerOrder = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { id: sellerOrderId } = req.params;
    const { checklist } = req.body;

    const result = await serialService.markSerialsPacked({
      sellerOrderId,
      brandId,
      checklist: checklist || {
        productVerified: true,
        serialVerified: true,
        accessoriesIncluded: true,
        invoiceIncluded: true,
        packagingSealed: true,
      },
      user: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error completing packing checklist.' });
  }
};

// ==========================================
// 5. ADMIN CENTRAL INVENTORY CONTROLLERS
// ==========================================

// @desc    Get Marketplace-wide Inventory
// @route   GET /api/admin/inventory
// @access  Private (Role: ADMIN)
export const getAdminInventory = async (req, res) => {
  try {
    const { search, brandId, warehouseId, status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (brandId && brandId !== 'all') query.brandId = brandId;
    if (warehouseId && warehouseId !== 'all') query.warehouseId = warehouseId;
    if (status && status !== 'all') query.status = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ sku: searchRegex }];
    }

    const total = await Inventory.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const inventory = await Inventory.find(query)
      .populate('productId', 'name SKU modelNumber images isSerialTracked category')
      .populate('brandId', 'name slug logo')
      .populate('warehouseId', 'name code city state')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const [statsAgg, lowStockCount] = await Promise.all([
      Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalUnits: { $sum: '$totalQuantity' },
            availableUnits: { $sum: '$availableQuantity' },
            reservedUnits: { $sum: '$reservedQuantity' },
            soldUnits: { $sum: '$soldQuantity' },
          },
        },
      ]),
      Inventory.countDocuments({ status: 'low_stock' }),
    ]);

    const stats = statsAgg[0] || { totalUnits: 0, availableUnits: 0, reservedUnits: 0, soldUnits: 0 };
    stats.lowStockCount = lowStockCount;

    res.status(200).json({
      success: true,
      inventory,
      total,
      page: pageNum,
      totalPages,
      stats,
    });
  } catch (error) {
    console.error('Error fetching admin inventory:', error);
    res.status(500).json({ message: 'Error retrieving marketplace inventory.' });
  }
};

// @desc    Get Marketplace Warehouses
// @route   GET /api/admin/warehouses
// @access  Private (Role: ADMIN)
export const getAdminWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().populate('brandId', 'name slug logo').sort({ createdAt: -1 });
    res.status(200).json({ success: true, warehouses });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving warehouses.' });
  }
};

// @desc    Get Marketplace Serials
// @route   GET /api/admin/serials
// @access  Private (Role: ADMIN)
export const getAdminSerials = async (req, res) => {
  try {
    const { search, brandId, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (brandId && brandId !== 'all') query.brandId = brandId;
    if (status && status !== 'all') query.status = status.toLowerCase();

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ serialNumber: searchRegex }, { imei1: searchRegex }, { imei2: searchRegex }];
    }

    const total = await SerialNumber.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const serials = await SerialNumber.find(query)
      .populate('productId', 'name SKU modelNumber')
      .populate('brandId', 'name slug logo')
      .populate('warehouseId', 'name code city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({ success: true, serials, total, page: pageNum, totalPages });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving serials.' });
  }
};
