/**
 * paymentController.js — KAIA Technologies Payment Gateway Controller
 *
 * Security Guarantees:
 * 1. Amount is ALWAYS calculated from the database — never from frontend.
 * 2. Payment is only marked "paid" after server-side signature verification.
 * 3. Webhooks are verified before processing.
 * 4. Webhook processing is idempotent (duplicate webhooks are ignored safely).
 * 5. Inventory is only deducted after payment confirmation — never before.
 * 6. No secrets are ever returned to the frontend.
 * 7. No sensitive data is logged.
 */

import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import WebhookEvent from '../models/WebhookEvent.js';
import Transaction from '../models/Transaction.js';
import Cart from '../models/Cart.js';
import Warranty from '../models/Warranty.js';
import Notification from '../models/Notification.js';
import paymentService from '../services/payment/payment.service.js';
import inventoryService from '../services/inventory/inventory.service.js';
import invoiceService from '../services/invoice/invoice.service.js';
import {
  getSafePaymentErrorMessage,
  logPaymentEvent,
  validatePaymentAmount,
} from '../utils/paymentUtils.js';

// ---------------------------------------------------------------------------
// POST /api/payments/create-order
// Creates a gateway payment order for an existing KAIA order.
// @access Private (Customer)
// ---------------------------------------------------------------------------
export const createPaymentOrder = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
    return res.status(400).json({ message: 'A valid order ID is required.' });
  }

  try {
    // 1. Load the order from database — NEVER trust frontend amount
    const order = await Order.findOne({ orderId: orderId.trim() }).populate({
      path: 'childOrders',
      populate: { path: 'items.product', select: 'name sellingPrice stock gstRate' },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // 2. Verify the order belongs to the requesting customer
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    // 3. Check if order is already paid
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: getSafePaymentErrorMessage('ORDER_ALREADY_PAID') });
    }

    // 4. Check if there is an existing pending payment record for this order
    const existingPayment = await Payment.findOne({
      orderId: order._id,
      status: { $in: ['created', 'pending'] },
    });

    if (existingPayment) {
      // Return existing payment order info (safe for frontend)
      logPaymentEvent('reuse_existing_payment_order', {
        kaiaOrderId: orderId,
        providerOrderId: existingPayment.providerOrderId,
      });

      return res.status(200).json({
        success: true,
        orderId: order.orderId,
        paymentId: existingPayment._id,
        providerOrderId: existingPayment.providerOrderId,
        amount: existingPayment.amount,
        amountPaise: existingPayment.amount * 100,
        currency: existingPayment.currency,
        provider: existingPayment.provider,
        // Public key only — secret NEVER sent to frontend
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      });
    }

    // 5. Re-verify product availability from database
    for (const childOrder of order.childOrders) {
      for (const item of childOrder.items) {
        const product = item.product;
        if (!product) continue;

        const available = product.stock.quantity - product.stock.reservedQuantity;
        if (available < 0) {
          return res.status(400).json({
            message: `Product "${product.name}" is no longer available in required quantity.`,
          });
        }
      }
    }

    // 6. Use the database-calculated finalAmount — NEVER trust frontend amount
    const amountInRupees = order.finalAmount;

    const amountValidation = validatePaymentAmount(amountInRupees);
    if (!amountValidation.valid) {
      logPaymentEvent('create_order_invalid_amount', { orderId, amountInRupees });
      return res.status(400).json({ message: 'Order amount is invalid for payment processing.' });
    }

    // 7. Create payment provider order
    const providerOrderData = await paymentService.createPaymentOrder({
      internalOrderId: order.orderId,
      amountInRupees,
      currency: 'INR',
      notes: {
        customerEmail: req.user.email,
        customerName: req.user.name,
      },
    });

    // 8. Create Payment record in database
    const paymentRecord = await Payment.create({
      orderId: order._id,
      customerId: req.user._id,
      provider: providerOrderData.provider,
      providerOrderId: providerOrderData.providerOrderId,
      amount: amountInRupees,
      currency: 'INR',
      status: 'created',
      attempts: [
        {
          attemptNumber: 1,
          status: 'initiated',
          timestamp: new Date(),
        },
      ],
    });

    // 9. Update order with payment reference
    order.paymentDetails = {
      provider: providerOrderData.provider,
      transactionId: '',
      signature: '',
    };
    // Store providerOrderId on order for cross-reference (added field gracefully)
    if (!order.providerOrderId) {
      order.set('providerOrderId', providerOrderData.providerOrderId, { strict: false });
    }
    await order.save();

    logPaymentEvent('payment_order_created', {
      kaiaOrderId: orderId,
      paymentRecordId: paymentRecord._id,
      providerOrderId: providerOrderData.providerOrderId,
      amountINR: amountInRupees,
    });

    // 10. Return only safe, public information to frontend
    return res.status(201).json({
      success: true,
      orderId: order.orderId,
      paymentId: paymentRecord._id,
      providerOrderId: providerOrderData.providerOrderId,
      amount: amountInRupees,
      amountPaise: providerOrderData.amountPaise,
      currency: 'INR',
      provider: providerOrderData.provider,
      // ONLY the public key — NEVER the secret key
      razorpayKeyId: providerOrderData.razorpayKeyId,
      merchantName: 'KAIA Technologies',
    });
  } catch (error) {
    logPaymentEvent('create_payment_order_error', {
      orderId,
      errorMessage: error.message,
    });
    console.error('[PaymentController] Create order error:', error.message);
    return res.status(500).json({ message: getSafePaymentErrorMessage('PROVIDER_ERROR') });
  }
};

