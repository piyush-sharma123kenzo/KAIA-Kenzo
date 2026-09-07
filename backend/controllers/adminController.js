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
import Setting from '../models/Setting.js';
import DeliveryLocation from '../models/DeliveryLocation.js';
import shippingService from '../services/shipping/shipping.service.js';
import { formatUserResponse } from '../utils/jwt.utils.js';
import { isProhibitedBrand } from '../utils/brandValidation.js';
import { syncProductRatingAggregate, removeReview } from '../services/review/review.service.js';

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

    const now = new Date();
    let startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (timeRange === 'today') {
      startDate = new Date(new Date().setHours(0, 0, 0, 0));
    } else if (timeRange === '7days') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'thisMonth' || timeRange === 'thismonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === '3months') {
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '6months') {
      startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '1year') {
      startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    }

    const [
      ordersAgg,
      totalUsers,
      totalCustomers,
      totalBrands,
      totalAdmins,
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      lowStockProducts,
      totalOrdersCount,
      pendingOrdersCount,
      deliveredOrdersCount,
      cancelledOrdersCount,
      totalPaymentsCount,
      paidPaymentsCount,
      failedPaymentsCount,
      activeDeliveryAreas,
      pendingSettlementsCount,
      pendingReturnsCount,
      lowStockInventory,
      outOfStockInventory,
      directLowStockProducts,
      salesByCategory,
      salesByBrand,
      topProducts,
      recentActivity,
      recentOrders,
    ] = await Promise.all([
      // 1. GMV & Orders Aggregation (Paid orders within selected timeframe)
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
      // 2. Users Breakdown
      User.countDocuments({}),
      User.countDocuments({ role: { $in: ['CUSTOMER', 'customer'] } }),
      Brand.countDocuments({ status: { $in: ['Approved', 'approved', 'active'] } }),
      User.countDocuments({ role: { $in: ['ADMIN', 'admin'] } }),
      // 3. Products Breakdown
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ 'stock.quantity': { $lte: 0 } }),
      Product.countDocuments({ 'stock.quantity': { $gt: 0, $lte: 5 } }),
      // 4. Orders Breakdown
      Order.countDocuments({}),
      Order.countDocuments({ orderStatus: { $in: ['Pending', 'pending_payment', 'Processing', 'processing'] } }),
      Order.countDocuments({ orderStatus: { $in: ['Delivered', 'delivered'] } }),
      Order.countDocuments({ orderStatus: { $in: ['Cancelled', 'cancelled'] } }),
      // 5. Payments Breakdown
      Payment.countDocuments({}),
      Payment.countDocuments({ status: { $in: ['paid', 'authorized', 'captured'] } }),
      Payment.countDocuments({ status: 'failed' }),
      // 6. Delivery Areas
      DeliveryLocation.countDocuments({ isActive: true }),
      // 7. Settlements & Returns Pending
      Settlement.countDocuments({ status: 'pending' }),
      ReturnRequest.countDocuments({ status: { $in: ['requested', 'under_review', 'received_at_depot'] } }),
      // 8. Low Stock from Inventory Collection
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
      // 9. Out of Stock from Inventory Collection
      Inventory.find({ availableQuantity: { $lte: 0 } })
        .populate('productId', 'name SKU modelNumber sellingPrice')
        .populate('brandId', 'name slug')
        .limit(10),
      // 10. Low Stock directly from Product model
      Product.find({ 'stock.quantity': { $lte: 5 } })
        .populate('brand', 'name slug')
        .populate('category', 'name')
        .limit(10),
      // 11. Sales by Category
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
      // 12. Sales by Brand
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
      // 13. Top Selling Products
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
      // 14. Recent Audit Activity
      AuditLog.find({}).populate('user', 'name email role').sort({ createdAt: -1 }).limit(10),
      // 15. Recent Real Orders for Command Center
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(8)
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

    // Consolidate low stock list (use Inventory if present, fallback to Product collection)
    const combinedLowStock = lowStockInventory.length > 0
      ? lowStockInventory
      : directLowStockProducts.map((p) => ({
          _id: p._id,
          sku: p.SKU || p.modelNumber || '',
          productId: {
            _id: p._id,
            name: p.name,
            SKU: p.SKU,
            sellingPrice: p.sellingPrice,
          },
          brandId: p.brand ? { name: p.brand.name, slug: p.brand.slug } : { name: 'Authorized' },
          availableQuantity: p.stock?.quantity || 0,
          lowStockThreshold: p.stock?.reorderThreshold || 5,
        }));

    res.status(200).json({
      success: true,
      timeRange,
      kpis: {
        totalGMV: Math.round(orderStats.totalGMV * 100) / 100,
        totalOrders: orderStats.orderCount,
        totalCustomers,
        totalUsers,
        totalBrands,
        totalAdmins,
        totalProducts,
        activeProducts,
        inactiveProducts,
        outOfStockProducts,
        lowStockProducts,
        allOrdersCount: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        deliveredOrders: deliveredOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        totalPayments: totalPaymentsCount,
        paidPayments: paidPaymentsCount,
        failedPayments: failedPaymentsCount,
        activeDeliveryAreas,
        marketplaceCommission: Math.round(orderStats.totalCommission * 100) / 100,
        totalRefunds: Math.round(orderStats.totalRefunds * 100) / 100,
        sellerPayables: Math.round(orderStats.totalSellerPayables * 100) / 100,
        pendingSettlements: pendingSettlementsCount,
        pendingReturns: pendingReturnsCount,
      },
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        outOfStockProducts,
        lowStockProducts,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        deliveredOrders: deliveredOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        totalUsers,
        totalCustomers,
        totalSellers: totalBrands,
        totalBrands,
        totalRevenue: Math.round(orderStats.totalGMV * 100) / 100,
        activeDeliveryAreas,
        totalPayments: totalPaymentsCount,
        paidPayments: paidPaymentsCount,
        failedPayments: failedPaymentsCount,
        pendingApprovals: pendingSettlementsCount + pendingReturnsCount,
      },
      metrics: {
        totalUsers,
        totalCustomers,
        totalBrands,
        totalProducts,
        activeDeliveryAreas,
        pendingBrands: pendingSettlementsCount,
        pendingProducts: 0,
        gmv: Math.round(orderStats.totalGMV * 100) / 100,
        commissionRevenue: Math.round(orderStats.totalCommission * 100) / 100,
      },
      lowStockList: combinedLowStock,
      outOfStockList: outOfStockInventory,
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
// 2. USER MANAGEMENT & DIRECTORY
// ==========================================

// @desc    Get all users with search, role/status filters, sorting & pagination
// @route   GET /api/admin/users
// @access  Private (Role: ADMIN)
export const getUsers = async (req, res) => {
  try {
    const { role, search, status, emailVerified, sort = 'newest', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    // Role filter (supports case-insensitive role query)
    if (role && role !== 'all') {
      query.role = role.toUpperCase();
    }

    // Status filter (Active / Suspended / Inactive)
    if (status && status !== 'all') {
      const s = status.toLowerCase();
      if (s === 'active') {
        query.$and = [{ status: { $ne: 'Suspended' } }, { isActive: { $ne: false } }];
      } else if (s === 'suspended' || s === 'inactive' || s === 'blocked') {
        query.$or = [{ status: 'Suspended' }, { isActive: false }];
      }
    }

    // Email verification filter
    if (emailVerified && emailVerified !== 'all') {
      const isVer = emailVerified === 'verified' || emailVerified === 'true';
      query.emailVerified = isVer;
    }

    // Search by Name, Email, or Phone
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Sorting
    let sortQuery = { createdAt: -1 };
    if (sort === 'oldest') sortQuery = { createdAt: 1 };
    else if (sort === 'name_asc') sortQuery = { name: 1 };
    else if (sort === 'name_desc') sortQuery = { name: -1 };
    else if (sort === 'last_login') sortQuery = { lastLogin: -1 };

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [total, users, statsAgg] = await Promise.all([
      User.countDocuments(query),
      User.find(query).select('-password').sort(sortQuery).skip(skip).limit(limitNum),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalCustomers: {
              $sum: { $cond: [{ $eq: ['$role', 'CUSTOMER'] }, 1, 0] },
            },
            totalBrands: {
              $sum: { $cond: [{ $eq: ['$role', 'BRAND'] }, 1, 0] },
            },
            totalAdmins: {
              $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] },
            },
            activeUsers: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$status', 'Suspended'] },
                      { $ne: ['$isActive', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            inactiveUsers: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'Suspended'] },
                      { $eq: ['$isActive', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            newUsersThisMonth: {
              $sum: {
                $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;
    const stats = statsAgg[0] || {
      totalUsers: total,
      totalCustomers: 0,
      totalBrands: 0,
      totalAdmins: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      newUsersThisMonth: 0,
    };

    const formattedUsers = users.map((u) => formatUserResponse(u));

    res.status(200).json({
      success: true,
      users: formattedUsers,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      stats,
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users directory.' });
  }
};

// @desc    Get calculated MongoDB user statistics
// @route   GET /api/admin/users/stats
// @access  Private (Role: ADMIN)
export const getUserStats = async (req, res) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [statsAgg, verifiedCount, unverifiedCount] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalCustomers: {
              $sum: { $cond: [{ $eq: ['$role', 'CUSTOMER'] }, 1, 0] },
            },
            totalBrands: {
              $sum: { $cond: [{ $eq: ['$role', 'BRAND'] }, 1, 0] },
            },
            totalAdmins: {
              $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] },
            },
            activeUsers: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$status', 'Suspended'] },
                      { $ne: ['$isActive', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            inactiveUsers: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'Suspended'] },
                      { $eq: ['$isActive', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            newUsersThisMonth: {
              $sum: {
                $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0],
              },
            },
          },
        },
      ]),
      User.countDocuments({ emailVerified: true }),
      User.countDocuments({ emailVerified: false }),
    ]);

    const stats = statsAgg[0] || {
      totalUsers: 0,
      totalCustomers: 0,
      totalBrands: 0,
      totalAdmins: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      newUsersThisMonth: 0,
    };

    res.status(200).json({
      success: true,
      stats: {
        ...stats,
        verifiedUsers: verifiedCount,
        unverifiedUsers: unverifiedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching admin user statistics:', error);
    res.status(500).json({ success: false, message: 'Error fetching user statistics.' });
  }
};

// @desc    Get detailed user profile, order statistics, addresses & audit trail
// @route   GET /api/admin/users/:id
// @access  Private (Role: ADMIN)
export const getUserDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const [orders, returns, auditLogs, orderStatsAgg, brand] = await Promise.all([
      Order.find({ customer: user._id })
        .populate({
          path: 'childOrders',
          populate: { path: 'seller', select: 'name slug logo' },
        })
        .sort({ createdAt: -1 })
        .limit(10),
      ReturnRequest.find({ customerId: user._id }).sort({ createdAt: -1 }).limit(10),
      AuditLog.find({
        $or: [{ user: user._id }, { entityId: user._id }],
      })
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .limit(10),
      Order.aggregate([
        { $match: { customer: user._id, paymentStatus: 'Paid' } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$finalAmount' },
          },
        },
      ]),
      user.role === 'BRAND' ? Brand.findOne({ owner: user._id }) : Promise.resolve(null),
    ]);

    const stats = {
      totalOrders: orderStatsAgg[0]?.totalOrders || orders.length,
      totalSpent: Math.round((orderStatsAgg[0]?.totalSpent || 0) * 100) / 100,
      returnsCount: returns.length,
    };

    res.status(200).json({
      success: true,
      user: formatUserResponse(user),
      rawUser: user,
      stats,
      orders,
      returns,
      brand,
      auditLogs,
    });
  } catch (error) {
    console.error('Error fetching user profile details:', error);
    res.status(500).json({ success: false, message: 'Error fetching user profile details.' });
  }
};

