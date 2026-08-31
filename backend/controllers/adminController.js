import mongoose from 'mongoose';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Payment from '../models/Payment.js';
import Refund from '../models/Refund.js';
import ReturnRequest from '../models/ReturnRequest.js';
import Shipment from '../models/Shipment.js';
import Inventory from '../models/Inventory.js';
import SerialNumber from '../models/SerialNumber.js';
import Settlement from '../models/Settlement.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import Promotion from '../models/Promotion.js';
import WebhookEvent from '../models/WebhookEvent.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import shippingService from '../services/shipping/shipping.service.js';

// Helper to log admin actions
export const logAdminAction = async (adminId, action, entity, entityId, changes, req) => {
  try {
    await AuditLog.create({
      user: adminId,
      action,
      entity,
      entityId,
      changes,
      metadata: {
        ip: req?.ip || '',
        userAgent: req?.headers?.['user-agent'] || '',
      },
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
};

// ==========================================
// 1. DASHBOARD & REVENUE ANALYTICS
// ==========================================

// @desc    Get complete Command Center Dashboard metrics & charts
// @route   GET /api/admin/dashboard
// @access  Private (Role: ADMIN)
export const getAdminDashboardSummary = async (req, res) => {
  try {
    const { timeRange = '30days' } = req.query;

    let startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (timeRange === 'today') startDate = new Date(new Date().setHours(0, 0, 0, 0));
    else if (timeRange === '7days') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (timeRange === '3months') startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    else if (timeRange === '6months') startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    else if (timeRange === '1year') startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const [
      ordersAgg,
      totalCustomers,
      totalBrands,
      totalProducts,
      pendingSettlementsCount,
      pendingReturnsCount,
      lowStockList,
      outOfStockList,
      salesByCategory,
      salesByBrand,
      topProducts,
      recentActivity,
      recentOrders,
    ] = await Promise.all([
      // 1. GMV & Orders Aggregation
      SellerOrder.aggregate([
        { $match: { paymentStatus: 'Paid', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalGMV: { $sum: '$finalAmount' },
            totalCommission: { $sum: '$commissionAmount' },
            totalRefunds: { $sum: '$refundAmount' },
            totalSellerPayables: { $sum: '$sellerPayableAmount' },
            orderCount: { $sum: 1 },
          },
        },
      ]),
      // 2. Customers
      User.countDocuments({ role: 'CUSTOMER' }),
      // 3. Brands
      Brand.countDocuments({ status: { $in: ['Approved', 'approved', 'active'] } }),
      // 4. Products
      Product.countDocuments({ isActive: true }),
      // 5. Pending Settlements
      Settlement.countDocuments({ status: 'pending' }),
      // 6. Pending Returns
      ReturnRequest.countDocuments({ status: { $in: ['requested', 'under_review', 'received_at_depot'] } }),
      // 7. Low Stock Products
      Inventory.find({
        $expr: {
          $and: [
            { $gt: ['$availableQuantity', 0] },
            { $lte: ['$availableQuantity', '$lowStockThreshold'] },
          ],
        },
      })
        .populate('productId', 'name SKU modelNumber sellingPrice')
        .populate('brandId', 'name slug')
        .populate('warehouseId', 'name city state')
        .limit(10),
      // 8. Out of Stock Products
      Inventory.find({ availableQuantity: { $lte: 0 } })
        .populate('productId', 'name SKU modelNumber sellingPrice')
        .populate('brandId', 'name slug')
        .limit(10),
      // 9. Sales by Category
      Order.aggregate([
        { $match: { paymentStatus: 'Paid', createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.categoryName',
            orders: { $sum: 1 },
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 8 },
      ]),
      // 10. Sales by Brand
      SellerOrder.aggregate([
        { $match: { paymentStatus: 'Paid', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$seller',
            orders: { $sum: 1 },
            gmv: { $sum: '$finalAmount' },
            commission: { $sum: '$commissionAmount' },
            refunds: { $sum: '$refundAmount' },
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: '_id',
            foreignField: '_id',
            as: 'brandDoc',
          },
        },
        { $unwind: '$brandDoc' },
        {
          $project: {
            brandName: '$brandDoc.name',
            brandSlug: '$brandDoc.slug',
            orders: 1,
            gmv: 1,
            commission: 1,
            refunds: 1,
          },
        },
        { $sort: { gmv: -1 } },
        { $limit: 8 },
      ]),
      // 11. Top Selling Products
      Order.aggregate([
        { $match: { paymentStatus: 'Paid', createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            productName: { $first: '$items.productName' },
            brandName: { $first: '$items.brandName' },
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 6 },
      ]),
      // 12. Recent Audit Activity
      AuditLog.find({}).populate('user', 'name email role').sort({ createdAt: -1 }).limit(10),
      // 13. Recent Orders for Command Center
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('customer', 'name email phone')
        .populate({
          path: 'childOrders',
          populate: { path: 'seller', select: 'name logo' },
        }),
    ]);

    const orderStats = ordersAgg[0] || {
      totalGMV: 0,
      totalCommission: 0,
      totalRefunds: 0,
      totalSellerPayables: 0,
      orderCount: 0,
    };

    res.status(200).json({
      success: true,
      timeRange,
      kpis: {
        totalGMV: Math.round(orderStats.totalGMV * 100) / 100,
        totalOrders: orderStats.orderCount,
        totalCustomers,
        totalBrands,
        totalProducts,
        marketplaceCommission: Math.round(orderStats.totalCommission * 100) / 100,
        totalRefunds: Math.round(orderStats.totalRefunds * 100) / 100,
        sellerPayables: Math.round(orderStats.totalSellerPayables * 100) / 100,
        pendingSettlements: pendingSettlementsCount,
        pendingReturns: pendingReturnsCount,
      },
      data: {
        totalProducts,
        totalOrders: orderStats.orderCount,
        totalCustomers,
        totalSellers: totalBrands,
        totalBrands,
        totalRevenue: Math.round(orderStats.totalGMV * 100) / 100,
        pendingApprovals: pendingSettlementsCount + pendingReturnsCount,
      },
      metrics: {
        totalUsers: totalCustomers,
        totalBrands,
        totalProducts,
        pendingBrands: pendingSettlementsCount,
        pendingProducts: 0,
        gmv: Math.round(orderStats.totalGMV * 100) / 100,
        commissionRevenue: Math.round(orderStats.totalCommission * 100) / 100,
      },
      lowStockList,
      outOfStockList,
      salesByCategory,
      salesByBrand,
      topProducts,
      recentActivity,
      recentOrders: recentOrders || [],
    });
  } catch (error) {
    console.error('Error fetching admin dashboard summary:', error);
    res.status(500).json({ message: 'Error compiling marketplace analytics.' });
  }
};

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

export const getUsers = async (req, res) => {
  try {
    const { role, search, status, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (role && role !== 'all') query.role = role.toUpperCase();
    if (status && status !== 'all') query.status = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    res.status(200).json({ success: true, users, total, page: pageNum, totalPages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users.' });
  }
};

export const getUserDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const [orders, returns, auditLogs] = await Promise.all([
      Order.find({ customer: user._id }).sort({ createdAt: -1 }).limit(10),
      ReturnRequest.find({ customerId: user._id }).sort({ createdAt: -1 }).limit(10),
      AuditLog.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.status(200).json({ success: true, user, orders, returns, auditLogs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile details.' });
  }
};

export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Safety: Prevent suspending the last active administrator
    if (user.role === 'ADMIN' && status === 'Suspended') {
      const activeAdminCount = await User.countDocuments({ role: 'ADMIN', status: { $ne: 'Suspended' } });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot suspend the final remaining system administrator.' });
      }
    }

    const prevStatus = user.status;
    user.status = status;
    await user.save();

    await logAdminAction(req.user._id, `Toggled user status to ${status}`, 'User', user._id, { prevStatus, status }, req);

    res.status(200).json({ success: true, message: `User account is now ${status}.`, user });
  } catch (error) {
    res.status(500).json({ message: 'Error changing user status.' });
  }
};

// ==========================================
// 3. BRAND MANAGEMENT & APPROVALS
// ==========================================

export const getAllBrands = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { slug: searchRegex }, { contactEmail: searchRegex }];
    }

    const brands = await Brand.find(query).populate('owner', 'name email phone').sort({ createdAt: -1 });

    res.status(200).json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands.' });
  }
};

export const getBrandDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id).populate('owner', 'name email phone');
    if (!brand) return res.status(404).json({ message: 'Brand not found.' });

    const [products, orders, settlements, returns] = await Promise.all([
      Product.find({ brand: brand._id }).limit(10),
      SellerOrder.find({ seller: brand._id }).sort({ createdAt: -1 }).limit(10),
      Settlement.find({ brandId: brand._id }).sort({ createdAt: -1 }).limit(5),
      ReturnRequest.find({ brandId: brand._id }).sort({ createdAt: -1 }).limit(5),
    ]);

    res.status(200).json({ success: true, brand, products, orders, settlements, returns });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brand details.' });
  }
};

