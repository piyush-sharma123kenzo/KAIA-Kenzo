import mongoose from 'mongoose';
import Shipment from '../models/Shipment.js';
import ShipmentTrackingEvent from '../models/ShipmentTrackingEvent.js';
import SellerOrder from '../models/SellerOrder.js';
import Order from '../models/Order.js';
import shippingService from '../services/shipping/shipping.service.js';

// ==========================================
// 1. BRAND SELLER SHIPPING CONTROLLERS
// ==========================================

// @desc    Get Brand's shipments list
// @route   GET /api/brand/shipments
// @access  Private (Role: BRAND, Approved)
export const getBrandShipments = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { search, status, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Strict multi-tenant brand isolation
    const query = { brandId };

    if (status && status !== 'all') {
      query.shipmentStatus = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { shipmentId: searchRegex },
        { awbNumber: searchRegex },
        { trackingNumber: searchRegex },
        { 'shippingAddress.fullName': searchRegex },
        { 'shippingAddress.city': searchRegex },
        { 'items.name': searchRegex },
      ];
    }

    const total = await Shipment.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const shipments = await Shipment.find(query)
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount subtotal')
      .populate('masterOrderId', 'orderId paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Summary counts for brand dashboard KPIs
    const statusCounts = await Shipment.aggregate([
      { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
      { $group: { _id: '$shipmentStatus', count: { $sum: 1 } } },
    ]);
    const summary = {};
    statusCounts.forEach((s) => {
      summary[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      shipments,
      total,
      page: pageNum,
      totalPages,
      summary,
      providerStatus: shippingService.getProviderStatus(),
    });
  } catch (error) {
    console.error('Error fetching brand shipments:', error);
    res.status(500).json({ message: 'Error retrieving brand shipments.' });
  }
};

// @desc    Get single shipment detail for Brand
// @route   GET /api/brand/shipments/:id
// @access  Private (Role: BRAND, Approved)
export const getBrandShipmentById = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { id } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { shipmentId: id }] } : { shipmentId: id };
    query.brandId = brandId; // IDOR Protection

    const shipment = await Shipment.findOne(query)
      .populate('sellerOrderId')
      .populate('masterOrderId', 'orderId paymentStatus createdAt')
      .populate('customerId', 'name email phone');

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found or unauthorized.' });
    }

    const events = await ShipmentTrackingEvent.find({ shipmentId: shipment._id }).sort({ eventTime: 1 });

    res.status(200).json({
      success: true,
      shipment,
      events,
    });
  } catch (error) {
    console.error('Error fetching brand shipment detail:', error);
    res.status(500).json({ message: 'Error retrieving shipment.' });
  }
};

// @desc    Create shipment for a Seller Order
// @route   POST /api/brand/shipments
// @access  Private (Role: BRAND, Approved)
export const createBrandShipment = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { sellerOrderId, package: packageInfo, courierName, awbNumber } = req.body;

    if (!sellerOrderId) {
      return res.status(400).json({ message: 'Seller Order ID is required to create a shipment.' });
    }

    const result = await shippingService.createShipmentForSellerOrder({
      sellerOrderId,
      brandId,
      packageInfo: {
        ...(packageInfo || {}),
        courierName,
        awbNumber,
      },
      userContext: req.user,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating shipment:', error.message);
    res.status(400).json({ message: error.message || 'Error creating shipment.' });
  }
};

// @desc    Generate shipping label
// @route   POST /api/brand/shipments/:id/label
// @access  Private (Role: BRAND, Approved)
export const generateBrandLabel = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { id } = req.params;

    const result = await shippingService.generateShippingLabel({
      shipmentId: id,
      brandId,
      userContext: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error generating label:', error.message);
    res.status(400).json({ message: error.message || 'Error generating label.' });
  }
};

