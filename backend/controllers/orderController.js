import mongoose from 'mongoose';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import SerialNumber from '../models/SerialNumber.js';
import Warranty from '../models/Warranty.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import invoiceService from '../services/invoice/invoice.service.js';

/**
 * Helper: Derive the Master Order status from its child SellerOrders.
 */
export const deriveMasterOrderStatus = async (masterOrderId) => {
  try {
    const order = await Order.findById(masterOrderId).populate('childOrders');
    if (!order) return;

    let childOrders = order.childOrders || [];
    if (childOrders.length === 0) {
      childOrders = await SellerOrder.find({ parentOrder: masterOrderId });
      if (childOrders.length > 0) {
        order.childOrders = childOrders.map((c) => c._id);
      }
    }

    if (childOrders.length === 0) return;

    if (order.paymentStatus !== 'Paid') {
      order.orderStatus = 'pending_payment';
      await order.save();
      return order.orderStatus;
    }

    const statuses = childOrders.map((so) => so.fulfillmentStatus);
    const allCancelled = statuses.every((s) => s === 'Cancelled');
    const allDelivered = statuses.every((s) => s === 'Delivered');
    const allShipped = statuses.every((s) => s === 'Shipped');
    const anyShippedOrOut = statuses.some((s) => s === 'Shipped' || s === 'Out for Delivery' || s === 'Delivered');
    const anyCancelled = statuses.some((s) => s === 'Cancelled');

    let newStatus = 'processing';

    if (allCancelled) {
      newStatus = 'cancelled';
    } else if (allDelivered) {
      newStatus = 'delivered';
    } else if (allShipped) {
      newStatus = 'shipped';
    } else if (anyShippedOrOut) {
      newStatus = 'partially_shipped';
    } else if (anyCancelled) {
      newStatus = 'partially_cancelled';
    } else {
      newStatus = 'processing';
    }

    order.orderStatus = newStatus;
    await order.save();
    return newStatus;
  } catch (err) {
    console.error('Error deriving master order status:', err);
  }
};