export const verifyBrand = async (req, res) => {
  const { id } = req.params;
  const { status, commissionOverride, rejectionReason } = req.body;

  try {
    const brand = await Brand.findById(id).populate('owner');
    if (!brand) return res.status(404).json({ message: 'Brand registration not found.' });

    if (['Rejected', 'rejected', 'Suspended', 'suspended'].includes(status) && !rejectionReason?.trim()) {
      return res.status(400).json({ message: 'A rejection/suspension reason is required.' });
    }

    const prevStatus = brand.status;
    brand.status = status;
    if (commissionOverride !== undefined) brand.commissionOverride = commissionOverride;
    if (rejectionReason !== undefined) brand.rejectionReason = rejectionReason;

    await brand.save();

    await logAdminAction(req.user._id, `Set brand status to ${status}`, 'Brand', brand._id, { prevStatus, status, commissionOverride, rejectionReason }, req);

    if (['Approved', 'approved'].includes(status) && brand.owner && brand.owner.role === 'CUSTOMER') {
      const user = await User.findById(brand.owner._id);
      if (user) {
        user.role = 'BRAND';
        await user.save();
      }
    }

    await Notification.create({
      user: brand.owner?._id,
      title: `Brand Application Status: ${status}`,
      message: ['Approved', 'approved'].includes(status)
        ? `Congratulations! Your brand partner account for ${brand.name} has been approved.`
        : `Your application status was updated to '${status}'. Reason: ${rejectionReason || 'Documentation review.'}`,
      type: 'Approval',
    });

    res.status(200).json({ success: true, message: `Brand status updated to ${status}.`, brand });
  } catch (error) {
    console.error('Error verifying brand:', error);
    res.status(500).json({ message: 'Error verifying brand registration.' });
  }
};