// @desc    Schedule courier pickup
// @route   POST /api/brand/shipments/:id/pickup
// @access  Private (Role: BRAND, Approved)
export const scheduleBrandPickup = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { id } = req.params;
    const { pickupDate } = req.body;

    const result = await shippingService.scheduleCourierPickup({
      shipmentId: id,
      brandId,
      pickupDate,
      userContext: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error scheduling pickup:', error.message);
    res.status(400).json({ message: error.message || 'Error scheduling pickup.' });
  }
};

// @desc    Update shipment status (Dispatch / Transit / Delivery update)
// @route   PATCH /api/brand/shipments/:id/status
// @access  Private (Role: BRAND, Approved)
export const updateBrandShipmentStatus = async (req, res) => {
  try {
    const brandId = req.brand._id;
    const { id } = req.params;
    const { status, location, description, trackingNumber, courierName } = req.body;

    if (!status) return res.status(400).json({ message: 'New status is required.' });

    // Verify ownership
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { shipmentId: id }] } : { shipmentId: id };
    query.brandId = brandId;

    const existing = await Shipment.findOne(query);
    if (!existing) return res.status(404).json({ message: 'Shipment not found or unauthorized.' });

    const result = await shippingService.updateShipmentStatus({
      shipmentId: existing._id,
      newStatus: status,
      location,
      description,
      trackingNumber,
      courierName,
      userContext: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating shipment status:', error.message);
    res.status(400).json({ message: error.message || 'Error updating status.' });
  }
};

// ==========================================
// 2. ADMIN CENTRAL SHIPPING CONTROLLERS
// ==========================================

// @desc    Get all marketplace shipments
// @route   GET /api/admin/shipments
// @access  Private (Role: ADMIN)
export const getAdminShipments = async (req, res) => {
  try {
    const { search, status, brandId, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status && status !== 'all') query.shipmentStatus = status;
    if (brandId && brandId !== 'all') query.brandId = brandId;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { shipmentId: searchRegex },
        { awbNumber: searchRegex },
        { trackingNumber: searchRegex },
        { 'shippingAddress.fullName': searchRegex },
        { 'items.name': searchRegex },
      ];
    }

    const total = await Shipment.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const shipments = await Shipment.find(query)
      .populate('brandId', 'name slug logo')
      .populate('masterOrderId', 'orderId paymentStatus createdAt')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // KPI Metrics calculation
    const [inTransit, outForDelivery, delivered, failedDelivery, returned] = await Promise.all([
      Shipment.countDocuments({ shipmentStatus: 'in_transit' }),
      Shipment.countDocuments({ shipmentStatus: 'out_for_delivery' }),
      Shipment.countDocuments({ shipmentStatus: 'delivered' }),
      Shipment.countDocuments({ shipmentStatus: 'failed_delivery' }),
      Shipment.countDocuments({ shipmentStatus: 'returned' }),
    ]);

    res.status(200).json({
      success: true,
      shipments,
      total,
      page: pageNum,
      totalPages,
      stats: {
        total,
        inTransit,
        outForDelivery,
        delivered,
        failedDelivery,
        returned,
      },
    });
  } catch (error) {
    console.error('Error fetching admin shipments:', error);
    res.status(500).json({ message: 'Error retrieving shipments.' });
  }
};

// @desc    Get single shipment detail for Admin
// @route   GET /api/admin/shipments/:id
// @access  Private (Role: ADMIN)
export const getAdminShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { shipmentId: id }] } : { shipmentId: id };

    const shipment = await Shipment.findOne(query)
      .populate('brandId', 'name slug logo contactEmail contactPhone warehouseAddress')
      .populate('masterOrderId')
      .populate('sellerOrderId')
      .populate('customerId', 'name email phone');

    if (!shipment) return res.status(404).json({ message: 'Shipment not found.' });

    const events = await ShipmentTrackingEvent.find({ shipmentId: shipment._id }).sort({ eventTime: 1 });

    res.status(200).json({
      success: true,
      shipment,
      events,
    });
  } catch (error) {
    console.error('Error fetching single admin shipment:', error);
    res.status(500).json({ message: 'Error retrieving shipment.' });
  }
};