// ---------------------------------------------------------------------------
// POST /api/payments/verify
// Verify payment after gateway checkout callback.
// @access Private (Customer)
// ---------------------------------------------------------------------------
export const verifyPayment = async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  // Input validation
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({
      message: 'Missing required payment verification fields.',
    });
  }

  try {
    // 1. Load the KAIA order
    const order = await Order.findOne({ orderId }).populate('childOrders');

    if (!order) {
      return res.status(404).json({ message: getSafePaymentErrorMessage('ORDER_NOT_FOUND') });
    }

    // 2. Verify the customer owns this order
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    // 3. Idempotency: already paid?
    if (order.paymentStatus === 'Paid') {
      logPaymentEvent('payment_already_paid', { orderId });
      return res.status(200).json({
        success: true,
        message: 'Payment already verified.',
        orderId: order.orderId,
      });
    }

    // 4. Find the Payment record
    const paymentRecord = await Payment.findOne({
      orderId: order._id,
      providerOrderId: razorpayOrderId,
    });

    if (!paymentRecord) {
      return res.status(404).json({ message: 'Payment record not found for this order.' });
    }

    // 5. SERVER-SIDE SIGNATURE VERIFICATION
    //    This is the AUTHORITATIVE verification step.
    //    Do NOT mark payment paid without this.
    const verificationResult = await paymentService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!verificationResult.verified) {
      // Mark payment attempt as failed
      paymentRecord.status = 'failed';
      paymentRecord.attempts.push({
        attemptNumber: paymentRecord.attempts.length + 1,
        providerPaymentId: razorpayPaymentId,
        status: 'failed',
        failureReason: 'Signature verification failed',
        timestamp: new Date(),
      });
      await paymentRecord.save();

      // Mark order as failed
      order.paymentStatus = 'Failed';
      await order.save();

      logPaymentEvent('payment_verification_failed', {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
      });

      return res.status(400).json({
        message: getSafePaymentErrorMessage('SIGNATURE_INVALID'),
      });
    }

    // 6. Signature verified — process the payment
    await _processConfirmedPayment({
      order,
      paymentRecord,
      razorpayPaymentId,
      razorpaySignature,
      method: 'razorpay',
    });

    logPaymentEvent('payment_verified_successfully', {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified. Order is confirmed.',
      orderId: order.orderId,
      paymentStatus: 'paid',
    });
  } catch (error) {
    logPaymentEvent('verify_payment_error', {
      orderId,
      errorMessage: error.message,
    });
    console.error('[PaymentController] Verify payment error:', error.message);
    return res.status(500).json({ message: getSafePaymentErrorMessage('DEFAULT') });
  }
};