// @desc    Initiate multi-brand order checkout & reserve stock
// @route   POST /api/orders/checkout
// @access  Private (Customer)
export const initiateCheckout = async (req, res) => {
  const { shippingAddress, billingAddress, gstNumber, couponCode } = req.body;

  const recipientName = (shippingAddress?.fullName || shippingAddress?.name || '').trim();
  const addressStreet = (shippingAddress?.addressLine1 || shippingAddress?.street || '').trim();

  if (!shippingAddress || !recipientName || !addressStreet || !shippingAddress.city || !shippingAddress.postalCode) {
    return res.status(400).json({ message: 'Complete shipping address (Name, Street/Address, City, PIN code) is required.' });
  }

  // Normalize complete address snapshot
  const normalizedShippingAddress = {
    name: recipientName,
    fullName: recipientName,
    phone: (shippingAddress.phone || req.user.phone || '').trim(),
    street: addressStreet,
    addressLine1: addressStreet,
    addressLine2: (shippingAddress.addressLine2 || '').trim(),
    landmark: (shippingAddress.landmark || '').trim(),
    city: (shippingAddress.city || '').trim(),
    state: (shippingAddress.state || '').trim(),
    postalCode: (shippingAddress.postalCode || '').trim(),
    country: (shippingAddress.country || 'India').trim(),
    latitude: shippingAddress.latitude ? Number(shippingAddress.latitude) : null,
    longitude: shippingAddress.longitude ? Number(shippingAddress.longitude) : null,
    type: shippingAddress.type || shippingAddress.label || 'Home',
  };

  try {
    // 1. Fetch user's cart from database
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your shopping cart is empty.' });
    }

    // 2. Re-fetch all products directly from DB to validate authoritative prices, stock, and active status
    const productIds = cart.items.map((it) => it.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).populate('brand category');
    const productMap = {};
    dbProducts.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    // Validate each cart item
    for (let it of cart.items) {
      const p = productMap[it.product.toString()];
      if (!p || !p.isActive || p.status !== 'Approved') {
        return res.status(400).json({
          message: `Product "${p?.name || 'Item'}" is currently unavailable or inactive.`,
        });
      }

      const availableStock = Math.max(0, p.stock.quantity - (p.stock.reservedQuantity || 0));
      if (availableStock < it.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${p.name}". Available: ${availableStock}, Requested: ${it.quantity}.`,
        });
      }
    }

    // 3. Calculate Authoritative Financials
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    let shippingAmount = 0;

    // Group items by Brand for multi-brand seller order splitting
    const itemsByBrand = {};
    const masterSnapshotItems = [];

    for (let it of cart.items) {
      const p = productMap[it.product.toString()];
      const price = p.sellingPrice;
      const qty = it.quantity;
      const gstRate = p.gstRate || 18.0;

      const itemTotal = price * qty;
      const itemGst = Math.round(itemTotal * (gstRate / (100 + gstRate)));
      const itemSubtotal = itemTotal - itemGst;

      calculatedSubtotal += itemSubtotal;
      calculatedTax += itemGst;

      const brandId = p.brand._id.toString();
      const brandName = p.brand.name || 'Authorized Brand';

      const snapshotItem = {
        product: p._id,
        productName: p.name,
        brand: p.brand._id,
        brandName,
        sku: p.SKU || p.modelNumber || '',
        quantity: qty,
        unitPrice: price,
        discount: 0,
        tax: itemGst,
        lineTotal: itemTotal,
        image: p.images?.[0]?.url || '',
      };

      masterSnapshotItems.push(snapshotItem);

      if (!itemsByBrand[brandId]) {
        itemsByBrand[brandId] = {
          brand: p.brand,
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
        };
      }

      itemsByBrand[brandId].items.push({
        product: p._id,
        name: p.name,
        sku: p.SKU || p.modelNumber || '',
        price,
        unitPrice: price,
        qty,
        quantity: qty,
        gstRate,
        tax: itemGst,
        discount: 0,
        lineTotal: itemTotal,
        image: p.images?.[0]?.url || '',
        serialNumbers: [],
      });

      itemsByBrand[brandId].subtotal += itemSubtotal;
      itemsByBrand[brandId].tax += itemGst;
      itemsByBrand[brandId].total += itemTotal;
    }

    // Free shipping above ₹5,000, else ₹150
    const totalBeforeShipping = calculatedSubtotal + calculatedTax;
    if (totalBeforeShipping < 5000) {
      shippingAmount = 150;
    }

    // 4. Validate and Apply Coupon
    let discountAmount = 0;
    let appliedCoupon = { code: '', discountValue: 0 };

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const codeClean = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: codeClean, isActive: true });

      if (!coupon) {
        return res.status(400).json({ message: 'Invalid or expired coupon code.' });
      }
      if (new Date() > coupon.expiryDate) {
        return res.status(400).json({ message: 'This coupon code has expired.' });
      }
      if (totalBeforeShipping < coupon.minOrderAmount) {
        return res.status(400).json({
          message: `Minimum order amount of ₹${coupon.minOrderAmount} required for coupon ${codeClean}.`,
        });
      }

      if (coupon.type === 'PERCENTAGE') {
        discountAmount = (totalBeforeShipping * coupon.value) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else if (coupon.type === 'FIXED') {
        discountAmount = coupon.value;
      }

      appliedCoupon = {
        code: coupon.code,
        discountValue: Math.round(discountAmount),
      };
    }

    const finalAmount = Math.max(0, Math.round(totalBeforeShipping + shippingAmount - discountAmount));

    // 5. Generate Unique Human-Readable Identifiers
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const parentOrderId = `KAIA-ORD-${dateStr}-${randNum}`;

    // 6. Create Master Order Draft
    const masterOrder = new Order({
      orderId: parentOrderId,
      customer: req.user._id,
      items: masterSnapshotItems,
      shippingAddress: normalizedShippingAddress,
      billingAddress: billingAddress ? {
        name: billingAddress.fullName || billingAddress.name || normalizedShippingAddress.name,
        fullName: billingAddress.fullName || billingAddress.name || normalizedShippingAddress.fullName,
        phone: billingAddress.phone || normalizedShippingAddress.phone,
        street: billingAddress.addressLine1 || billingAddress.street || normalizedShippingAddress.street,
        addressLine1: billingAddress.addressLine1 || billingAddress.street || normalizedShippingAddress.addressLine1,
        addressLine2: billingAddress.addressLine2 || '',
        landmark: billingAddress.landmark || '',
        city: billingAddress.city || normalizedShippingAddress.city,
        state: billingAddress.state || normalizedShippingAddress.state,
        postalCode: billingAddress.postalCode || normalizedShippingAddress.postalCode,
        country: billingAddress.country || 'India',
      } : normalizedShippingAddress,
      gstNumber: gstNumber ? gstNumber.toUpperCase() : '',
      subtotal: Math.round(calculatedSubtotal),
      taxAmount: Math.round(calculatedTax),
      shippingAmount,
      discountAmount: Math.round(discountAmount),
      finalAmount,
      currency: 'INR',
      couponApplied: appliedCoupon,
      paymentStatus: 'Pending',
      orderStatus: 'pending_payment',
      childOrders: [],
    });

    await masterOrder.save();

    // 7. Create 1 SellerOrder per Brand (Multi-Brand Splitting)
    const brandIds = Object.keys(itemsByBrand);
    const childOrderIds = [];
    let brandCounter = 1;

    for (let brandId of brandIds) {
      const brandGroup = itemsByBrand[brandId];
      const brandSlug = brandGroup.brand.slug ? brandGroup.brand.slug.substring(0, 4).toUpperCase() : `BR${brandCounter}`;
      const sellerOrderId = `SO-${brandSlug}-${dateStr}-${randNum}`;
      brandCounter++;

      // Commission snapshot rate determination
      let commissionRate = 5.0; // standard default
      if (brandGroup.brand.commissionOverride !== null && brandGroup.brand.commissionOverride !== undefined) {
        commissionRate = brandGroup.brand.commissionOverride;
      }

      // Proportional discount and shipping allocation per brand
      const brandShareFraction = brandGroup.total / (totalBeforeShipping || 1);
      const brandDiscountAllocation = Math.round(discountAmount * brandShareFraction);
      const brandShippingAllocation = shippingAmount > 0 ? Math.round(shippingAmount / brandIds.length) : 0;
      const brandCommissionAmount = Math.round((brandGroup.total) * (commissionRate / 100));
      const brandFinalAmount = Math.round(brandGroup.total + brandShippingAllocation - brandDiscountAllocation);

      const sellerOrder = await SellerOrder.create({
        parentOrder: masterOrder._id,
        orderId: sellerOrderId,
        seller: brandId,
        sellerId: brandGroup.brand.owner || null,
        items: brandGroup.items,
        subtotal: Math.round(brandGroup.subtotal),
        gstAmount: Math.round(brandGroup.tax),
        taxAllocation: Math.round(brandGroup.tax),
        shippingAmount: brandShippingAllocation,
        shippingAllocation: brandShippingAllocation,
        discountAllocation: brandDiscountAllocation,
        commissionRate,
        commissionAmount: brandCommissionAmount,
        finalAmount: brandFinalAmount,
        paymentStatus: 'Pending',
        fulfillmentStatus: 'Processing',
        shippingAddress: normalizedShippingAddress,
        logistics: {
          provider: 'KAIA Logistics Express',
          courierName: 'Blue Dart Express',
        },
        invoiceNumber: `INV-${dateStr}-${randNum}-${brandCounter}`,
      });

      childOrderIds.push(sellerOrder._id);

      // Audit Log for Seller Order
      await AuditLog.create({
        user: req.user._id,
        action: 'SELLER_ORDER_CREATED',
        entity: 'SellerOrder',
        entityId: sellerOrder._id,
        changes: {
          sellerOrderId: sellerOrder.orderId,
          masterOrderId: masterOrder.orderId,
          brand: brandGroup.brand.name,
          finalAmount: brandFinalAmount,
        },
      });
    }

    // Link child orders to master order
    masterOrder.childOrders = childOrderIds;
    await masterOrder.save();

    // 8. Atomic reservation of inventory stock
    for (let it of cart.items) {
      await Product.findByIdAndUpdate(it.product, {
        $inc: { 'stock.reservedQuantity': it.quantity },
      });
    }

    // 9. Master Order Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'ORDER_CREATED',
      entity: 'Order',
      entityId: masterOrder._id,
      changes: {
        orderId: masterOrder.orderId,
        finalAmount,
        brandsCount: brandIds.length,
      },
    });

    // 10. Return checkout confirmation payload
    res.status(201).json({
      success: true,
      order: masterOrder,
      gatewayConfig: {
        amount: finalAmount * 100, // paise
        currency: 'INR',
        merchantName: 'KAIA Technologies',
        orderReference: parentOrderId,
      },
    });
  } catch (error) {
    console.error('Checkout initialization error:', error);
    res.status(500).json({ message: 'Server error during checkout initiation.' });
  }
};

