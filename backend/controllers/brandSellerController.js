import mongoose from 'mongoose';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import SerialNumber from '../models/SerialNumber.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import AuditLog from '../models/AuditLog.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import ReturnRequest from '../models/ReturnRequest.js';
import Settlement from '../models/Settlement.js';
import SellerLedger from '../models/SellerLedger.js';
import { deriveMasterOrderStatus } from './orderController.js';

// Helper to log audit actions
const logAudit = async (userId, brandId, action, entity, entityId, changes = {}, req = null) => {
  try {
    await AuditLog.create({
      user: userId,
      brand: brandId,
      action,
      entity,
      entityId,
      changes,
      metadata: {
        ip: req?.ip || req?.headers?.['x-forwarded-for'] || '',
        userAgent: req?.headers?.['user-agent'] || '',
      },
    });
  } catch (err) {
    console.error('AuditLog creation warning:', err);
  }
};

// ==========================================
// 1. BRAND / VENDOR DASHBOARD OVERVIEW
// ==========================================
// @desc    Get metrics, sales overview, and recent orders for authenticated brand/vendor
// @route   GET /api/brand/dashboard, GET /api/vendor/dashboard
// @access  Private (Role: BRAND / VENDOR, Approved)
export const getBrandDashboard = async (req, res) => {
  try {
    const brandId = req.brand._id;

    // 1. Products metrics from MongoDB
    const totalProducts = await Product.countDocuments({ brand: brandId, isActive: true, isDeleted: false });
    const activeProducts = await Product.countDocuments({ brand: brandId, isActive: true, isDeleted: false, status: { $in: ['Approved', 'published'] } });
    const draftProducts = await Product.countDocuments({ brand: brandId, isDeleted: false, status: 'Draft' });
    const pendingProducts = await Product.countDocuments({ brand: brandId, isDeleted: false, status: 'Pending Approval' });
    const outOfStockProducts = await Product.countDocuments({
      brand: brandId,
      isActive: true,
      isDeleted: false,
      $or: [
        { 'stock.quantity': { $lte: 0 } },
        { 'stock.availableQuantity': { $lte: 0 } },
      ],
    });

    // Low stock count (available quantity <= reorderThreshold and > 0)
    const lowStockProducts = await Product.countDocuments({
      brand: brandId,
      isActive: true,
      isDeleted: false,
      $expr: {
        $and: [
          { $gt: [{ $subtract: ['$stock.quantity', { $ifNull: ['$stock.reservedQuantity', 0] }] }, 0] },
          { $lte: [{ $subtract: ['$stock.quantity', { $ifNull: ['$stock.reservedQuantity', 0] }] }, { $ifNull: ['$stock.reorderThreshold', 4] }] },
        ],
      },
    });

    // 2. Orders metrics for this brand/vendor
    const sellerOrders = await SellerOrder.find({ seller: brandId })
      .populate('parentOrder', 'orderId orderStatus paymentStatus createdAt shippingAddress')
      .sort({ createdAt: -1 });

    const totalOrders = sellerOrders.length;
    const pendingOrders = sellerOrders.filter(
      (o) => o.fulfillmentStatus === 'Processing' || o.fulfillmentStatus === 'Pending'
    ).length;
    const processingOrders = sellerOrders.filter((o) => o.fulfillmentStatus === 'Processing').length;
    const packedOrders = sellerOrders.filter((o) => o.fulfillmentStatus === 'Packed').length;
    const shippedOrders = sellerOrders.filter((o) => o.fulfillmentStatus === 'Shipped' || o.fulfillmentStatus === 'Out for Delivery').length;
    const deliveredOrders = sellerOrders.filter((o) => o.fulfillmentStatus === 'Delivered').length;
    const cancelledOrders = sellerOrders.filter((o) => o.fulfillmentStatus === 'Cancelled').length;

    // Returns metrics
    const returnedOrders = await ReturnRequest.countDocuments({ brand: brandId });

    // 3. Sales & Financial Calculations across timeframes
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRevenue = 0;
    let todaySales = 0;
    let weekSales = 0;
    let monthSales = 0;
    let totalUnitsSold = 0;
    let pendingSettlement = 0;
    let totalSettled = 0;

    sellerOrders.forEach((so) => {
      const isPaidOrValid = so.fulfillmentStatus !== 'Cancelled';
      if (isPaidOrValid) {
        const amt = so.finalAmount || so.subtotal || 0;
        const payable = so.sellerPayableAmount || Math.round(amt * 0.95);
        const createdAt = new Date(so.createdAt);

        totalRevenue += amt;
        if (createdAt >= startOfToday) todaySales += amt;
        if (createdAt >= startOfWeek) weekSales += amt;
        if (createdAt >= startOfMonth) monthSales += amt;

        if (so.settlementStatus === 'unsettled' || so.settlementStatus === 'eligible' || !so.settlementStatus) {
          pendingSettlement += payable;
        } else if (so.settlementStatus === 'settled') {
          totalSettled += payable;
        }

        (so.items || []).forEach((item) => {
          totalUnitsSold += item.qty || item.quantity || 1;
        });
      }
    });

    // Check completed settlements and ledger records
    const settlements = await Settlement.find({ brandId });
    const paidSettlementsTotal = settlements
      .filter((s) => s.status === 'paid')
      .reduce((sum, s) => sum + (s.netPayable || 0), 0);

    const availableBalance = Math.max(0, pendingSettlement);

    // 4. Monthly Chart Data
    const monthlyMap = {};
    sellerOrders.forEach((so) => {
      if (so.fulfillmentStatus !== 'Cancelled') {
        const monthKey = new Date(so.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthKey, sales: 0, orders: 0 };
        }
        monthlyMap[monthKey].sales += so.finalAmount || 0;
        monthlyMap[monthKey].orders += 1;
      }
    });
    const salesChart = Object.values(monthlyMap);

    // 5. Recent Orders snippet
    const recentOrders = sellerOrders.slice(0, 6).map((so) => ({
      _id: so._id,
      orderId: so.orderId || so.parentOrder?.orderId || 'ORD-000',
      parentOrderId: so.parentOrder?._id,
      customerCity: so.parentOrder?.shippingAddress?.city || so.shippingAddress?.city || 'India',
      itemsCount: (so.items || []).reduce((sum, it) => sum + (it.qty || it.quantity || 1), 0),
      items: (so.items || []).map((it) => ({
        name: it.name,
        price: it.price,
        qty: it.qty || it.quantity || 1,
      })),
      amount: so.finalAmount,
      paymentStatus: so.parentOrder?.paymentStatus || so.paymentStatus || 'Paid',
      fulfillmentStatus: so.fulfillmentStatus,
      createdAt: so.createdAt,
    }));

    res.status(200).json({
      success: true,
      brand: {
        id: req.brand._id,
        name: req.brand.name,
        slug: req.brand.slug,
        logo: req.brand.logo,
        status: req.brand.status,
      },
      metrics: {
        // 14 Core Dashboard Cards as required by specification:
        totalProducts,
        activeProducts,
        publishedProducts: activeProducts, // Alias for backward compatibility
        draftProducts,
        outOfStockProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        processingOrders,
        packedOrders,
        shippedOrders,
        deliveredOrders,
        returnedOrders,
        cancelledOrders,
        totalRevenue,
        totalSales: totalRevenue, // Alias
        pendingSettlement,
        availableBalance,
        paidSettlements: paidSettlementsTotal || totalSettled,
        todaySales,
        weekSales,
        monthSales,
        totalUnitsSold,
        averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
      salesChart,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching brand dashboard overview:', error);
    res.status(500).json({ message: 'Error retrieving brand dashboard data' });
  }
};

// ==========================================
// 2. PRODUCT MANAGEMENT (CRUD & IDOR SAFE)
// ==========================================
// @desc    Get paginated products for authenticated brand
// @route   GET /api/brand/products
// @access  Private (Role: BRAND, Approved)
export const getBrandProducts = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { search, category, status, sort, page = 1, limit = 10 } = req.query;

    const query = { brand: brandId, isActive: true };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { SKU: regex },
        { modelNumber: regex },
        { description: regex },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      const foundCat = await Category.findOne({
        $or: [
          { slug: category },
          { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null },
        ],
      });
      if (foundCat) query.category = foundCat._id;
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'priceLow') sortQuery = { sellingPrice: 1 };
    else if (sort === 'priceHigh') sortQuery = { sellingPrice: -1 };
    else if (sort === 'stockLow') sortQuery = { 'stock.quantity': 1 };
    else if (sort === 'nameAsc') sortQuery = { name: 1 };
    else if (sort === 'oldest') sortQuery = { createdAt: 1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    res.status(200).json({
      success: true,
      products,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    });
  } catch (error) {
    console.error('Error fetching brand products:', error);
    res.status(500).json({ message: 'Error retrieving brand product listings' });
  }
};