// ---------------------------------------------------------------------------
// POST /api/payments/webhook
// Handle Razorpay webhook events (called directly by Razorpay, not customer).
// @access Public (signature-verified)
// ---------------------------------------------------------------------------
export const paymentWebhook = async (req, res) => {
  // 1. Verify webhook signature FIRST — reject all unsigned webhooks immediately
  const signature = req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'] || '';
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

  const isValidSignature = paymentService.verifyWebhookSignature(rawBody, signature);

  if (!isValidSignature) {
    logPaymentEvent('webhook_invalid_signature', { signaturePresent: !!signature });
    return res.status(400).json({ message: 'Webhook signature verification failed.' });
  }

  // 2. Extract safe event data
  const webhookData = paymentService.extractWebhookEventData(req.body);

  logPaymentEvent('webhook_received', {
    eventId: webhookData.eventId,
    eventType: webhookData.eventType,
    providerOrderId: webhookData.providerOrderId,
  });

  // 3. Idempotency check — has this webhook event already been processed?
  const existingEvent = await WebhookEvent.findOne({ eventId: webhookData.eventId });
  if (existingEvent && existingEvent.processed) {
    logPaymentEvent('webhook_duplicate_skipped', { eventId: webhookData.eventId });
    // Return 200 to acknowledge the provider — do NOT reprocess
    return res.status(200).json({ success: true, message: 'Event already processed.' });
  }

  // 4. Create or update WebhookEvent record (mark as received, not yet processed)
  let webhookEventDoc;
  if (existingEvent) {
    webhookEventDoc = existingEvent;
  } else {
    webhookEventDoc = await WebhookEvent.create({
      eventId: webhookData.eventId,
      provider: 'razorpay',
      eventType: webhookData.eventType,
      providerOrderId: webhookData.providerOrderId,
      providerPaymentId: webhookData.providerPaymentId,
      processed: false,
      receivedAt: new Date(),
    });
  }

  // 5. Resolve what action to take
  const action = paymentService.resolveWebhookAction(webhookData);

  if (action.action === 'UNHANDLED') {
    // Acknowledge but don't process unknown events
    webhookEventDoc.processed = true;
    webhookEventDoc.processedAt = new Date();
    await webhookEventDoc.save();

    return res.status(200).json({ success: true, message: 'Webhook acknowledged.' });
  }

  try {
    // 6. Find the related Payment record
    const paymentRecord = await Payment.findOne({
      providerOrderId: webhookData.providerOrderId,
    });

    if (!paymentRecord) {
      logPaymentEvent('webhook_payment_not_found', { providerOrderId: webhookData.providerOrderId });
      webhookEventDoc.processed = true;
      webhookEventDoc.processingError = 'Payment record not found';
      webhookEventDoc.processedAt = new Date();
      await webhookEventDoc.save();
      return res.status(200).json({ success: true });
    }

    const order = await Order.findById(paymentRecord.orderId).populate('childOrders');

    if (!order) {
      webhookEventDoc.processed = true;
      webhookEventDoc.processingError = 'Order not found';
      webhookEventDoc.processedAt = new Date();
      await webhookEventDoc.save();
      return res.status(200).json({ success: true });
    }

    // 7. Update WebhookEvent with internal order reference
    webhookEventDoc.internalOrderId = order._id;
    await webhookEventDoc.save();

    // 8. Process the action
    if (action.action === 'MARK_PAID' && order.paymentStatus !== 'Paid') {
      await _processConfirmedPayment({
        order,
        paymentRecord,
        razorpayPaymentId: webhookData.providerPaymentId,
        razorpaySignature: 'webhook_verified',
        method: webhookData.method || 'webhook',
        isWebhook: true,
      });

      logPaymentEvent('webhook_order_paid', {
        orderId: order.orderId,
        providerPaymentId: webhookData.providerPaymentId,
      });
    } else if (action.action === 'MARK_FAILED' && order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Failed';
      await order.save();

      paymentRecord.status = 'failed';
      paymentRecord.providerPaymentId = webhookData.providerPaymentId;
      await paymentRecord.save();

      logPaymentEvent('webhook_payment_failed', { orderId: order.orderId });
    } else if (action.action === 'MARK_AUTHORIZED') {
      paymentRecord.status = 'authorized';
      await paymentRecord.save();
    }

    // 9. Mark webhook event as processed
    webhookEventDoc.processed = true;
    webhookEventDoc.processedAt = new Date();
    await webhookEventDoc.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    logPaymentEvent('webhook_processing_error', {
      eventId: webhookData.eventId,
      errorMessage: error.message,
    });
    console.error('[PaymentController] Webhook processing error:', error.message);

    // Update webhook event with error (do not mark as processed so it can be retried)
    webhookEventDoc.processingError = error.message.substring(0, 200);
    await webhookEventDoc.save();

    // Always return 200 to the provider to stop retries for non-retryable errors
    return res.status(200).json({ success: false, message: 'Processing error logged.' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/payments/:paymentId
// Get payment details for a specific payment record.
// @access Private (Customer)
// ---------------------------------------------------------------------------
export const getPaymentById = async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    // Ensure customer can only view their own payment
    if (payment.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    // Return safe payment details (no secrets)
    return res.status(200).json({
      success: true,
      payment: {
        _id: payment._id,
        orderId: payment.orderId,
        providerOrderId: payment.providerOrderId,
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        attempts: payment.attempts,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    });
  } catch (error) {
    console.error('[PaymentController] Get payment error:', error.message);
    return res.status(500).json({ message: 'Error fetching payment details.' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/payments/retry/:orderId
// Create a new payment attempt for an existing pending order.
// @access Private (Customer)
// ---------------------------------------------------------------------------
export const retryPayment = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'This order is already paid.' });
    }

    // Find the existing payment record
    const existingPayment = await Payment.findOne({ orderId: order._id });

    if (!existingPayment) {
      // No existing payment record — delegate to create-order flow
      return res.status(400).json({
        message: 'No existing payment found for this order. Please initiate a new payment.',
      });
    }

    // Check attempt limit (max 5 attempts per payment record)
    const MAX_ATTEMPTS = 5;
    if (existingPayment.attempts.length >= MAX_ATTEMPTS) {
      return res.status(400).json({
        message: `Maximum payment attempts (${MAX_ATTEMPTS}) reached for this order. Please contact support.`,
      });
    }

    // Create new provider order for retry
    const providerOrderData = await paymentService.createPaymentOrder({
      internalOrderId: order.orderId,
      amountInRupees: order.finalAmount,
      currency: 'INR',
    });

    // Update payment record with new provider order and new attempt
    existingPayment.providerOrderId = providerOrderData.providerOrderId;
    existingPayment.status = 'created';
    existingPayment.attempts.push({
      attemptNumber: existingPayment.attempts.length + 1,
      status: 'initiated',
      timestamp: new Date(),
    });
    await existingPayment.save();

    logPaymentEvent('payment_retry_initiated', {
      orderId,
      attemptNumber: existingPayment.attempts.length,
      newProviderOrderId: providerOrderData.providerOrderId,
    });

    return res.status(200).json({
      success: true,
      message: 'New payment attempt initiated.',
      orderId: order.orderId,
      paymentId: existingPayment._id,
      providerOrderId: providerOrderData.providerOrderId,
      amount: order.finalAmount,
      amountPaise: providerOrderData.amountPaise,
      currency: 'INR',
      provider: providerOrderData.provider,
      razorpayKeyId: providerOrderData.razorpayKeyId,
      attemptNumber: existingPayment.attempts.length,
    });
  } catch (error) {
    logPaymentEvent('payment_retry_error', { orderId, errorMessage: error.message });
    console.error('[PaymentController] Retry payment error:', error.message);
    return res.status(500).json({ message: getSafePaymentErrorMessage('DEFAULT') });
  }
};

// ---------------------------------------------------------------------------
// GET /api/payments/status/:orderId
// Poll payment status for an order (for pending payments).
// @access Private (Customer)
// ---------------------------------------------------------------------------
export const getPaymentStatusByOrderId = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const paymentRecord = await Payment.findOne({ orderId: order._id });

    return res.status(200).json({
      success: true,
      orderId: order.orderId,
      orderPaymentStatus: order.paymentStatus,
      paymentStatus: paymentRecord?.status || 'unknown',
      attempts: paymentRecord?.attempts?.length || 0,
    });
  } catch (error) {
    console.error('[PaymentController] Get status error:', error.message);
    return res.status(500).json({ message: 'Error fetching payment status.' });
  }
};

// ---------------------------------------------------------------------------
// INTERNAL: Process a confirmed (verified) payment
// Called after signature verification (from /verify) OR from webhook handler.
// NEVER call this without prior signature verification.
// ---------------------------------------------------------------------------
async function _processConfirmedPayment({
  order,
  paymentRecord,
  razorpayPaymentId,
  razorpaySignature,
  method = 'razorpay',
  isWebhook = false,
}) {
  // Idempotency guard: if order is already paid, do nothing
  if (order.paymentStatus === 'Paid') {
    logPaymentEvent('process_payment_already_paid_skip', { orderId: order.orderId });
    return;
  }

  // 1. Mark order as paid
  order.paymentStatus = 'Paid';
  order.paymentDetails = {
    provider: paymentRecord.provider,
    transactionId: razorpayPaymentId,
    signature: isWebhook ? 'webhook_verified' : razorpaySignature,
  };
  await order.save();

  // 2. Update payment record
  paymentRecord.status = 'paid';
  paymentRecord.providerPaymentId = razorpayPaymentId;
  paymentRecord.method = method;
  if (paymentRecord.attempts.length > 0) {
    const lastAttempt = paymentRecord.attempts[paymentRecord.attempts.length - 1];
    lastAttempt.status = 'paid';
    lastAttempt.providerPaymentId = razorpayPaymentId;
  }
  await paymentRecord.save();

  // 3. Process each child brand order
  for (const childOrder of order.childOrders) {
    // Populate items if not already populated
    const populatedChildOrder = await SellerOrder.findById(childOrder._id).populate({
      path: 'items.product',
      select: 'name stock',
    });

    if (!populatedChildOrder) continue;

    // Create Transaction ledger entry
    const netSellerPayout = populatedChildOrder.finalAmount - populatedChildOrder.commissionAmount;

    await Transaction.create({
      orderId: order._id,
      childOrderId: populatedChildOrder._id,
      seller: populatedChildOrder.seller,
      totalAmount: populatedChildOrder.finalAmount,
      commissionAmount: populatedChildOrder.commissionAmount,
      taxAmount: populatedChildOrder.gstAmount || 0,
      netSellerPayout,
      payoutStatus: 'Pending',
    });

    // 4. ATOMIC INVENTORY DEDUCTION — only after payment confirmation
    //    Guard: check if stock was already deducted for this order
    for (const item of populatedChildOrder.items) {
      if (!item.product) continue;

      // Atomic update: deduct from quantity AND reserved simultaneously
      // This prevents overselling if webhook fires twice
      const updateResult = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          'stock.reservedQuantity': { $gte: item.qty }, // Ensure reserved stock exists
        },
        {
          $inc: {
            'stock.quantity': -item.qty,
            'stock.reservedQuantity': -item.qty,
          },
        },
        { new: true }
      );

      if (!updateResult) {
        logPaymentEvent('inventory_deduction_skipped', {
          productId: item.product._id,
          orderId: order.orderId,
          note: 'Reserved stock not found — possibly already deducted (idempotent skip)',
        });
      }

      // Synchronize Warehouse Inventory collection
      try {
        await inventoryService.commitSale({
          productId: item.product._id,
          brandId: populatedChildOrder.seller,
          quantity: item.qty,
          referenceType: 'SellerOrder',
          referenceId: populatedChildOrder.orderId,
        });
      } catch (invErr) {
        console.error('[PaymentController] Inventory commitSale error:', invErr.message);
      }

      // Create Warranty record
      const startDate = new Date();
      endDate.setMonth(endDate.getMonth() + 12);

      // 5. AUTO-GENERATE OFFICIAL GST INVOICE & SNAPSHOT
      try {
        await invoiceService.generateInvoiceForSellerOrder({
          sellerOrderId: populatedChildOrder._id,
          paymentDetails: {
            provider: paymentRecord.provider,
            paymentId: razorpayPaymentId,
            method: method,
          },
        });
      } catch (invGenErr) {
        console.error('[PaymentController] Auto invoice generation error:', invGenErr.message);
      }
    }

    // 5. Notify brand seller
    try {
      const sellerWithOwner = await SellerOrder.findById(populatedChildOrder._id).populate({
        path: 'seller',
        populate: { path: 'owner' },
      });

      if (sellerWithOwner?.seller?.owner?._id) {
        await Notification.create({
          user: sellerWithOwner.seller.owner._id,
          title: 'New Order Received',
          message: `You have a new confirmed order ${populatedChildOrder.orderId}. Please pack and prepare for dispatch.`,
          type: 'Order',
        });
      }
    } catch (notifError) {
      // Non-fatal: log but don't fail the payment confirmation
      console.error('[PaymentController] Seller notification failed:', notifError.message);
    }
  }

  // 6. Clear the customer's cart
  await Cart.findOneAndUpdate({ user: order.customer }, { $set: { items: [] } });

  // 7. Notify customer
  try {
    await Notification.create({
      user: order.customer,
      title: 'Order Confirmed — Payment Received',
      message: `Your payment for order ${order.orderId} has been confirmed. Your order is now being processed.`,
      type: 'Order',
    });
  } catch (notifError) {
    console.error('[PaymentController] Customer notification failed:', notifError.message);
  }

  logPaymentEvent('payment_confirmed_processing_complete', {
    orderId: order.orderId,
    razorpayPaymentId,
    isWebhook,
  });
}