// ==========================================
// 3. CUSTOMER TRACKING CONTROLLERS
// ==========================================

// @desc    Get all shipments for a Customer Master Order
// @route   GET /api/orders/:orderId/shipments
// @access  Private (Customer / Admin)
export const getCustomerOrderShipments = async (req, res) => {
  try {
    const { orderId } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const orderQuery = isObjectId ? { $or: [{ _id: orderId }, { orderId }] } : { orderId };

    const masterOrder = await Order.findOne(orderQuery);
    if (!masterOrder) return res.status(404).json({ message: 'Order not found.' });

    // Authorization check
    if (masterOrder.customer.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized to access shipments for this order.' });
    }

    const shipments = await Shipment.find({ masterOrderId: masterOrder._id })
      .populate('brandId', 'name slug logo')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount')
      .sort({ createdAt: -1 });

    // For each shipment, also get latest tracking event
    const shipmentsWithEvents = await Promise.all(
      shipments.map(async (shipment) => {
        const events = await ShipmentTrackingEvent.find({ shipmentId: shipment._id }).sort({ eventTime: 1 });
        return {
          ...shipment.toObject(),
          events,
        };
      })
    );

    res.status(200).json({
      success: true,
      orderId: masterOrder.orderId,
      shipments: shipmentsWithEvents,
    });
  } catch (error) {
    console.error('Error fetching customer order shipments:', error);
    res.status(500).json({ message: 'Error fetching order shipments.' });
  }
};

// @desc    Get tracking timeline for a specific shipment
// @route   GET /api/shipments/:shipmentId/tracking
// @access  Private (Customer / Brand / Admin)
export const getShipmentTrackingDetails = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const result = await shippingService.getShipmentTracking(shipmentId, req.user);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching tracking detail:', error.message);
    res.status(400).json({ message: error.message || 'Error retrieving tracking details.' });
  }
};

// ==========================================
// 4. RATES & WEBHOOK CONTROLLERS
// ==========================================

// @desc    Get shipping rate estimates
// @route   POST /api/shipping/rates
// @access  Public / Authenticated
export const getShippingRates = async (req, res) => {
  try {
    const { pickupPincode, deliveryPincode, weight = 1 } = req.body;
    if (!pickupPincode || !deliveryPincode) {
      return res.status(400).json({ message: 'Pickup and delivery postal codes are required.' });
    }

    const result = await shippingService.adapter.getShippingRates({
      pickupPincode,
      deliveryPincode,
      weight,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating shipping rates.' });
  }
};

// @desc    Ingest Shipping Webhook (Shiprocket / Carrier)
// @route   POST /api/shipping/webhook
// @access  Public (Webhook Signature Verified)
export const handleShippingWebhook = async (req, res) => {
  try {
    const result = await shippingService.processShippingWebhook({
      payload: req.body,
      headers: req.headers,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed.' });
  }
};

// @desc    Check PIN code serviceability and delivery timeline
// @route   POST /api/shipping/check-pincode
// @access  Public
export const checkPincodeServiceability = async (req, res) => {
  try {
    const { pincode } = req.body;
    if (!pincode || !/^\d{6}$/.test(pincode.toString().trim())) {
      return res.status(400).json({
        success: false,
        serviceable: false,
        message: 'Please enter a valid 6-digit Indian PIN code.',
      });
    }

    const pin = pincode.toString().trim();
    // Deterministic delivery estimation based on postal zone
    const isMetro = ['11', '12', '40', '56', '60', '70', '50'].some((prefix) => pin.startsWith(prefix));
    const estimatedDays = isMetro ? '2 - 3 business days' : '4 - 6 business days';

    res.status(200).json({
      success: true,
      serviceable: true,
      pincode: pin,
      estimatedDays,
      carrier: 'KAIA Express / Blue Dart Logistics',
      codAvailable: true,
      message: `Delivery available in ${estimatedDays}.`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking PIN code serviceability.' });
  }
};