// @desc    Get single product by ID (IDOR Protected)
// @route   GET /api/brand/products/:id
// @access  Private (Role: BRAND, Approved)
export const getBrandProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const brandId = req.brand._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // IDOR Protection: must match BOTH _id and brand
    const product = await Product.findOne({ _id: id, brand: brandId, isActive: true })
      .populate('category', 'name slug')
      .select('-__v');

    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    // Fetch related inventory and serials count
    const inventory = await Inventory.findOne({ product: id, brand: brandId });
    const serialsCount = await SerialNumber.countDocuments({ product: id, brand: brandId });

    res.status(200).json({
      success: true,
      product,
      inventory,
      serialsCount,
    });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Error retrieving product details' });
  }
};

// @desc    Create a new product for authenticated brand
// @route   POST /api/brand/products
// @access  Private (Role: BRAND, Approved)
export const createBrandProduct = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const {
      name,
      category,
      description,
      shortDescription,
      mrp,
      price,
      sellingPrice,
      compareAtPrice,
      SKU,
      modelNumber,
      warranty,
      highlights,
      images,
      specifications,
      stock,
      status = 'Draft',
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    const effectiveSellingPrice = Number(sellingPrice || price || 0);
    const effectiveMrp = Number(mrp || compareAtPrice || effectiveSellingPrice);

    if (effectiveSellingPrice <= 0) {
      return res.status(400).json({ message: 'Selling price must be greater than zero' });
    }
    if (effectiveMrp < effectiveSellingPrice) {
      return res.status(400).json({ message: 'MRP/Compare Price cannot be less than selling price' });
    }

    // Check unique SKU
    const productSku = (SKU || `${req.brand.slug.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`).trim().toUpperCase();
    const existingSku = await Product.findOne({ SKU: productSku });
    if (existingSku && existingSku.brand.toString() !== brandId.toString()) {
      return res.status(400).json({ message: `SKU '${productSku}' is already registered by another brand. Please use a distinct SKU.` });
    }

    // Generate unique slug
    const baseSlug = `${req.brand.slug}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    const existingSlug = await Product.findOne({ slug });
    if (existingSlug && (!existingSku || existingSlug._id.toString() !== existingSku._id.toString())) {
      slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const stockQty = Math.max(0, parseInt(stock?.quantity, 10) || 0);
    const reorderThresh = Math.max(1, parseInt(stock?.reorderThreshold, 10) || 4);

    // Format images safely
    let formattedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      formattedImages = images.map((img, idx) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: img.alt || `${name} view ${idx + 1}`,
        isPrimary: idx === 0,
        order: idx,
      }));
    } else {
      formattedImages = [{
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
        alt: name,
        isPrimary: true,
        order: 0,
      }];
    }

    // Resolve category ObjectId flexibly (handles ObjectId string, slug, or category name)
    let resolvedCategoryId = null;
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      const found = await Category.findById(category);
      if (found) resolvedCategoryId = found._id;
    }
    if (!resolvedCategoryId && category) {
      const found = await Category.findOne({
        $or: [
          { slug: String(category).toLowerCase() },
          { name: { $regex: new RegExp(`^${category}$`, 'i') } },
        ],
      });
      if (found) {
        resolvedCategoryId = found._id;
      } else {
        const catName = String(category).trim();
        const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const createdCat = await Category.create({
          name: catName,
          slug: catSlug || `cat-${Date.now()}`,
          baseCommission: 5.0,
          isActive: true,
        });
        resolvedCategoryId = createdCat._id;
      }
    }
    if (!resolvedCategoryId) {
      let defaultCat = await Category.findOne({ isActive: true });
      if (!defaultCat) {
        defaultCat = await Category.create({
          name: 'Laptops',
          slug: 'laptops',
          baseCommission: 5.0,
          isActive: true,
        });
      }
      resolvedCategoryId = defaultCat._id;
    }

    let newProduct = null;
    if (existingSku && existingSku.brand.toString() === brandId.toString()) {
      // Re-use / update existing product draft for this brand
      existingSku.name = name.trim();
      existingSku.category = resolvedCategoryId;
      existingSku.modelNumber = modelNumber || existingSku.modelNumber;
      existingSku.description = description || '';
      existingSku.shortDescription = shortDescription || description?.substring(0, 120) || '';
      existingSku.mrp = effectiveMrp;
      existingSku.sellingPrice = effectiveSellingPrice;
      existingSku.images = formattedImages;
      existingSku.stock = {
        quantity: stockQty,
        reservedQuantity: existingSku.stock?.reservedQuantity || 0,
        availableQuantity: stockQty,
        reorderThreshold: reorderThresh,
      };
      existingSku.specifications = specifications || {};
      existingSku.highlights = Array.isArray(highlights) ? highlights : [];
      existingSku.warranty = warranty || '1 Year Brand Manufacturer Warranty';
      existingSku.status = status === 'Approved' ? 'Pending Approval' : status;
      existingSku.isActive = true;
      newProduct = await existingSku.save();
    } else {
      newProduct = await Product.create({
        brand: brandId,
        category: resolvedCategoryId,
        name: name.trim(),
        slug,
        modelNumber: modelNumber || `MOD-${Date.now().toString().slice(-4)}`,
        SKU: productSku,
        description: description || '',
        shortDescription: shortDescription || description?.substring(0, 120) || '',
        mrp: effectiveMrp,
        sellingPrice: effectiveSellingPrice,
        gstRate: 18.0,
        images: formattedImages,
        stock: {
          quantity: stockQty,
          reservedQuantity: 0,
          availableQuantity: stockQty,
          reorderThreshold: reorderThresh,
        },
        specifications: specifications || {},
        highlights: Array.isArray(highlights) ? highlights : [],
        warranty: warranty || '1 Year Brand Manufacturer Warranty',
        status: status === 'Approved' ? 'Pending Approval' : status, // Sellers cannot directly auto-approve
        isActive: true,
      });
    }

    // Create or update corresponding Inventory record
    await Inventory.findOneAndUpdate(
      { $or: [{ productId: newProduct._id }, { product: newProduct._id }], brandId },
      {
        $set: {
          productId: newProduct._id,
          product: newProduct._id,
          brandId: brandId,
          brand: brandId,
          sku: newProduct.SKU,
          totalQuantity: stockQty,
          quantity: stockQty,
          availableQuantity: stockQty,
          reservedQuantity: 0,
          soldQuantity: 0,
          damagedQuantity: 0,
          returnedQuantity: 0,
          lowStockThreshold: reorderThresh,
          warehouse: {
            name: `${req.brand.name} Logistics Center`,
            location: 'Authorized Depot',
            bin: 'DEFAULT-01',
          },
        },
      },
      { upsert: true, new: true }
    );

    // Audit log
    await logAudit(req.user._id, brandId, 'CREATE_PRODUCT', 'Product', newProduct._id, { name: newProduct.name, sku: newProduct.SKU }, req);

    res.status(201).json({
      success: true,
      message: 'Product created successfully and catalog inventory initialized.',
      product: newProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: error.message || 'Error creating product' });
  }
};

// @desc    Update product by ID (IDOR Protected)
// @route   PATCH /api/brand/products/:id
// @access  Private (Role: BRAND, Approved)
export const updateBrandProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const brandId = req.brand._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    // IDOR Protection: must match BOTH _id and brand
    const product = await Product.findOne({ _id: id, brand: brandId, isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    const {
      name,
      category,
      description,
      shortDescription,
      mrp,
      price,
      sellingPrice,
      warranty,
      highlights,
      images,
      specifications,
      stock,
      status,
    } = req.body;

    const previousData = {
      name: product.name,
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      status: product.status,
    };

    if (name) product.name = name.trim();
    if (category) {
      let resolvedCategoryId = null;
      if (mongoose.Types.ObjectId.isValid(category)) {
        const found = await Category.findById(category);
        if (found) resolvedCategoryId = found._id;
      }
      if (!resolvedCategoryId) {
        const found = await Category.findOne({
          $or: [
            { slug: String(category).toLowerCase() },
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
          ],
        });
        if (found) resolvedCategoryId = found._id;
      }
      if (resolvedCategoryId) product.category = resolvedCategoryId;
    }
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (warranty !== undefined) product.warranty = warranty;
    if (highlights !== undefined) product.highlights = Array.isArray(highlights) ? highlights : [];
    if (specifications !== undefined) product.specifications = specifications;

    if (sellingPrice || price) {
      const newSellingPrice = Number(sellingPrice || price);
      if (newSellingPrice <= 0) {
        return res.status(400).json({ message: 'Selling price must be greater than zero' });
      }
      product.sellingPrice = newSellingPrice;
    }

    if (mrp) {
      const newMrp = Number(mrp);
      if (newMrp < product.sellingPrice) {
        return res.status(400).json({ message: 'MRP cannot be less than selling price' });
      }
      product.mrp = newMrp;
    }

    if (images && Array.isArray(images) && images.length > 0) {
      product.images = images.map((img, idx) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: img.alt || `${product.name} view ${idx + 1}`,
        isPrimary: idx === 0,
        order: idx,
      }));
    }

    // Handle stock quantity updates safely
    if (stock && stock.quantity !== undefined) {
      const newQty = Math.max(0, parseInt(stock.quantity, 10));
      product.stock.quantity = newQty;
      product.stock.availableQuantity = Math.max(0, newQty - (product.stock.reservedQuantity || 0));

      // Sync Inventory model
      await Inventory.findOneAndUpdate(
        { $or: [{ productId: product._id }, { product: product._id }], brandId },
        {
          $set: {
            productId: product._id,
            product: product._id,
            brandId: brandId,
            brand: brandId,
            sku: product.SKU,
            totalQuantity: newQty,
            quantity: newQty,
            availableQuantity: product.stock.availableQuantity,
            lowStockThreshold: stock.reorderThreshold || product.stock.reorderThreshold,
          },
        },
        { upsert: true }
      );
    }

    // Status transition: seller can toggle Draft or submit for review
    if (status && ['Draft', 'Pending Approval'].includes(status)) {
      product.status = status;
    }

    await product.save();

    // Audit log
    await logAudit(req.user._id, brandId, 'UPDATE_PRODUCT', 'Product', product._id, { previous: previousData, updated: { name: product.name, price: product.sellingPrice } }, req);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: error.message || 'Error updating product' });
  }
};

// @desc    Delete/Archive product (IDOR Protected)
// @route   DELETE /api/brand/products/:id
// @access  Private (Role: BRAND, Approved)
export const deleteBrandProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const brandId = req.brand._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findOne({ _id: id, brand: brandId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    // Soft delete by setting isActive to false and status to Archived
    product.isActive = false;
    product.status = 'Archived';
    await product.save();

    // Audit log
    await logAudit(req.user._id, brandId, 'ARCHIVE_PRODUCT', 'Product', product._id, { name: product.name, SKU: product.SKU }, req);

    res.status(200).json({
      success: true,
      message: 'Product successfully archived from catalog.',
    });
  } catch (error) {
    console.error('Error archiving product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

// ==========================================
// 3. INVENTORY & SERIAL TRACKING
// ==========================================
// @desc    Get inventory list with low stock items and serial details
// @route   GET /api/brand/inventory
// @access  Private (Role: BRAND, Approved)
export const getBrandInventory = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { search, lowStockOnly } = req.query;

    const query = { brand: brandId, isActive: true };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { SKU: regex }];
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ 'stock.quantity': 1 })
      .select('name SKU modelNumber sellingPrice stock images category specifications');

    let inventoryList = products.map((p) => {
      const totalStock = p.stock.quantity || 0;
      const reserved = p.stock.reservedQuantity || 0;
      const available = Math.max(0, totalStock - reserved);
      const threshold = p.stock.reorderThreshold || 4;
      const isLowStock = available <= threshold;

      return {
        _id: p._id,
        productId: p._id,
        name: p.name,
        SKU: p.SKU,
        modelNumber: p.modelNumber,
        category: p.category?.name || 'General',
        image: p.images[0]?.url || '',
        totalStock,
        reserved,
        available,
        lowStockThreshold: threshold,
        isLowStock,
        status: totalStock === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock',
      };
    });

    if (lowStockOnly === 'true') {
      inventoryList = inventoryList.filter((item) => item.isLowStock);
    }

    // Fetch serial units summary
    const serials = await SerialNumber.find({ brand: brandId })
      .populate('product', 'name SKU')
      .sort({ createdAt: -1 })
      .limit(50);

    const serialsSummary = {
      available: await SerialNumber.countDocuments({ brand: brandId, status: 'Available' }),
      reserved: await SerialNumber.countDocuments({ brand: brandId, status: 'Reserved' }),
      sold: await SerialNumber.countDocuments({ brand: brandId, status: 'Sold' }),
      returned: await SerialNumber.countDocuments({ brand: brandId, status: 'Returned' }),
    };

    res.status(200).json({
      success: true,
      inventory: inventoryList,
      totalCount: inventoryList.length,
      lowStockCount: inventoryList.filter((i) => i.isLowStock).length,
      serials,
      serialsSummary,
    });
  } catch (error) {
    console.error('Error fetching brand inventory:', error);
    res.status(500).json({ message: 'Error retrieving inventory data' });
  }
};

// @desc    Update stock quantity for a product (Validation against negative stock)
// @route   PATCH /api/brand/inventory/:productId
// @access  Private (Role: BRAND, Approved)
export const updateBrandStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const brandId = req.brand._id;
    const { quantity, reorderThreshold, adjustmentType, adjustmentAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findOne({ _id: productId, brand: brandId, isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    const prevQuantity = product.stock.quantity || 0;
    let newQuantity = prevQuantity;

    if (quantity !== undefined) {
      newQuantity = parseInt(quantity, 10);
    } else if (adjustmentType && adjustmentAmount) {
      const amt = parseInt(adjustmentAmount, 10);
      if (adjustmentType === 'add') newQuantity += amt;
      else if (adjustmentType === 'subtract') newQuantity -= amt;
      else if (adjustmentType === 'set') newQuantity = amt;
    }

    // STRICT VALIDATION: Reject negative stock
    if (isNaN(newQuantity) || newQuantity < 0) {
      return res.status(400).json({ message: 'Stock quantity cannot be negative or invalid' });
    }

    const reserved = product.stock.reservedQuantity || 0;
    if (newQuantity < reserved) {
      return res.status(400).json({
        message: `Cannot reduce stock to ${newQuantity} because ${reserved} units are currently reserved for open orders.`,
      });
    }

    product.stock.quantity = newQuantity;
    product.stock.availableQuantity = newQuantity - reserved;
    if (reorderThreshold !== undefined && Number(reorderThreshold) > 0) {
      product.stock.reorderThreshold = Number(reorderThreshold);
    }

    await product.save();

    // Sync Inventory model
    await Inventory.findOneAndUpdate(
      { $or: [{ productId: product._id }, { product: product._id }], brandId },
      {
        $set: {
          productId: product._id,
          product: product._id,
          brandId: brandId,
          brand: brandId,
          sku: product.SKU,
          totalQuantity: newQuantity,
          quantity: newQuantity,
          availableQuantity: product.stock.availableQuantity,
          lowStockThreshold: product.stock.reorderThreshold,
        },
      },
      { upsert: true }
    );

    // Audit log
    await logAudit(
      req.user._id,
      brandId,
      'UPDATE_STOCK',
      'Inventory',
      product._id,
      { previousQty: prevQuantity, newQty: newQuantity, SKU: product.SKU },
      req
    );

    res.status(200).json({
      success: true,
      message: `Stock for ${product.name} updated to ${newQuantity} units.`,
      stock: product.stock,
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Error updating inventory stock' });
  }
};

// @desc    Add serialized units (Serial Number / IMEI)
// @route   POST /api/brand/inventory/:productId/serials
// @access  Private (Role: BRAND, Approved)
export const addBrandProductSerials = async (req, res) => {
  try {
    const { productId } = req.params;
    const brandId = req.brand._id;
    const { serialNumbers } = req.body; // Array of strings or { serialNumber, imei1, imei2 }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findOne({ _id: productId, brand: brandId, isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    if (!Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of serial numbers' });
    }

    const createdSerials = [];
    const errors = [];

    for (const item of serialNumbers) {
      const serialStr = typeof item === 'string' ? item.trim() : item.serialNumber?.trim();
      if (!serialStr) continue;

      const exists = await SerialNumber.findOne({ serialNumber: serialStr });
      if (exists) {
        errors.push(`Serial '${serialStr}' already registered`);
        continue;
      }

      const doc = await SerialNumber.create({
        serialNumber: serialStr,
        imei1: typeof item === 'object' ? item.imei1 || '' : '',
        imei2: typeof item === 'object' ? item.imei2 || '' : '',
        product: product._id,
        brand: brandId,
        status: 'Available',
      });
      createdSerials.push(doc);
    }

    res.status(201).json({
      success: true,
      message: `Added ${createdSerials.length} serial units.`,
      created: createdSerials,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error adding serials:', error);
    res.status(500).json({ message: 'Error adding serial numbers' });
  }
};

// ==========================================
// 4. ORDER MANAGEMENT & FULFILLMENT FLOW
// ==========================================
// @desc    Get orders belonging to authenticated brand
// @route   GET /api/brand/orders
// @access  Private (Role: BRAND, Approved)
export const getBrandOrders = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { search, status, page = 1, limit = 10 } = req.query;

    const query = { seller: brandId };

    if (status && status !== 'all') {
      query.fulfillmentStatus = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await SellerOrder.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const orders = await SellerOrder.find(query)
      .populate('parentOrder', 'orderId orderStatus paymentStatus createdAt shippingAddress')
      .populate('items.product', 'name SKU images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Sanitize order data - strictly minimal shipping info, no private credentials
    const sanitizedOrders = orders.map((so) => ({
      _id: so._id,
      orderId: so.orderId || so.parentOrder?.orderId || 'ORD-000',
      parentOrderId: so.parentOrder?._id,
      customerName: so.parentOrder?.shippingAddress?.name || 'Customer',
      customerCity: so.parentOrder?.shippingAddress?.city || 'India',
      itemsCount: (so.items || []).reduce((sum, it) => sum + (it.qty || 1), 0),
      items: (so.items || []).map((it) => ({
        product: it.product?._id,
        name: it.name,
        price: it.price,
        qty: it.qty,
        sku: it.product?.SKU,
        image: it.product?.images?.[0]?.url || '',
        serialNumbers: it.serialNumbers || [],
      })),
      amount: so.finalAmount,
      commissionAmount: so.commissionAmount,
      paymentStatus: so.parentOrder?.paymentStatus || 'Paid',
      fulfillmentStatus: so.fulfillmentStatus,
      createdAt: so.createdAt,
    }));

    res.status(200).json({
      success: true,
      orders: sanitizedOrders,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    });
  } catch (error) {
    console.error('Error fetching brand orders:', error);
    res.status(500).json({ message: 'Error retrieving brand orders' });
  }
};

// @desc    Get order details by ID (IDOR Protected)
// @route   GET /api/brand/orders/:id
// @access  Private (Role: BRAND, Approved)
export const getBrandOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const brandId = req.brand._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    // IDOR Protection: must match BOTH _id and seller: brandId
    const sellerOrder = await SellerOrder.findOne({ _id: id, seller: brandId })
      .populate('parentOrder', 'orderId orderStatus paymentStatus createdAt shippingAddress')
      .populate('items.product', 'name SKU images specifications');

    if (!sellerOrder) {
      return res.status(404).json({ message: 'Order not found or unauthorized' });
    }

    // Available serials for items in this order
    const itemProductIds = (sellerOrder.items || []).map((i) => i.product?._id).filter(Boolean);
    const availableSerials = await SerialNumber.find({
      brand: brandId,
      product: { $in: itemProductIds },
      status: 'Available',
    }).select('serialNumber product imei1');

    // Minimal sanitized response
    const sanitizedOrder = {
      _id: sellerOrder._id,
      orderId: sellerOrder.orderId || sellerOrder.parentOrder?.orderId,
      parentOrderId: sellerOrder.parentOrder?._id,
      createdAt: sellerOrder.createdAt,
      paymentStatus: sellerOrder.parentOrder?.paymentStatus || 'Paid',
      fulfillmentStatus: sellerOrder.fulfillmentStatus,
      subtotal: sellerOrder.subtotal,
      gstAmount: sellerOrder.gstAmount,
      shippingAmount: sellerOrder.shippingAmount,
      finalAmount: sellerOrder.finalAmount,
      logistics: sellerOrder.logistics || {},
      // Minimal shipping address necessary for fulfillment
      shippingAddress: {
        name: sellerOrder.parentOrder?.shippingAddress?.name || 'Customer',
        street: sellerOrder.parentOrder?.shippingAddress?.street || 'Confidential Street',
        city: sellerOrder.parentOrder?.shippingAddress?.city || '',
        state: sellerOrder.parentOrder?.shippingAddress?.state || '',
        postalCode: sellerOrder.parentOrder?.shippingAddress?.postalCode || '',
        phone: sellerOrder.parentOrder?.shippingAddress?.phone || '',
      },
      items: (sellerOrder.items || []).map((it) => ({
        productId: it.product?._id,
        name: it.name,
        sku: it.product?.SKU,
        price: it.price,
        qty: it.qty,
        image: it.product?.images?.[0]?.url || '',
        serialNumbers: it.serialNumbers || [],
      })),
    };

    res.status(200).json({
      success: true,
      order: sanitizedOrder,
      availableSerials,
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Error retrieving order details' });
  }
};

// @desc    Update order fulfillment status & assign serials (IDOR Protected)
// @route   PATCH /api/brand/orders/:id/status
// @access  Private (Role: BRAND, Approved)
export const updateBrandOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const brandId = req.brand._id;
    const { fulfillmentStatus, trackingId, courierName, serialAssignments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    const sellerOrder = await SellerOrder.findOne({ _id: id, seller: brandId });
    if (!sellerOrder) {
      return res.status(404).json({ message: 'Order not found or unauthorized' });
    }

    const allowedStatuses = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (fulfillmentStatus && !allowedStatuses.includes(fulfillmentStatus)) {
      return res.status(400).json({ message: `Invalid fulfillment status '${fulfillmentStatus}'` });
    }

    const prevStatus = sellerOrder.fulfillmentStatus;

    if (fulfillmentStatus) {
      sellerOrder.fulfillmentStatus = fulfillmentStatus;
    }

    if (trackingId) {
      sellerOrder.logistics = sellerOrder.logistics || {};
      sellerOrder.logistics.trackingId = trackingId;
    }
    if (courierName) {
      sellerOrder.logistics = sellerOrder.logistics || {};
      sellerOrder.logistics.courierName = courierName;
    }

    // Handle serial number assignment during packing/shipping
    if (Array.isArray(serialAssignments) && serialAssignments.length > 0) {
      for (const assign of serialAssignments) {
        const { productId, serialNumber } = assign;
        if (!productId || !serialNumber) continue;

        // Verify serial belongs to brand and product
        const serialDoc = await SerialNumber.findOne({
          serialNumber,
          product: productId,
          brand: brandId,
        });

        if (serialDoc) {
          serialDoc.status = 'Sold';
          serialDoc.orderId = sellerOrder.orderId;
          serialDoc.warrantyStart = new Date();
          serialDoc.warrantyEnd = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
          await serialDoc.save();

          // Append serial to item record
          const targetItem = sellerOrder.items.find((it) => it.product.toString() === productId.toString());
          if (targetItem) {
            targetItem.serialNumbers = targetItem.serialNumbers || [];
            if (!targetItem.serialNumbers.includes(serialNumber)) {
              targetItem.serialNumbers.push(serialNumber);
            }
          }
        }
      }
    }

    await sellerOrder.save();

    // Re-derive master order status dynamically
    if (sellerOrder.parentOrder) {
      await deriveMasterOrderStatus(sellerOrder.parentOrder);
    }

    // Audit log
    await logAudit(
      req.user._id,
      brandId,
      'UPDATE_ORDER_STATUS',
      'SellerOrder',
      sellerOrder._id,
      { previousStatus: prevStatus, newStatus: sellerOrder.fulfillmentStatus, trackingId },
      req
    );

    res.status(200).json({
      success: true,
      message: `Order status updated to '${sellerOrder.fulfillmentStatus}'`,
      order: sellerOrder,
    });
  } catch (error) {
    console.error('Error updating order fulfillment status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
};

// ==========================================
// 5. SALES ANALYTICS & TIMEFRAME AGGREGATION
// ==========================================
// @desc    Get sales analytics over selected timeframe
// @route   GET /api/brand/sales
// @access  Private (Role: BRAND, Approved)
export const getBrandSales = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { range = '30d' } = req.query;

    const now = new Date();
    let startDate = new Date();

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (range === '90d') {
      startDate.setDate(now.getDate() - 90);
    } else if (range === 'all') {
      startDate = new Date(2020, 0, 1);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    const sellerOrders = await SellerOrder.find({
      seller: brandId,
      createdAt: { $gte: startDate },
      fulfillmentStatus: { $ne: 'Cancelled' },
    }).sort({ createdAt: 1 });

    let grossSales = 0;
    let totalOrders = sellerOrders.length;
    let unitsSold = 0;
    let commissionTotal = 0;

    const timelineMap = {};

    sellerOrders.forEach((so) => {
      grossSales += so.finalAmount || 0;
      commissionTotal += so.commissionAmount || 0;

      (so.items || []).forEach((it) => {
        unitsSold += it.qty || 1;
      });

      const dateKey = so.createdAt.toISOString().split('T')[0];
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { date: dateKey, sales: 0, orders: 0, units: 0 };
      }
      timelineMap[dateKey].sales += so.finalAmount || 0;
      timelineMap[dateKey].orders += 1;
      timelineMap[dateKey].units += (so.items || []).reduce((sum, it) => sum + (it.qty || 1), 0);
    });

    const netSales = grossSales - commissionTotal;
    const averageOrderValue = totalOrders > 0 ? Math.round(grossSales / totalOrders) : 0;
    const chartData = Object.values(timelineMap);

    res.status(200).json({
      success: true,
      range,
      analytics: {
        grossSales,
        netSales,
        commissionTotal,
        totalOrders,
        unitsSold,
        averageOrderValue,
      },
      chartData,
    });
  } catch (error) {
    console.error('Error calculating sales analytics:', error);
    res.status(500).json({ message: 'Error retrieving sales analytics' });
  }
};

// ==========================================
// 6. BRAND PROFILE MANAGEMENT
// ==========================================
// @desc    Get profile of authenticated brand
// @route   GET /api/brand/profile
// @access  Private (Role: BRAND, Approved)
export const getBrandProfile = async (req, res) => {
  try {
    const brand = await Brand.findById(req.brand._id).select('-__v');
    res.status(200).json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    res.status(500).json({ message: 'Error retrieving brand profile' });
  }
};

// @desc    Update editable brand profile fields
// @route   PATCH /api/brand/profile
// @access  Private (Role: BRAND, Approved)
export const updateBrandProfile = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const {
      name,
      description,
      logo,
      banner,
      website,
      contactEmail,
      contactPhone,
      businessDetails,
      bankDetails,
    } = req.body;

    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    if (name && name.trim() !== brand.name) {
      brand.name = name.trim();
    }
    if (description !== undefined) brand.description = description;
    if (logo !== undefined) brand.logo = logo;
    if (banner !== undefined) brand.banner = banner;
    if (website !== undefined) brand.website = website;
    if (contactEmail !== undefined) brand.contactEmail = contactEmail;
    if (contactPhone !== undefined) brand.contactPhone = contactPhone;

    if (businessDetails) {
      brand.businessDetails = {
        ...brand.businessDetails,
        ...businessDetails,
      };
    }
    if (bankDetails) {
      brand.bankDetails = {
        ...brand.bankDetails,
        ...bankDetails,
      };
    }

    await brand.save();

    // Audit log
    await logAudit(req.user._id, brandId, 'UPDATE_PROFILE', 'Brand', brandId, { name: brand.name }, req);

    res.status(200).json({
      success: true,
      message: 'Brand profile updated successfully.',
      brand,
    });
  } catch (error) {
    console.error('Error updating brand profile:', error);
    res.status(500).json({ message: 'Error updating brand profile' });
  }
};

// @desc    Get reviews for products belonging to authenticated brand
// @route   GET /api/brand/reviews
// @access  Private (Role: BRAND, Approved)
export const getBrandReviews = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { rating, page = 1, limit = 20 } = req.query;

    const brandProducts = await Product.find({ brand: brandId }).select('_id');
    const productIds = brandProducts.map((p) => p._id);

    const query = { product: { $in: productIds } };
    if (rating && rating !== 'all') {
      query.rating = Number(rating);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('product', 'name SKU images sellingPrice slug')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      reviews,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('[BrandSellerController] getBrandReviews error:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving brand reviews.' });
  }
};