// @desc    Get customer orders with multi-brand split details
// @route   GET /api/orders or /api/orders/customer/my-orders
// @access  Private (Customer)
export const getMyOrders = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query = { customer: req.user._id };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderId: searchRegex },
        { 'items.productName': searchRegex },
        { 'items.brandName': searchRegex },
      ];
    }

    if (status && status !== 'all') {
      if (status === 'paid') query.paymentStatus = 'Paid';
      else if (status === 'active') query.orderStatus = { $in: ['processing', 'partially_shipped', 'shipped', 'paid'] };
      else if (status === 'delivered') query.orderStatus = 'delivered';
      else if (status === 'cancelled') query.orderStatus = { $in: ['cancelled', 'partially_cancelled'] };
      else query.orderStatus = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate({
        path: 'childOrders',
        populate: { path: 'seller', select: 'name slug logo contactEmail' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      orders,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Server error fetching customer orders.' });
  }
};

// @desc    Get single order details by ID (Customer / Admin)
// @route   GET /api/orders/:orderId
// @access  Private
export const getOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const query = isObjectId ? { $or: [{ _id: orderId }, { orderId }] } : { orderId };

    const order = await Order.findOne(query)
      .populate({
        path: 'childOrders',
        populate: { path: 'seller', select: 'name slug logo contactEmail website' },
      })
      .populate('customer', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Security Authorization: Customer can only view their own order, Admin can view all
    const isOwner = order.customer && order.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Server error fetching order details.' });
  }
};

// @desc    Cancel an order before dispatch (Customer / Admin)
// @route   PUT /api/orders/:orderId/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const { reason = 'Cancelled by customer request' } = req.body;

  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const query = isObjectId ? { $or: [{ _id: orderId }, { orderId }] } : { orderId };

    const order = await Order.findOne(query).populate('childOrders');
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const isOwner = order.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to cancel this order.' });
    }

    // Check if order has already shipped or delivered
    const anyShipped = order.childOrders.some((so) => so.fulfillmentStatus === 'Shipped' || so.fulfillmentStatus === 'Delivered');
    if (anyShipped && !isAdmin) {
      return res.status(400).json({ message: 'Cannot cancel an order that is already shipped or delivered.' });
    }

    // 1. Update Master Order
    order.orderStatus = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    await order.save();

    // 2. Update Child Seller Orders and Release Reserved Stock
    for (let so of order.childOrders) {
      const childDoc = await SellerOrder.findById(so._id);
      if (childDoc && childDoc.fulfillmentStatus !== 'Delivered') {
        childDoc.fulfillmentStatus = 'Cancelled';
        childDoc.cancellationReason = reason;
        childDoc.cancelledAt = new Date();
        await childDoc.save();

        // Release reserved stock back to available
        for (let item of childDoc.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { 'stock.reservedQuantity': -item.qty },
          });
        }
      }
    }

    // 3. Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'ORDER_CANCELLED',
      entity: 'Order',
      entityId: order._id,
      changes: { orderId: order.orderId, reason },
    });

    // 4. Notifications
    await Notification.create({
      user: order.customer,
      title: 'Order Cancelled',
      message: `Your order ${order.orderId} has been cancelled.`,
      type: 'Order',
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully. Reserved inventory has been released.',
      order,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error during order cancellation.' });
  }
};

