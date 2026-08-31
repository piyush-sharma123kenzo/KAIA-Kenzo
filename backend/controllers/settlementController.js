import mongoose from 'mongoose';
import Settlement from '../models/Settlement.js';
import SellerLedger from '../models/SellerLedger.js';
import SellerOrder from '../models/SellerOrder.js';
import Order from '../models/Order.js';
import settlementService from '../services/settlement/settlement.service.js';

// ==========================================
// 1. BRAND SELLER FINANCIAL CONTROLLERS
// ==========================================

// @desc    Get Brand Earnings & Financial Overview
// @route   GET /api/brand/earnings
// @access  Private (Role: BRAND)
export const getBrandEarnings = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const summary = await settlementService.getBrandFinancialSummary(brandId);
    res.status(200).json({ success: true, ...summary });
  } catch (error) {
    console.error('Error fetching brand earnings:', error);
    res.status(500).json({ message: 'Error retrieving financial summary.' });
  }
};

// @desc    Get Brand Ledger Transactions
// @route   GET /api/brand/ledger
// @access  Private (Role: BRAND)
export const getBrandLedger = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { transactionType, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { brandId };
    if (transactionType && transactionType !== 'all') query.transactionType = transactionType;

    const total = await SellerLedger.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const entries = await SellerLedger.find(query)
      .populate('sellerOrderId', 'orderId finalAmount fulfillmentStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({ success: true, entries, total, page: pageNum, totalPages });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving financial ledger.' });
  }
};

// @desc    Get Brand Settlements List
// @route   GET /api/brand/settlements
// @access  Private (Role: BRAND)
export const getBrandSettlements = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const settlements = await Settlement.find({ brandId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, settlements });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving settlements.' });
  }
};

// @desc    Get Single Brand Settlement Details
// @route   GET /api/brand/settlements/:id
// @access  Private (Role: BRAND / ADMIN)
export const getSettlementById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { settlementNumber: id }] } : { settlementNumber: id };

    const settlement = await Settlement.findOne(query)
      .populate('brandId', 'name slug logo')
      .populate({
        path: 'sellerOrders',
        select: 'orderId finalAmount commissionRate commissionAmount commissionTaxAmount sellerPayableAmount deliveredAt fulfillmentStatus',
      });

    if (!settlement) return res.status(404).json({ message: 'Settlement record not found.' });

    // IDOR Security check
    if (req.user.role === 'BRAND' && settlement.brandId?._id?.toString() !== req.brand._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this settlement.' });
    }

    res.status(200).json({ success: true, settlement });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving settlement details.' });
  }
};

// ==========================================
// 2. ADMIN CENTRAL FINANCIAL CONTROLLERS
// ==========================================

// @desc    Get Marketplace-wide Revenue Analytics
// @route   GET /api/admin/revenue
// @access  Private (Role: ADMIN)
export const getAdminRevenue = async (req, res) => {
  try {
    // 1. GMV & Commission Aggregation
    const [ordersAgg, settlementsAgg, ledgerAgg] = await Promise.all([
      SellerOrder.aggregate([
        { $match: { paymentStatus: 'Paid' } },
        {
          $group: {
            _id: null,
            totalGMV: { $sum: '$finalAmount' },
            totalCommission: { $sum: '$commissionAmount' },
            totalCommissionTax: { $sum: '$commissionTaxAmount' },
            totalRefunds: { $sum: '$refundAmount' },
            totalSellerPayables: { $sum: '$sellerPayableAmount' },
            orderCount: { $sum: 1 },
          },
        },
      ]),
      Settlement.aggregate([
        {
          $group: {
            _id: '$status',
            totalNet: { $sum: '$netPayable' },
            count: { $sum: 1 },
          },
        },
      ]),
      SellerLedger.aggregate([
        {
          $group: {
            _id: '$transactionType',
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const orderStats = ordersAgg[0] || {
      totalGMV: 0,
      totalCommission: 0,
      totalCommissionTax: 0,
      totalRefunds: 0,
      totalSellerPayables: 0,
      orderCount: 0,
    };

    const settlementStats = {
      pending: 0,
      approved: 0,
      paid: 0,
    };
    settlementsAgg.forEach((s) => {
      if (settlementStats[s._id] !== undefined) settlementStats[s._id] = s.totalNet;
    });

    res.status(200).json({
      success: true,
      gmv: Math.round(orderStats.totalGMV * 100) / 100,
      platformCommission: Math.round(orderStats.totalCommission * 100) / 100,
      commissionTax: Math.round(orderStats.totalCommissionTax * 100) / 100,
      totalRefunds: Math.round(orderStats.totalRefunds * 100) / 100,
      netMarketplaceRevenue: Math.round((orderStats.totalCommission - orderStats.totalRefunds * 0.05) * 100) / 100,
      sellerPayables: Math.round(orderStats.totalSellerPayables * 100) / 100,
      pendingSettlements: Math.round(settlementStats.pending * 100) / 100,
      paidSettlements: Math.round(settlementStats.paid * 100) / 100,
      orderCount: orderStats.orderCount,
    });
  } catch (error) {
    console.error('Error fetching admin revenue:', error);
    res.status(500).json({ message: 'Error retrieving marketplace revenue.' });
  }
};

// @desc    Get Marketplace-wide Settlements
// @route   GET /api/admin/settlements
// @access  Private (Role: ADMIN)
export const getAdminSettlements = async (req, res) => {
  try {
    const { brandId, status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (brandId && brandId !== 'all') query.brandId = brandId;
    if (status && status !== 'all') query.status = status;

    const total = await Settlement.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const settlements = await Settlement.find(query)
      .populate('brandId', 'name slug logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({ success: true, settlements, total, page: pageNum, totalPages });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving marketplace settlements.' });
  }
};

// @desc    Generate Periodic Settlements for Eligible Brands
// @route   POST /api/admin/settlements/generate
// @access  Private (Role: ADMIN)
export const generateSettlements = async (req, res) => {
  try {
    const { brandId } = req.body;
    if (!brandId) return res.status(400).json({ message: 'Please select a brand to settle.' });

    const settlement = await settlementService.createSettlement({
      brandId,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: `Settlement statement #${settlement.settlementNumber} generated.`,
      settlement,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error generating settlement.' });
  }
};

// @desc    Approve a Settlement
// @route   POST /api/admin/settlements/:id/approve
// @access  Private (Role: ADMIN)
export const approveSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const settlement = await settlementService.approveSettlement({ settlementId: id, user: req.user });
    res.status(200).json({ success: true, message: 'Settlement approved for payout.', settlement });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error approving settlement.' });
  }
};

// @desc    Process Settlement Payout Disbursement
// @route   POST /api/admin/settlements/:id/process
// @access  Private (Role: ADMIN)
export const processSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentProvider } = req.body;

    const settlement = await settlementService.processSettlementPayout({
      settlementId: id,
      paymentProvider: paymentProvider || 'mock',
      user: req.user,
    });

    res.status(200).json({ success: true, message: 'Payout processed and seller ledger debited.', settlement });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error processing settlement payout.' });
  }
};

// @desc    Create Manual Financial Adjustment
// @route   POST /api/admin/adjustments
// @access  Private (Role: ADMIN)
export const createManualAdjustment = async (req, res) => {
  try {
    const { brandId, amount, type, reason } = req.body;
    const entry = await settlementService.recordManualAdjustment({
      brandId,
      amount,
      type,
      reason,
      user: req.user,
    });

    res.status(201).json({ success: true, message: 'Adjustment recorded in seller ledger.', entry });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error recording adjustment.' });
  }
};