// ==========================================
// 4. PRODUCT MANAGEMENT & APPROVALS
// ==========================================

export const getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: { $in: ['Pending Approval', 'pending_review'] } })
      .populate('brand', 'name slug')
      .populate('category', 'name slug');
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products pending approval.' });
  }
};

export const verifyProduct = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  try {
    const product = await Product.findById(id).populate({ path: 'brand', populate: { path: 'owner' } });
    if (!product) return res.status(404).json({ message: 'Product listing not found.' });

    const prevStatus = product.status;
    product.status = status;
    if (status === 'Approved' || status === 'approved') product.isActive = true;
    if (status === 'Rejected' || status === 'rejected' || status === 'Disabled') product.isActive = false;

    await product.save();

    await logAdminAction(req.user._id, `Verified listing status: ${status}`, 'Product', product._id, { prevStatus, status, rejectionReason }, req);

    if (product.brand?.owner?._id) {
      await Notification.create({
        user: product.brand.owner._id,
        title: `Product Listing: ${status}`,
        message: `Your product '${product.name}' listing status has been set to '${status}'.`,
        type: 'Approval',
      });
    }

    res.status(200).json({ success: true, message: `Product status updated to ${status}.`, product });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying product listing.' });
  }
};

// ==========================================
// 5. CATEGORY MANAGEMENT
// ==========================================