// ---------------------------------------------------------------------------
// POST /api/payments/cod
// Confirm Cash on Delivery order with database stock deduction & cart cleanup.
// @access Private (Customer)
// ---------------------------------------------------------------------------
export const confirmCodOrder = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required.' });
  }

  try {
    const order = await Order.findOne({ orderId: orderId.trim() }).populate({
      path: 'childOrders',
      populate: { path: 'items.product' },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    if (order.orderStatus === 'confirmed' || order.orderStatus === 'processing') {
      return res.status(200).json({ success: true, message: 'Order already confirmed.', orderId: order.orderId });
    }

    // Process COD order
    order.paymentMethod = 'COD';
    order.paymentStatus = 'Pending';
    order.orderStatus = 'confirmed';
    await order.save();

    for (const child of order.childOrders) {
      child.orderStatus = 'confirmed';
      await child.save();

      // Deduct inventory
      for (const item of child.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product._id, {
            $inc: {
              'stock.quantity': -item.quantity,
              'stock.availableQuantity': -item.quantity,
              stockQuantity: -item.quantity,
            },
          });
        }
      }
    }

    // Clear cart in MongoDB
    await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

    // Customer notification
    try {
      await Notification.create({
        user: order.customer,
        title: 'Order Placed — Cash on Delivery',
        message: `Your COD order ${order.orderId} has been confirmed. Pay cash or UPI upon delivery.`,
        type: 'Order',
      });
    } catch (e) {
      // non-fatal
    }

    res.status(200).json({
      success: true,
      message: 'Cash on Delivery order placed successfully.',
      orderId: order.orderId,
    });
  } catch (error) {
    console.error('COD confirmation error:', error);
    res.status(500).json({ message: 'Error confirming COD order.' });
  }
};