// @desc    Admin update of user profile details
// @route   PUT /api/admin/users/:id
// @access  Private (Role: ADMIN)
export const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { name, firstName, lastName, phone, role, status, isActive, emailVerified, gstin } = req.body;

    // Self-protection: Admin cannot demote their own admin role or suspend their own account
    const isSelf = req.user._id.toString() === user._id.toString();

    if (role && role.toUpperCase() !== user.role) {
      const targetRole = role.toUpperCase();
      if (!['CUSTOMER', 'BRAND', 'ADMIN'].includes(targetRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role. Must be CUSTOMER, BRAND, or ADMIN.' });
      }
      if (isSelf && user.role === 'ADMIN' && targetRole !== 'ADMIN') {
        return res.status(400).json({ success: false, message: 'You cannot remove your own administrator privileges.' });
      }
      if (user.role === 'ADMIN' && targetRole !== 'ADMIN') {
        const activeAdminCount = await User.countDocuments({ role: 'ADMIN', status: { $ne: 'Suspended' } });
        if (activeAdminCount <= 1) {
          return res.status(400).json({ success: false, message: 'Cannot demote the final remaining administrator.' });
        }
      }
      user.role = targetRole;
    }

    if (status !== undefined || isActive !== undefined) {
      const targetStatus = status || (isActive ? 'Active' : 'Suspended');
      if (isSelf && targetStatus === 'Suspended') {
        return res.status(400).json({ success: false, message: 'You cannot suspend or deactivate your own account.' });
      }
      if (user.role === 'ADMIN' && targetStatus === 'Suspended') {
        const activeAdminCount = await User.countDocuments({ role: 'ADMIN', status: { $ne: 'Suspended' } });
        if (activeAdminCount <= 1) {
          return res.status(400).json({ success: false, message: 'Cannot suspend the final remaining administrator.' });
        }
      }
      user.status = targetStatus;
      user.isActive = targetStatus === 'Active';
    }

    if (name !== undefined && typeof name === 'string' && name.trim()) user.name = name.trim();
    if (firstName !== undefined && typeof firstName === 'string') user.firstName = firstName.trim();
    if (lastName !== undefined && typeof lastName === 'string') user.lastName = lastName.trim();
    if (phone !== undefined && typeof phone === 'string') user.phone = phone.trim();
    if (emailVerified !== undefined) user.emailVerified = Boolean(emailVerified);
    if (gstin !== undefined && typeof gstin === 'string') user.gstin = gstin.trim().toUpperCase();

    await user.save();

    await logAdminAction(
      req.user._id,
      `Updated User Profile: ${user.email}`,
      'User',
      user._id,
      { name: user.name, phone: user.phone, role: user.role, status: user.status },
      req
    );

    res.status(200).json({
      success: true,
      message: 'User account updated successfully.',
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Error updating user by admin:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating user profile.' });
  }
};

// @desc    Toggle or update user active / suspended status
// @route   PATCH /api/admin/users/:id/status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Role: ADMIN)
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status, isActive } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Determine target status
    let nextStatus;
    if (status !== undefined) {
      nextStatus = status === 'Active' || status === 'active' ? 'Active' : 'Suspended';
    } else if (isActive !== undefined) {
      nextStatus = isActive ? 'Active' : 'Suspended';
    } else {
      nextStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    }

    // Self-protection: Prevent an admin from suspending their own account
    if (req.user._id.toString() === user._id.toString() && nextStatus === 'Suspended') {
      return res.status(400).json({
        success: false,
        message: 'Security safeguard: You cannot deactivate or suspend your own account.',
      });
    }

    // Safety: Prevent suspending the last active administrator
    if (user.role === 'ADMIN' && nextStatus === 'Suspended') {
      const activeAdminCount = await User.countDocuments({ role: 'ADMIN', status: { $ne: 'Suspended' } });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot suspend the final remaining system administrator.',
        });
      }
    }

    const prevStatus = user.status;
    user.status = nextStatus;
    user.isActive = nextStatus === 'Active';
    await user.save();

    await logAdminAction(
      req.user._id,
      `Toggled user status to ${nextStatus} for ${user.email}`,
      'User',
      user._id,
      { prevStatus, status: nextStatus },
      req
    );

    res.status(200).json({
      success: true,
      message: `User account is now ${nextStatus === 'Active' ? 'activated' : 'suspended'}.`,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Error changing user status:', error);
    res.status(500).json({ success: false, message: 'Error changing user status.' });
  }
};

