import mongoose from 'mongoose';
import ReturnRequest from '../models/ReturnRequest.js';
import Refund from '../models/Refund.js';
import returnService from '../services/return/return.service.js';
import AuditLog from '../models/AuditLog.js';

// ==========================================
// 1. CUSTOMER RETURN CONTROLLERS
// ==========================================

// @desc    Initiate a return/replacement request
// @route   POST /api/returns
// @access  Private (Customer)
export const createCustomerReturn = async (req, res) => {
  try {
    const { masterOrderId, sellerOrderId, items, reason, customerComment, returnType } = req.body;

    const returnDoc = await returnService.createReturnRequest({
      masterOrderId,
      sellerOrderId,
      items,
      reason,
      customerComment,
      returnType: returnType || 'refund',
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully.',
      returnRequest: returnDoc,
    });
  } catch (error) {
    console.error('Error creating return request:', error);
    res.status(400).json({ message: error.message || 'Error processing return request.' });
  }
};

// @desc    Get current user's return requests
// @route   GET /api/returns/my-returns
// @access  Private (Customer)
export const getMyReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({ customerId: req.user._id })
      .populate('brandId', 'name slug logo')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount items')
      .populate('masterOrderId', 'orderId paymentStatus createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, returns });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving your return history.' });
  }
};

// @desc    Get single return request details
// @route   GET /api/returns/:id
// @access  Private (Customer / Brand / Admin)
export const getReturnDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const returnDoc = await returnService.getReturnDoc(id);

    // IDOR Security check
    const isCustomer = req.user.role === 'CUSTOMER' && returnDoc.customerId?._id?.toString() === req.user._id.toString();
    const isBrand = req.user.role === 'BRAND' && returnDoc.brandId?._id?.toString() === req.user.brand?.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isBrand && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized access to this return request.' });
    }

    res.status(200).json({ success: true, returnRequest: returnDoc });
  } catch (error) {
    res.status(404).json({ message: error.message || 'Return request not found.' });
  }
};

// @desc    Cancel a pending return request
// @route   PUT /api/returns/:id/cancel
// @access  Private (Customer)
export const cancelCustomerReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const returnDoc = await returnService.getReturnDoc(id);

    if (returnDoc.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to cancel this return.' });
    }

    if (!['requested', 'under_review'].includes(returnDoc.status)) {
      return res.status(400).json({ message: `Cannot cancel return in status: ${returnDoc.status}` });
    }

    returnDoc.status = 'cancelled';
    returnDoc.cancelledAt = new Date();
    returnDoc.timeline.push({
      status: 'cancelled',
      note: 'Return request cancelled by customer.',
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await returnDoc.save();

    res.status(200).json({ success: true, message: 'Return request cancelled.', returnRequest: returnDoc });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error cancelling return request.' });
  }
};

// ==========================================
// 2. BRAND SELLER RETURN CONTROLLERS
// ==========================================

// @desc    Get brand returns list
// @route   GET /api/brand/returns
// @access  Private (Role: BRAND)
export const getBrandReturns = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { search, status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { brandId };
    if (status && status !== 'all') query.status = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { returnNumber: searchRegex },
        { returnId: searchRegex },
        { 'items.productName': searchRegex },
        { 'items.serialNumbers': searchRegex },
      ];
    }

    const total = await ReturnRequest.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const returns = await ReturnRequest.find(query)
      .populate('customerId', 'name email')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount')
      .populate('masterOrderId', 'orderId paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const statsAgg = await ReturnRequest.aggregate([
      { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      total,
      requested: 0,
      approved: 0,
      inspection_pending: 0,
      refunded: 0,
      replacement_shipped: 0,
      rejected: 0,
    };
    statsAgg.forEach((s) => {
      if (stats[s._id] !== undefined) stats[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      returns,
      total,
      page: pageNum,
      totalPages,
      stats,
    });
  } catch (error) {
    console.error('Error fetching brand returns:', error);
    res.status(500).json({ message: 'Error retrieving brand return requests.' });
  }
};

// @desc    Approve a return request
// @route   POST /api/brand/returns/:id/approve
// @access  Private (Role: BRAND / ADMIN)
export const approveReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnWarehouseId } = req.body;

    const returnDoc = await returnService.approveReturnRequest({
      returnId: id,
      returnWarehouseId,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: `Return #${returnDoc.returnNumber} approved. Reverse pickup scheduled.`,
      returnRequest: returnDoc,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error approving return request.' });
  }
};

// @desc    Reject a return request
// @route   POST /api/brand/returns/:id/reject
// @access  Private (Role: BRAND / ADMIN)
export const rejectReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const returnDoc = await returnService.rejectReturnRequest({
      returnId: id,
      rejectionReason,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: `Return #${returnDoc.returnNumber} has been rejected.`,
      returnRequest: returnDoc,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error rejecting return request.' });
  }
};

// @desc    Mark return package received at warehouse
// @route   POST /api/brand/returns/:id/received
// @access  Private (Role: BRAND / ADMIN)
export const markReturnReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId } = req.body;

    const returnDoc = await returnService.markReturnReceived({
      returnId: id,
      warehouseId,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: 'Package marked received. Ready for hardware inspection.',
      returnRequest: returnDoc,
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error marking return received.' });
  }
};

// @desc    Execute return hardware inspection & resolution decision
// @route   POST /api/brand/returns/:id/inspect
// @access  Private (Role: BRAND / ADMIN)
export const inspectReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { inspectionData, decision } = req.body;

    const result = await returnService.submitReturnInspection({
      returnId: id,
      inspectionData: inspectionData || {},
      decision: decision || 'passed',
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: decision === 'passed' ? 'Inspection passed and resolution executed.' : 'Inspection failed. Return rejected.',
      ...result,
    });
  } catch (error) {
    console.error('Inspection error:', error);
    res.status(400).json({ message: error.message || 'Error recording inspection result.' });
  }
};

// ==========================================
// 3. ADMIN CENTRAL RETURNS CONTROLLERS
// ==========================================

// @desc    Get marketplace-wide return requests
// @route   GET /api/admin/returns
// @access  Private (Role: ADMIN)
export const getAdminReturns = async (req, res) => {
  try {
    const { search, brandId, status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (brandId && brandId !== 'all') query.brandId = brandId;
    if (status && status !== 'all') query.status = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { returnNumber: searchRegex },
        { returnId: searchRegex },
        { 'items.productName': searchRegex },
        { 'items.serialNumbers': searchRegex },
      ];
    }

    const total = await ReturnRequest.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const returns = await ReturnRequest.find(query)
      .populate('brandId', 'name slug logo')
      .populate('customerId', 'name email')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount')
      .populate('masterOrderId', 'orderId paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const statsAgg = await ReturnRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      total,
      requested: 0,
      approved: 0,
      inspection_pending: 0,
      refunded: 0,
      replacement_shipped: 0,
      rejected: 0,
    };
    statsAgg.forEach((s) => {
      if (stats[s._id] !== undefined) stats[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      returns,
      total,
      page: pageNum,
      totalPages,
      stats,
    });
  } catch (error) {
    console.error('Error fetching admin returns:', error);
    res.status(500).json({ message: 'Error retrieving return requests.' });
  }
};