export const createCategory = async (req, res) => {
  const { name, description, baseCommission, parentCategory, image } = req.body;

  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Category with this name already exists.' });

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || '',
      baseCommission: baseCommission || 5.0,
      parentCategory: parentCategory || null,
      image: image || '',
    });

    await logAdminAction(req.user._id, `Created Category: ${name}`, 'Category', category._id, { name, slug }, req);

    res.status(201).json({ success: true, message: 'Category created successfully.', category });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category.' });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, baseCommission, parentCategory, image, isActive } = req.body;

  try {
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    if (name) {
      category.name = name.trim();
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (description !== undefined) category.description = description;
    if (baseCommission !== undefined) category.baseCommission = baseCommission;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    await logAdminAction(req.user._id, `Updated Category: ${category.name}`, 'Category', category._id, req.body, req);

    res.status(200).json({ success: true, message: 'Category updated successfully.', category });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category.' });
  }
};

// ==========================================
// 6. PAYMENT MANAGEMENT & RECONCILIATION
// ==========================================

export const getAdminPayments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { razorpayPaymentId: searchRegex },
        { razorpayOrderId: searchRegex },
        { paymentId: searchRegex },
      ];
    }

    const total = await Payment.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate('order', 'orderId finalAmount paymentStatus orderStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Summary stats
    const [capturedTotal, refundTotal] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amountRefunded' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      payments,
      total,
      page: pageNum,
      totalPages,
      stats: {
        totalCaptured: capturedTotal[0]?.total || 0,
        totalRefunded: refundTotal[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    res.status(500).json({ message: 'Error retrieving payment records.' });
  }
};

// ==========================================
// 7. REVIEWS MODERATION
// ==========================================

export const getAdminReviews = async (req, res) => {
  try {
    const { status, rating, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (rating && rating !== 'all') query.rating = Number(rating);

    const total = await Review.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name SKU images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({ success: true, reviews, total, page: pageNum, totalPages });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving customer reviews.' });
  }
};

export const moderateReview = async (req, res) => {
  const { id } = req.params;
  const { isHidden, moderationNote } = req.body;

  try {
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    review.isHidden = Boolean(isHidden);
    if (moderationNote) review.moderationNote = moderationNote;
    await review.save();

    await logAdminAction(req.user._id, `${isHidden ? 'Hidden' : 'Restored'} Review`, 'Review', review._id, { isHidden, moderationNote }, req);

    res.status(200).json({ success: true, message: `Review is now ${isHidden ? 'hidden' : 'visible'}.`, review });
  } catch (error) {
    res.status(500).json({ message: 'Error moderating review.' });
  }
};

// ==========================================
// 8. COUPONS & PROMOTIONS MANAGEMENT
// ==========================================

export const getAdminCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).populate('brandId', 'name slug').sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons.' });
  }
};

export const createAdminCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minimumOrderValue, maximumDiscount, usageLimit, fundingType, brandId, startDate, endDate } = req.body;

    if (!code || !discountValue || !endDate) {
      return res.status(400).json({ message: 'Coupon code, discount value, and expiry date are required.' });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minimumOrderValue: Number(minimumOrderValue) || 0,
      maximumDiscount: Number(maximumDiscount) || 0,
      usageLimit: Number(usageLimit) || 1000,
      fundingType: fundingType || 'marketplace-funded',
      brandId: brandId || undefined,
      startDate: startDate || new Date(),
      endDate: new Date(endDate),
      status: 'active',
      isActive: true,
    });

    await logAdminAction(req.user._id, `Created Coupon: ${coupon.code}`, 'Coupon', coupon._id, req.body, req);

    res.status(201).json({ success: true, message: 'Coupon created successfully.', coupon });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating coupon.' });
  }
};

export const updateAdminCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });

    const fields = ['discountType', 'discountValue', 'minimumOrderValue', 'maximumDiscount', 'usageLimit', 'fundingType', 'status', 'isActive', 'endDate'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) coupon[f] = req.body[f];
    });

    await coupon.save();

    await logAdminAction(req.user._id, `Updated Coupon: ${coupon.code}`, 'Coupon', coupon._id, req.body, req);

    res.status(200).json({ success: true, message: 'Coupon updated.', coupon });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating coupon.' });
  }
};