// @desc    Change user role (CUSTOMER / BRAND / ADMIN)
// @route   PATCH /api/admin/users/:id/role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Role: ADMIN)
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    if (!role || typeof role !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid role is required.' });
    }

    const targetRole = role.trim().toUpperCase();
    if (!['CUSTOMER', 'BRAND', 'ADMIN'].includes(targetRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role value. Must be CUSTOMER, BRAND, or ADMIN.',
      });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Self-protection: Prevent admin from removing their own admin role
    if (req.user._id.toString() === user._id.toString() && targetRole !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Security safeguard: You cannot remove your own administrator role.',
      });
    }

    // Safety: Prevent demoting the last active administrator
    if (user.role === 'ADMIN' && targetRole !== 'ADMIN') {
      const activeAdminCount = await User.countDocuments({ role: 'ADMIN', status: { $ne: 'Suspended' } });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the final remaining system administrator.',
        });
      }
    }

    const prevRole = user.role;
    user.role = targetRole;
    await user.save();

    await logAdminAction(
      req.user._id,
      `Changed user role from ${prevRole} to ${targetRole} for ${user.email}`,
      'User',
      user._id,
      { prevRole, role: targetRole },
      req
    );

    res.status(200).json({
      success: true,
      message: `User role changed to ${targetRole} successfully.`,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Error updating user role.' });
  }
};

