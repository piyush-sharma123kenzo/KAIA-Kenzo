import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import invoiceService from '../services/invoice/invoice.service.js';
import AuditLog from '../models/AuditLog.js';

// ==========================================
// 1. CUSTOMER & ORDER INVOICES
// ==========================================

// @desc    Get all brand invoices for a Master Order
// @route   GET /api/orders/:orderId/invoices
// @access  Private (Customer / Admin)
export const getOrderInvoices = async (req, res) => {
  try {
    const { orderId } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const orderQuery = isObjectId ? { $or: [{ _id: orderId }, { orderId }] } : { orderId };

    const masterOrder = await Order.findOne(orderQuery).populate('childOrders');
    if (!masterOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (masterOrder.customer.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized to access invoices for this order.' });
    }

    // Auto-generate invoice for each paid seller order if missing
    if (masterOrder.paymentStatus === 'Paid' && masterOrder.childOrders) {
      for (let child of masterOrder.childOrders) {
        try {
          await invoiceService.generateInvoiceForSellerOrder({
            sellerOrderId: child._id,
            userContext: req.user,
          });
        } catch (e) {
          // Log but continue
        }
      }
    }

    const invoices = await Invoice.find({ masterOrderId: masterOrder._id })
      .populate('brandId', 'name slug logo')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orderId: masterOrder.orderId,
      invoices,
    });
  } catch (error) {
    console.error('Error fetching order invoices:', error);
    res.status(500).json({ message: 'Error retrieving invoices.' });
  }
};

// @desc    Get single invoice detail
// @route   GET /api/invoices/:invoiceId
// @access  Private (Customer / Brand / Admin)
export const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await invoiceService.getInvoiceById({ invoiceId, user: req.user });
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error retrieving invoice.' });
  }
};

// @desc    Download official Invoice PDF stream
// @route   GET /api/invoices/:invoiceId/download
// @access  Private (Customer / Brand / Admin)
export const downloadInvoicePdf = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await invoiceService.getInvoiceById({ invoiceId, user: req.user });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );

    invoiceService.renderInvoicePdfStream(invoice, res);

    await AuditLog.create({
      user: req.user._id,
      brand: invoice.brandId,
      action: 'INVOICE_DOWNLOADED',
      entity: 'Invoice',
      entityId: invoice._id,
      changes: { invoiceNumber: invoice.invoiceNumber },
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error downloading invoice PDF.' });
  }
};

// ==========================================
// 2. BRAND SELLER INVOICES
// ==========================================

// @desc    Get Brand Invoices list
// @route   GET /api/brand/invoices
// @access  Private (Role: BRAND)
export const getBrandInvoices = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { search, status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = { brandId };
    if (status && status !== 'all') query.invoiceStatus = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { invoiceNumber: searchRegex },
        { 'customerDetails.customerName': searchRegex },
        { 'customerDetails.customerGSTIN': searchRegex },
      ];
    }

    const total = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const invoices = await Invoice.find(query)
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount')
      .populate('masterOrderId', 'orderId paymentStatus createdAt')
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Brand Tax Totals
    const taxSummaryAgg = await Invoice.aggregate([
      { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalTaxable: { $sum: '$taxableAmount' },
          totalCgst: { $sum: '$cgst' },
          totalSgst: { $sum: '$sgst' },
          totalIgst: { $sum: '$igst' },
        },
      },
    ]);

    const taxSummary = taxSummaryAgg[0] || {
      totalSales: 0,
      totalTaxable: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
    };

    res.status(200).json({
      success: true,
      invoices,
      total,
      page: pageNum,
      totalPages,
      taxSummary,
    });
  } catch (error) {
    console.error('Error fetching brand invoices:', error);
    res.status(500).json({ message: 'Error retrieving brand invoices.' });
  }
};

// ==========================================
// 3. ADMIN CENTRAL INVOICES & TAX REPORTING
// ==========================================

// @desc    Get Marketplace-wide Invoices
// @route   GET /api/admin/invoices
// @access  Private (Role: ADMIN)
export const getAdminInvoices = async (req, res) => {
  try {
    const { search, brandId, status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (brandId && brandId !== 'all') query.brandId = brandId;
    if (status && status !== 'all') query.invoiceStatus = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { invoiceNumber: searchRegex },
        { 'customerDetails.customerName': searchRegex },
        { 'sellerDetails.brandName': searchRegex },
        { 'sellerDetails.gstin': searchRegex },
      ];
    }

    const total = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const invoices = await Invoice.find(query)
      .populate('brandId', 'name slug logo')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount')
      .populate('masterOrderId', 'orderId paymentStatus createdAt')
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const taxAgg = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTaxable: { $sum: '$taxableAmount' },
          totalCgst: { $sum: '$cgst' },
          totalSgst: { $sum: '$sgst' },
          totalIgst: { $sum: '$igst' },
        },
      },
    ]);

    const stats = taxAgg[0] || {
      totalRevenue: 0,
      totalTaxable: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
    };

    res.status(200).json({
      success: true,
      invoices,
      total,
      page: pageNum,
      totalPages,
      stats,
    });
  } catch (error) {
    console.error('Error fetching admin invoices:', error);
    res.status(500).json({ message: 'Error retrieving invoices.' });
  }
};
