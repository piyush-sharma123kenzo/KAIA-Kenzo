import mongoose from 'mongoose';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';
import SerialNumber from '../models/SerialNumber.js';
import Warranty from '../models/Warranty.js';
import { generateInvoicePDF } from '../services/invoiceService.js';

// @desc    Initiate order checkout & reserve stock
// @route   POST /api/orders/checkout
// @access  Private
export const initiateCheckout = async (req, res) => {
  const { shippingAddress, billingAddress, gstNumber, couponCode } = req.body;

  try {
    // 1. Fetch user's cart items
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      populate: { path: 'brand category' },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // 2. Validate stock availability for all items first
    for (let item of cart.items) {
      const product = item.product;
      const requestedQty = item.quantity;
      const availableStock = product.stock.quantity - product.stock.reservedQuantity;

      if (availableStock < requestedQty) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${Math.max(0, availableStock)}. Requested: ${requestedQty}`,
        });
      }
    }

    // 3. Calculate Financials
    let subtotal = 0;
    let taxAmount = 0;
    let shippingAmount = 0;

    cart.items.forEach((item) => {
      const price = item.product.sellingPrice;
      const qty = item.quantity;
      const gstRate = item.product.gstRate || 18.0;

      const itemTotal = price * qty;
      const itemGst = itemTotal * (gstRate / (100 + gstRate)); // GST inclusive math

      subtotal += itemTotal - itemGst;
      taxAmount += itemGst;
    });

    // Shipping rules: Flat ₹150, free for orders over ₹5,000
    const totalBeforeShipping = subtotal + taxAmount;
    if (totalBeforeShipping < 5000) {
      shippingAmount = 150;
    }

    // 4. Apply Coupon if applicable
    let discountAmount = 0;
    let appliedCoupon = { code: '', discountValue: 0 };

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) {
        return res.status(400).json({ message: 'Invalid or expired coupon code.' });
      }

      if (new Date() > coupon.expiryDate) {
        return res.status(400).json({ message: 'This coupon code has expired.' });
      }

      if (totalBeforeShipping < coupon.minOrderAmount) {
        return res.status(400).json({
          message: `Minimum order amount of ₹${coupon.minOrderAmount} is required for this coupon.`,
        });
      }

      if (coupon.type === 'PERCENTAGE') {
        discountAmount = totalBeforeShipping * (coupon.value / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else if (coupon.type === 'FIXED') {
        discountAmount = coupon.value;
      }

      appliedCoupon = {
        code: coupon.code,
        discountValue: discountAmount,
      };
    }

    const finalAmount = Math.max(0, Math.round(totalBeforeShipping + shippingAmount - discountAmount));

    // 5. Generate parent Order ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const parentOrderId = `KAIA-ORD-${dateStr}-${rand}`;

    // Create Parent Order draft first
    const order = new Order({
      orderId: parentOrderId,
      customer: req.user._id,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      gstNumber,
      subtotal: Math.round(subtotal),
      taxAmount: Math.round(taxAmount),
      shippingAmount,
      discountAmount: Math.round(discountAmount),
      finalAmount,
      couponApplied: appliedCoupon,
      paymentStatus: 'Pending',
    });

    // Group cart items by brand for splitting
    const itemsByBrand = {};
    cart.items.forEach((item) => {
      const brandId = item.product.brand._id.toString();
      if (!itemsByBrand[brandId]) {
        itemsByBrand[brandId] = [];
      }
      itemsByBrand[brandId].push(item);
    });

    const childOrderIds = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let brandIndex = 0;

    for (let brandId of Object.keys(itemsByBrand)) {
      const brandItems = itemsByBrand[brandId];
      const brandSuffix = alphabet[brandIndex % 26];
      brandIndex++;

      let brandSubtotal = 0;
      let brandGst = 0;

      const orderItems = brandItems.map((item) => {
        const price = item.product.sellingPrice;
        const qty = item.quantity;
        const gstRate = item.product.gstRate || 18.0;

        const itemTotal = price * qty;
        const itemGst = itemTotal * (gstRate / (100 + gstRate));

        brandSubtotal += itemTotal - itemGst;
        brandGst += itemGst;

        return {
          product: item.product._id,
          name: item.product.name,
          price,
          qty,
          gstRate,
          serialNumbers: [],
        };
      });

      // Retrieve brand info for commission overrides
      const brandObj = await Brand.findById(brandId);
      let commissionRate = 5.0; // default commission rate
      if (brandObj && brandObj.commissionOverride !== null && brandObj.commissionOverride !== undefined) {
        commissionRate = brandObj.commissionOverride;
      } else if (brandItems[0]?.product?.category) {
        // Category base commission fallback
        const categoryObj = await Category.findById(brandItems[0].product.category._id);
        if (categoryObj) {
          commissionRate = categoryObj.baseCommission;
        }
      }

      // Proportional coupon discount deduction for seller payout calculations
      const brandShareFraction = (brandSubtotal + brandGst) / (totalBeforeShipping || 1);
      const brandDiscountShare = Math.round(discountAmount * brandShareFraction);

      const commissionAmount = Math.round((brandSubtotal + brandGst) * (commissionRate / 100));
      const brandShipping = shippingAmount > 0 ? Math.round(shippingAmount / Object.keys(itemsByBrand).length) : 0;
      const brandFinal = Math.round((brandSubtotal + brandGst) + brandShipping - brandDiscountShare);

      const childOrder = await SellerOrder.create({
        parentOrder: order._id,
        orderId: `${parentOrderId}-${brandSuffix}`,
        seller: brandId,
        items: orderItems,
        subtotal: Math.round(brandSubtotal),
        gstAmount: Math.round(brandGst),
        commissionRate,
        commissionAmount,
        shippingAmount: brandShipping,
        finalAmount: brandFinal,
        fulfillmentStatus: 'Processing',
      });

      childOrderIds.push(childOrder._id);
    }

    order.childOrders = childOrderIds;
    await order.save();

    // 7. Atomic reservation of inventory stock
    for (let item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { 'stock.reservedQuantity': item.quantity },
      });
    }

    // 8. Return checkout payload (with mock gateway details)
    res.status(201).json({
      success: true,
      order,
      gatewayConfig: {
        amount: finalAmount * 100, // paisa
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

// @desc    Get order details for user
// @route   GET /api/orders/customer/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate({
        path: 'childOrders',
        populate: { path: 'seller', select: 'name slug logo' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Server error fetching orders.' });
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:orderId
// @access  Private
export const getOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findOne({ orderId })
      .populate({
        path: 'childOrders',
        populate: {
          path: 'seller items.product',
          select: 'name slug logo description modelNumber SKU images',
        },
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Protection: Client user can only see their own order, Brand can see items if authorized
    if (
      req.user.role === 'CUSTOMER' &&
      order.customer.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Server error fetching order.' });
  }
};

// @desc    Get seller received orders (child orders)
// @route   GET /api/orders/seller/my-orders
// @access  Private (Role: BRAND)
export const getSellerOrders = async (req, res) => {
  try {
    const childOrders = await SellerOrder.find({ seller: req.brand._id })
      .populate({
        path: 'parentOrder',
        select: 'shippingAddress customer gstNumber createdAt',
        populate: { path: 'customer', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders: childOrders });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({ message: 'Server error fetching brand orders.' });
  }
};

// @desc    Get single seller child order details
// @route   GET /api/orders/seller/my-orders/:childOrderId
// @access  Private (Role: BRAND)
export const getSellerOrderDetails = async (req, res) => {
  const { childOrderId } = req.params;

  try {
    const childOrder = await SellerOrder.findOne({
      orderId: childOrderId,
      seller: req.brand._id,
    }).populate({
      path: 'parentOrder',
      select: 'shippingAddress billingAddress customer gstNumber finalAmount paymentStatus',
      populate: { path: 'customer', select: 'name email phone' },
    }).populate('items.product', 'name SKU modelNumber specifications images mrp');

    if (!childOrder) {
      return res.status(404).json({ message: 'Brand order not found or unauthorized.' });
    }

    res.status(200).json({ success: true, order: childOrder });
  } catch (error) {
    console.error('Error fetching seller order details:', error);
    res.status(500).json({ message: 'Server error fetching brand order details.' });
  }
};

// @desc    Fulfill and pack seller order with serial scanning
// @route   PUT /api/orders/seller/my-orders/:childOrderId/fulfill
// @access  Private (Role: BRAND)
export const fulfillSellerOrder = async (req, res) => {
  const { childOrderId } = req.params;
  const { itemsFulfillment } = req.body; // Array: [{ product: productId, serials: ['SN1', 'SN2'] }]

  try {
    const childOrder = await SellerOrder.findOne({
      orderId: childOrderId,
      seller: req.brand._id,
    });

    if (!childOrder) {
      return res.status(404).json({ message: 'Seller order not found.' });
    }

    const parent = await Order.findById(childOrder.parentOrder);
    if (!parent || parent.paymentStatus !== 'Paid') {
      return res.status(400).json({ message: 'Fulfillment is blocked because payment is pending.' });
    }

    // Process serial mapping and validate
    for (let itemSpec of itemsFulfillment) {
      const orderItem = childOrder.items.find(
        (i) => i.product.toString() === itemSpec.product
      );

      if (!orderItem) continue;

      if (itemSpec.serials.length !== orderItem.qty) {
        return res.status(400).json({
          message: `Serial number mismatch for ${orderItem.name}. Scanned: ${itemSpec.serials.length}, Required: ${orderItem.qty}`,
        });
      }

      // Lock and assign serial numbers
      for (let serialNum of itemSpec.serials) {
        const serialDoc = await SerialNumber.findOne({
          serialNumber: serialNum,
          product: orderItem.product,
          status: 'Available',
        });

        if (!serialDoc) {
          return res.status(400).json({
            message: `Serial number ${serialNum} is not available in warehouse inventory or belongs to another product.`,
          });
        }

        serialDoc.status = 'Sold';
        serialDoc.assignedOrderId = childOrder._id;
        await serialDoc.save();

        // Update Warranty record with this serial number
        await Warranty.findOneAndUpdate(
          { orderId: childOrder._id, product: orderItem.product, serialNumber: 'PENDING_FULFILLMENT' },
          { serialNumber: serialNum, startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
        );
      }

      orderItem.serialNumbers = itemSpec.serials;
    }

    // Set mock shipping details and invoice number
    childOrder.fulfillmentStatus = 'Packed';
    childOrder.invoiceNumber = `KAIA-INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    childOrder.logistics = {
      provider: 'ShiprocketMock',
      trackingId: `KAIA-TRK-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      courierName: 'Blue Dart Express',
      labelUrl: `/mock-labels/label-${childOrderId}.pdf`,
    };

    await childOrder.save();

    // Create Notification
    await Notification.create({
      user: parent.customer,
      title: 'Order Packed & Ready',
      message: `Your items from brand ${req.brand.name} are packed. Tracking ID: ${childOrder.logistics.trackingId}.`,
      type: 'Order',
    });

    res.status(200).json({
      success: true,
      message: 'Order packed and serial scanning completed successfully.',
      order: childOrder,
    });
  } catch (error) {
    console.error('Fulfill order error:', error);
    res.status(500).json({ message: 'Error processing order fulfillment.' });
  }
};

// @desc    Download invoice PDF for a child order
// @route   GET /api/orders/:childOrderId/invoice
// @access  Private
export const downloadInvoice = async (req, res) => {
  const { childOrderId } = req.params;

  try {
    const childOrder = await SellerOrder.findOne({ orderId: childOrderId }).populate('seller');
    if (!childOrder) {
      return res.status(404).json({ message: 'Seller order details not found.' });
    }

    const parent = await Order.findById(childOrder.parentOrder);
    
    // Check permission: customer who placed order or brand owner or admin
    const isCustomer = req.user.role === 'CUSTOMER' && parent.customer.toString() === req.user._id.toString();
    const isBrandOwner = req.user.role === 'BRAND' && childOrder.seller.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isBrandOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized invoice access.' });
    }

    // Set download headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${childOrderId}.pdf`);

    generateInvoicePDF(parent, childOrder, res);
  } catch (error) {
    console.error('Invoice download error:', error);
    res.status(500).json({ message: 'Server error generating invoice PDF.' });
  }
};

// @desc    Update logistics tracking status (Simulating Shiprocket callbacks / Brand dispatch)
// @route   PUT /api/orders/seller/my-orders/:childOrderId/status
// @access  Private (Role: BRAND)
export const updateFulfillmentStatus = async (req, res) => {
  const { childOrderId } = req.params;
  const { status } = req.body; // Shipped, Out for Delivery, Delivered

  try {
    const childOrder = await SellerOrder.findOne({
      orderId: childOrderId,
      seller: req.brand._id,
    });

    if (!childOrder) {
      return res.status(404).json({ message: 'Seller order not found.' });
    }

    childOrder.fulfillmentStatus = status;
    await childOrder.save();

    const parent = await Order.findById(childOrder.parentOrder);

    // Notify customer
    await Notification.create({
      user: parent.customer,
      title: `Order Status: ${status}`,
      message: `Your package with tracking ID ${childOrder.logistics.trackingId} is now ${status}.`,
      type: 'Order',
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order: childOrder,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Error updating order status.' });
  }
};