// @desc    Soft delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Role: ADMIN)
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Self-protection: Admin cannot delete own account
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security safeguard: You cannot delete your own account.',
      });
    }

    // Safety: Cannot delete last remaining active admin
    if (user.role === 'ADMIN') {
      const activeAdminCount = await User.countDocuments({ role: 'ADMIN', status: { $ne: 'Suspended' } });
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the final remaining system administrator.',
        });
      }
    }

    // Soft delete: Deactivate and mark deletedAt
    user.isActive = false;
    user.status = 'Suspended';
    user.deletedAt = new Date();
    await user.save();

    await logAdminAction(
      req.user._id,
      `Soft deleted user account: ${user.email}`,
      'User',
      user._id,
      { deletedAt: user.deletedAt, email: user.email },
      req
    );

    res.status(200).json({
      success: true,
      message: 'User account deactivated (soft deleted) successfully.',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user account.' });
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
    if (status && status !== 'all') {
      if (status === 'captured' || status === 'paid') {
        query.status = { $in: ['paid', 'authorized', 'captured'] };
      } else if (status === 'refunded') {
        query.status = { $in: ['refunded', 'partially_refunded'] };
      } else {
        query.status = status;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { razorpayPaymentId: searchRegex },
        { providerPaymentId: searchRegex },
        { razorpayOrderId: searchRegex },
        { providerOrderId: searchRegex },
      ];
    }

    const total = await Payment.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate('customerId', 'name email phone')
      .populate('order', 'orderId finalAmount paymentStatus orderStatus')
      .populate('orderId', 'orderId finalAmount paymentStatus orderStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Summary stats
    const [capturedTotal, refundTotal] = await Promise.all([
      Payment.aggregate([
        { $match: { status: { $in: ['paid', 'authorized', 'captured'] } } },
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
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    review.isHidden = Boolean(isHidden);
    if (moderationNote !== undefined) review.moderationNote = moderationNote;
    await review.save();

    // Recompute product rating aggregate when visibility changes
    await syncProductRatingAggregate(review.product);

    await logAdminAction(req.user._id, `${isHidden ? 'Hidden' : 'Restored'} Review`, 'Review', review._id, { isHidden, moderationNote }, req);

    res.status(200).json({ success: true, message: `Review is now ${isHidden ? 'hidden' : 'visible'}.`, review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error moderating review.' });
  }
};

export const deleteAdminReview = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await removeReview(id, req.user._id, true);
    await logAdminAction(req.user._id, 'Deleted Customer Review', 'Review', id, {}, req);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message || 'Error deleting review.' });
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

// @desc    Update order status by Admin
// @route   PATCH /api/admin/orders/:id/status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Role: ADMIN)
export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, orderStatus, notes } = req.body;
    const targetStatus = orderStatus || status;

    if (!targetStatus) {
      return res.status(400).json({ success: false, message: 'Valid order status is required.' });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { orderId: id }] } : { orderId: id };

    const order = await Order.findOne(query).populate('customer', 'name email phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const prevStatus = order.orderStatus;
    order.orderStatus = targetStatus;

    if (['Paid', 'paid', 'Delivered', 'delivered'].includes(targetStatus) && order.paymentStatus !== 'Paid') {
      order.paymentStatus = 'Paid';
    }

    await order.save();

    // Synchronize child seller orders
    const fulfillmentMap = {
      Pending: 'Processing',
      Confirmed: 'Processing',
      Processing: 'Processing',
      Packed: 'Packed',
      Shipped: 'Shipped',
      'Out for Delivery': 'Out for Delivery',
      Delivered: 'Delivered',
      Cancelled: 'Cancelled',
      Returned: 'Returned',
    };
    const mappedFulfillment = fulfillmentMap[targetStatus] || 'Processing';
    await SellerOrder.updateMany(
      { parentOrder: order._id },
      { $set: { fulfillmentStatus: mappedFulfillment } }
    );

    // Create Notification for customer
    if (order.customer?._id) {
      try {
        await Notification.create({
          user: order.customer._id,
          title: `Order Status Update: #${order.orderId}`,
          message: `Your order #${order.orderId} status has been updated to '${targetStatus}'. ${notes || ''}`,
          type: 'Order',
        });
      } catch (notifErr) {
        console.warn('Order notification warning:', notifErr.message);
      }
    }

    await logAdminAction(
      req.user._id,
      `Updated Order #${order.orderId} status to ${targetStatus}`,
      'Order',
      order._id,
      { prevStatus, newStatus: targetStatus, notes },
      req
    );

    res.status(200).json({
      success: true,
      message: `Order #${order.orderId} status updated to ${targetStatus}.`,
      order,
    });
  } catch (error) {
    console.error('Error updating admin order status:', error);
    res.status(500).json({ success: false, message: 'Error updating order status.' });
  }
};

// @desc    Create Brand by Admin (with Apple/Sony prohibition)
// @route   POST /api/admin/brands
// @access  Private (Role: ADMIN)
export const createAdminBrand = async (req, res) => {
  try {
    const { name, description, contactEmail, contactPhone, logo, banner, businessDetails, commissionOverride } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Brand name is required.' });
    }

    if (isProhibitedBrand(name)) {
      return res.status(400).json({
        success: false,
        message: 'Brand prohibited: Apple and Sony brands and products are not permitted on KAIA Technologies.',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (isProhibitedBrand(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Brand prohibited: Apple and Sony brands and products are not permitted on KAIA Technologies.',
      });
    }

    const existing = await Brand.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Brand with this name already exists.' });
    }

    const brand = await Brand.create({
      owner: req.user._id,
      name: name.trim(),
      slug,
      description: description || '',
      contactEmail: contactEmail || req.user.email,
      contactPhone: contactPhone || req.user.phone || '9999999999',
      logo: logo || '',
      banner: banner || '',
      businessDetails: businessDetails || {},
      commissionOverride: commissionOverride !== undefined ? Number(commissionOverride) : null,
      status: 'Approved',
      isApproved: true,
      isActive: true,
    });

    await logAdminAction(req.user._id, `Created Brand: ${brand.name}`, 'Brand', brand._id, req.body, req);

    res.status(201).json({
      success: true,
      message: 'Brand created successfully.',
      brand,
    });
  } catch (error) {
    console.error('Error creating admin brand:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating brand.' });
  }
};

// @desc    Delete / Deactivate Brand
// @route   DELETE /api/admin/brands/:id
// @access  Private (Role: ADMIN)
export const deleteAdminBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found.' });

    // Soft delete / deactivate
    brand.isActive = false;
    brand.status = 'Suspended';
    await brand.save();

    await logAdminAction(req.user._id, `Deactivated Brand: ${brand.name}`, 'Brand', brand._id, {}, req);

    res.status(200).json({
      success: true,
      message: `Brand '${brand.name}' deactivated successfully.`,
    });
  } catch (error) {
    console.error('Error deactivating brand:', error);
    res.status(500).json({ success: false, message: 'Error deactivating brand.' });
  }
};