export const getAdminPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({})
      .populate('featuredProducts', 'name SKU sellingPrice images')
      .populate('featuredBrands', 'name slug logo')
      .populate('featuredCategories', 'name slug image')
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({ success: true, promotions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching promotions.' });
  }
};

export const createAdminPromotion = async (req, res) => {
  try {
    const { title, placement, subtitle, bannerUrl, targetUrl, ctaText, featuredProducts, featuredBrands, featuredCategories, displayOrder } = req.body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const promotion = await Promotion.create({
      title: title.trim(),
      slug,
      placement,
      subtitle: subtitle || '',
      bannerUrl: bannerUrl || '',
      targetUrl: targetUrl || '',
      ctaText: ctaText || 'Shop Now',
      featuredProducts: featuredProducts || [],
      featuredBrands: featuredBrands || [],
      featuredCategories: featuredCategories || [],
      displayOrder: Number(displayOrder) || 0,
      isActive: true,
      createdBy: req.user._id,
    });

    await logAdminAction(req.user._id, `Created Promotion Slot: ${title}`, 'Promotion', promotion._id, req.body, req);

    res.status(201).json({ success: true, message: 'Promotion slot created.', promotion });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating promotion.' });
  }
};

export const updateAdminPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findById(id);
    if (!promotion) return res.status(404).json({ message: 'Promotion not found.' });

    const fields = ['title', 'placement', 'subtitle', 'bannerUrl', 'targetUrl', 'ctaText', 'featuredProducts', 'featuredBrands', 'featuredCategories', 'displayOrder', 'isActive'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) promotion[f] = req.body[f];
    });

    await promotion.save();

    await logAdminAction(req.user._id, `Updated Promotion: ${promotion.title}`, 'Promotion', promotion._id, req.body, req);

    res.status(200).json({ success: true, message: 'Promotion updated.', promotion });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating promotion.' });
  }
};

// ==========================================
// 9. WEBHOOK MONITORING & SYSTEM HEALTH
// ==========================================

export const getAdminWebhooks = async (req, res) => {
  try {
    const { provider, processed, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (provider && provider !== 'all') query.provider = provider;
    if (processed !== undefined && processed !== 'all') query.processed = processed === 'true';

    const total = await WebhookEvent.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const webhooks = await WebhookEvent.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    res.status(200).json({ success: true, webhooks, total, page: pageNum, totalPages });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving webhook events.' });
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState === 1 ? 'Operational' : 'Degraded';
    const shippingStatus = shippingService.getProviderStatus();

    const stats = {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      mongoDb: {
        status: mongoState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
      },
      paymentGateway: {
        provider: 'Razorpay',
        configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        status: 'Operational',
      },
      shippingProvider: {
        provider: shippingStatus.provider,
        configured: shippingStatus.configured,
        status: 'Operational',
      },
    };

    res.status(200).json({ success: true, health: stats });
  } catch (error) {
    res.status(500).json({ message: 'Error reading system diagnostics.' });
  }
};

// ==========================================
// 10. CSV EXPORT ENGINE
// ==========================================

export const exportEntityCsv = async (req, res) => {
  const { entity } = req.params;

  try {
    let csvData = '';
    const nowStr = new Date().toISOString().slice(0, 10);

    if (entity === 'orders') {
      const orders = await Order.find({}).populate('customer', 'name email').sort({ createdAt: -1 }).limit(1000);
      csvData = 'Order ID,Customer Name,Customer Email,Subtotal,Tax,Shipping,Discount,Final Amount,Payment Status,Order Status,Created At\n';
      orders.forEach((o) => {
        csvData += `"${o.orderId}","${o.customer?.name || ''}","${o.customer?.email || ''}",${o.subtotal},${o.taxAmount},${o.shippingAmount},${o.discountAmount},${o.finalAmount},"${o.paymentStatus}","${o.orderStatus}","${o.createdAt?.toISOString()}"\n`;
      });
    } else if (entity === 'products') {
      const products = await Product.find({}).populate('brand', 'name').populate('category', 'name').limit(1000);
      csvData = 'Product Name,SKU,Brand,Category,Selling Price,MRP,Status,Is Active\n';
      products.forEach((p) => {
        csvData += `"${p.name}","${p.SKU || ''}","${p.brand?.name || ''}","${p.category?.name || ''}",${p.sellingPrice},${p.mrp},"${p.status}",${p.isActive}\n`;
      });
    } else if (entity === 'customers' || entity === 'users') {
      const users = await User.find({}).select('-password').limit(1000);
      csvData = 'User ID,Name,Email,Phone,Role,Status,Created At\n';
      users.forEach((u) => {
        csvData += `"${u._id}","${u.name}","${u.email}","${u.phone || ''}","${u.role}","${u.status}","${u.createdAt?.toISOString()}"\n`;
      });
    } else if (entity === 'settlements') {
      const settlements = await Settlement.find({}).populate('brandId', 'name').limit(1000);
      csvData = 'Statement Number,Brand,Gross Sales,Commission,Refunds,Net Payable,Status,Created At\n';
      settlements.forEach((s) => {
        csvData += `"${s.settlementNumber}","${s.brandId?.name || ''}",${s.grossSales},${s.commission},${s.refunds},${s.netPayable},"${s.status}","${s.createdAt?.toISOString()}"\n`;
      });
    } else {
      return res.status(400).json({ message: `Export for entity "${entity}" is not supported.` });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=kaia_${entity}_export_${nowStr}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ message: 'Error generating CSV export.' });
  }
};

