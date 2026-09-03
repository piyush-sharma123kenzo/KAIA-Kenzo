import Warranty from '../models/Warranty.js';
import SerialNumber from '../models/SerialNumber.js';
import Product from '../models/Product.js';

// @desc    Get current user warranties
// @route   GET /api/warranties
// @access  Private
export const getUserWarranties = async (req, res) => {
  try {
    const warranties = await Warranty.find({ customer: req.user._id })
      .populate('product', 'name SKU modelNumber images')
      .populate('brand', 'name slug logo')
      .populate('orderId', 'orderId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, warranties });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching warranty records.' });
  }
};

// @desc    Log a warranty claim request
// @route   POST /api/warranties/:id/claim
// @access  Private
export const claimWarranty = async (req, res) => {
  const { id } = req.params;

  try {
    const warranty = await Warranty.findOne({ _id: id, customer: req.user._id });

    if (!warranty) {
      return res.status(404).json({ message: 'Warranty record not found.' });
    }

    if (warranty.status === 'Claimed') {
      return res.status(400).json({ message: 'Warranty claim already filed and under review.' });
    }

    if (new Date() > warranty.endDate) {
      warranty.status = 'Expired';
      await warranty.save();
      return res.status(400).json({ message: 'This product warranty has expired.' });
    }

    warranty.status = 'Claimed';
    await warranty.save();

    res.status(200).json({
      success: true,
      message: 'Warranty claim request submitted successfully. Support team will contact you.',
      warranty,
    });
  } catch (error) {
    console.error('Error claiming warranty:', error);
    res.status(500).json({ message: 'Server error processing warranty claim.' });
  }
};

// @desc    Public verification of warranty by Serial Number / IMEI
// @route   GET /api/warranties/verify
// @access  Public
export const verifyPublicWarranty = async (req, res) => {
  try {
    const { serialNumber } = req.query;

    if (!serialNumber || !serialNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Serial Number or IMEI.',
      });
    }

    const cleanSerial = serialNumber.trim().toUpperCase();

    // 1. Search in Warranty database
    const warranty = await Warranty.findOne({
      $or: [
        { serialNumber: cleanSerial },
        { imei1: cleanSerial },
      ],
    })
      .populate('product', 'name SKU modelNumber images category')
      .populate('brand', 'name slug logo');

    if (warranty) {
      const now = new Date();
      let computedStatus = warranty.status;
      if (now > warranty.endDate && computedStatus !== 'Void') {
        computedStatus = 'Expired';
      }

      return res.status(200).json({
        success: true,
        found: true,
        data: {
          productName: warranty.product?.name || 'Hardware Unit',
          productImage: warranty.product?.images?.[0] || null,
          sku: warranty.product?.SKU || '',
          brandName: warranty.brand?.name || 'Authorized Manufacturer',
          brandLogo: warranty.brand?.logo || null,
          serialNumber: warranty.serialNumber,
          warrantyMonths: warranty.warrantyMonths || 12,
          startDate: warranty.startDate,
          endDate: warranty.endDate,
          status: computedStatus,
          terms: warranty.terms || 'Standard OEM limited manufacturer coverage against manufacturing defects.',
        },
      });
    }

    // 2. Fallback check in SerialNumber ledger (e.g., inventory units)
    const serialRecord = await SerialNumber.findOne({ serialNumber: cleanSerial })
      .populate('productId', 'name SKU modelNumber images warranty')
      .populate('brandId', 'name slug logo');

    if (serialRecord) {
      const warrantyMonths = serialRecord.productId?.warranty || 12;
      return res.status(200).json({
        success: true,
        found: true,
        data: {
          productName: serialRecord.productId?.name || 'Hardware Unit',
          productImage: serialRecord.productId?.images?.[0] || null,
          sku: serialRecord.productId?.SKU || '',
          brandName: serialRecord.brandId?.name || 'Authorized Manufacturer',
          brandLogo: serialRecord.brandId?.logo || null,
          serialNumber: serialRecord.serialNumber,
          warrantyMonths: warrantyMonths,
          startDate: serialRecord.createdAt,
          endDate: new Date(new Date(serialRecord.createdAt).getTime() + warrantyMonths * 30 * 24 * 60 * 60 * 1000),
          status: serialRecord.status === 'SOLD' ? 'Active' : 'Unactivated Inventory',
          terms: 'Official brand serialized hardware registry verified.',
        },
      });
    }

    // 3. Not found in verified registry
    return res.status(200).json({
      success: true,
      found: false,
      message: `No active warranty or serialized hardware record was found matching serial number "${cleanSerial}".`,
    });
  } catch (error) {
    console.error('[Public Warranty Verification Error]:', error);
    res.status(500).json({ success: false, message: 'Server error during warranty verification.' });
  }
};