// Legacy seller order helpers (for backwards compatibility with existing direct routes)
export const getSellerOrders = async (req, res) => {
  try {
    const orders = await SellerOrder.find({ seller: req.user.brand })
      .populate('parentOrder', 'shippingAddress paymentStatus orderStatus customer')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seller orders.' });
  }
};

export const getSellerOrderDetails = async (req, res) => {
  const { childOrderId } = req.params;
  try {
    const order = await SellerOrder.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(childOrderId) ? childOrderId : null }, { orderId: childOrderId }],
      seller: req.user.brand,
    }).populate('parentOrder');

    if (!order) return res.status(404).json({ message: 'Seller order not found.' });
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details.' });
  }
};

export const fulfillSellerOrder = async (req, res) => {
  const { childOrderId } = req.params;
  const { itemsFulfillment } = req.body;

  try {
    const sellerOrder = await SellerOrder.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(childOrderId) ? childOrderId : null }, { orderId: childOrderId }],
      seller: req.user.brand,
    });

    if (!sellerOrder) return res.status(404).json({ message: 'Seller order not found.' });

    // Assign serials
    if (itemsFulfillment && Array.isArray(itemsFulfillment)) {
      itemsFulfillment.forEach((ful) => {
        const targetItem = sellerOrder.items.find((i) => i.product.toString() === ful.product.toString());
        if (targetItem) {
          targetItem.serialNumbers = ful.serials;
        }
      });
    }

    sellerOrder.fulfillmentStatus = 'Packed';
    await sellerOrder.save();

    // Re-derive master status
    await deriveMasterOrderStatus(sellerOrder.parentOrder);

    res.status(200).json({ success: true, message: 'Order packed and serials assigned.', sellerOrder });
  } catch (error) {
    res.status(500).json({ message: 'Error fulfilling seller order.' });
  }
};