// Existing core methods
export const getCommissionsLedger = async (req, res) => {
  try {
    const ledger = await Transaction.find({})
      .populate('orderId', 'orderId customer createdAt paymentDetails')
      .populate('childOrderId', 'orderId items fulfillmentStatus subtotal gstAmount finalAmount')
      .populate('seller', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, ledger });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching commission transaction ledger.' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching administrative audit logs.' });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const { search, paymentStatus, orderStatus, brandId, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;
    if (orderStatus && orderStatus !== 'all') query.orderStatus = orderStatus;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      const matchingChildOrders = await SellerOrder.find({
        $or: [
          { orderId: searchRegex },
          { 'items.name': searchRegex },
          { 'items.sku': searchRegex },
        ],
      }).select('parentOrder');
      const parentIdsFromChildren = matchingChildOrders.map((c) => c.parentOrder).filter(Boolean);

      query.$or = [
        { orderId: searchRegex },
        { customer: { $in: userIds } },
        { _id: { $in: parentIdsFromChildren } },
        { 'items.productName': searchRegex },
        { 'items.sku': searchRegex },
        { 'items.brandName': searchRegex },
      ];
    }

    if (brandId && brandId !== 'all') {
      const brandSellerOrders = await SellerOrder.find({ seller: brandId }).select('parentOrder');
      const parentIdsFromBrand = brandSellerOrders.map((so) => so.parentOrder).filter(Boolean);
      query._id = { $in: parentIdsFromBrand };
    }

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate({
        path: 'childOrders',
        populate: { path: 'seller', select: 'name slug logo' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      orders,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ message: 'Error fetching orders.' });
  }
};

export const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { orderId: id }] } : { orderId: id };

    const order = await Order.findOne(query)
      .populate('customer', 'name email phone createdAt')
      .populate({
        path: 'childOrders',
        populate: [
          { path: 'seller', select: 'name slug logo contactEmail contactPhone' },
          { path: 'items.product', select: 'name SKU images specifications' },
        ],
      });

    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const auditLogs = await AuditLog.find({
      $or: [{ entityId: order._id }, { 'changes.masterOrderId': order.orderId }],
    })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      order,
      auditLogs,
    });
  } catch (error) {
    console.error('Error fetching single admin order:', error);
    res.status(500).json({ message: 'Error fetching order details.' });
  }
};