// @desc    Delete Category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Role: ADMIN)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

    category.isActive = false;
    await category.save();

    await logAdminAction(req.user._id, `Deactivated Category: ${category.name}`, 'Category', category._id, {}, req);

    res.status(200).json({
      success: true,
      message: `Category '${category.name}' deactivated successfully.`,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Error deleting category.' });
  }
};

// @desc    Get Administrative System Settings
// @route   GET /api/admin/settings
// @access  Private (Role: ADMIN)
export const getAdminSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'system_settings' });
    if (!settings) {
      settings = await Setting.create({ key: 'system_settings' });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ success: false, message: 'Error retrieving system settings.' });
  }
};

// @desc    Update Administrative System Settings
// @route   PUT /api/admin/settings
// @access  Private (Role: ADMIN)
export const updateAdminSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'system_settings' });
    if (!settings) {
      settings = new Setting({ key: 'system_settings' });
    }

    const {
      siteName,
      siteLogo,
      supportEmail,
      supportPhone,
      businessAddress,
      deliverySettings,
      taxSettings,
      orderSettings,
    } = req.body;

    if (siteName !== undefined) settings.siteName = siteName;
    if (siteLogo !== undefined) settings.siteLogo = siteLogo;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (supportPhone !== undefined) settings.supportPhone = supportPhone;
    if (businessAddress !== undefined) settings.businessAddress = businessAddress;
    if (deliverySettings !== undefined) settings.deliverySettings = deliverySettings;
    if (taxSettings !== undefined) settings.taxSettings = taxSettings;
    if (orderSettings !== undefined) settings.orderSettings = orderSettings;

    await settings.save();

    await logAdminAction(req.user._id, 'Updated System Settings', 'Setting', settings._id, req.body, req);

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
      settings,
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ success: false, message: 'Error saving system settings.' });
  }
};