export const updateFulfillmentStatus = async (req, res) => {
  const { childOrderId } = req.params;
  const { status } = req.body;

  try {
    const sellerOrder = await SellerOrder.findOne({
      $or: [{ _id: mongoose.Types.ObjectId.isValid(childOrderId) ? childOrderId : null }, { orderId: childOrderId }],
      seller: req.user.brand,
    });

    if (!sellerOrder) return res.status(404).json({ message: 'Seller order not found.' });

    sellerOrder.fulfillmentStatus = status;
    await sellerOrder.save();

    // Re-derive master order status
    await deriveMasterOrderStatus(sellerOrder.parentOrder);

    res.status(200).json({ success: true, message: `Status updated to ${status}.`, sellerOrder });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status.' });
  }
};

export const downloadInvoice = async (req, res) => {
  const { childOrderId } = req.params;
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(childOrderId);
    const query = isObjectId ? { $or: [{ _id: childOrderId }, { orderId: childOrderId }] } : { orderId: childOrderId };

    const sellerOrder = await SellerOrder.findOne(query).populate('seller parentOrder');
    if (!sellerOrder) return res.status(404).json({ message: 'Invoice order not found.' });

    // Generate or get existing invoice
    const result = await invoiceService.generateInvoiceForSellerOrder({
      sellerOrderId: sellerOrder._id,
      userContext: req.user,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.invoice.invoiceNumber}.pdf"`
    );

    invoiceService.renderInvoicePdfStream(result.invoice, res);
  } catch (error) {
    console.error('Invoice error:', error);
    res.status(500).json({ message: error.message || 'Error generating invoice.' });
  }
};
