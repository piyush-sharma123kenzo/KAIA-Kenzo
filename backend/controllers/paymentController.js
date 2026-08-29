import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import Cart from '../models/Cart.js';
import Warranty from '../models/Warranty.js';
import Notification from '../models/Notification.js';

// @desc    Verify mock payment gateway transaction & confirm order
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  if (!orderId || !paymentId) {
    return res.status(400).json({ message: 'Order reference and payment details are required.' });
  }

  try {
    // 1. Fetch parent order
    const order = await Order.findOne({ orderId }).populate('childOrders');
    if (!order) {
      return res.status(404).json({ message: 'Order reference not found.' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(200).json({ success: true, message: 'Payment already verified.', order });
    }

    // 2. Mock payment signature validation (Simulates Razorpay Webhook/Verification)
    // In production, we'd verify HMAC SHA256 of orderId + paymentId using the Razorpay key secret.
    // For our robust local mock system, we confirm if details exist.
    const isVerified = signature && signature !== '';
    if (!isVerified) {
      order.paymentStatus = 'Failed';
      await order.save();

      // Release reserved stock back to available pool because payment failed
      for (let childOrder of order.childOrders) {
        for (let item of childOrder.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { 'stock.reservedQuantity': -item.qty },
          });
        }
      }

      return res.status(400).json({ message: 'Payment signature verification failed.' });
    }

    // 3. Mark parent order as paid
    order.paymentStatus = 'Paid';
    order.paymentDetails = {
      provider: 'RazorpayMock',
      transactionId: paymentId,
      signature: signature,
    };
    await order.save();

    // 4. Process each child brand order
    for (let childOrder of order.childOrders) {
      // Create Transaction Ledger entry for brand payouts
      const netSellerPayout = childOrder.finalAmount - childOrder.commissionAmount;
      
      await Transaction.create({
        orderId: order._id,
        childOrderId: childOrder._id,
        seller: childOrder.seller,
        totalAmount: childOrder.finalAmount,
        commissionAmount: childOrder.commissionAmount,
        taxAmount: childOrder.gstAmount,
        netSellerPayout: netSellerPayout,
        payoutStatus: 'Pending',
      });

      // Deduct reserved stock atomically and physically decrement count
      for (let item of childOrder.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            'stock.quantity': -item.qty,
            'stock.reservedQuantity': -item.qty,
          },
        });

        // Initialize active Warranty records (Serial mapping will follow during fulfillment)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 12); // 1-year brand warranty

        await Warranty.create({
          serialNumber: 'PENDING_FULFILLMENT',
          product: item.product,
          brand: childOrder.seller,
          customer: order.customer,
          orderId: childOrder._id,
          startDate,
          endDate,
          status: 'Active',
        });
      }

      // Create notification for Seller Brand
      await Notification.create({
        user: (await SellerOrder.findById(childOrder._id).populate({ path: 'seller', populate: { path: 'owner' } })).seller.owner._id,
        title: 'New Order Received',
        message: `You have received a new order ${childOrder.orderId}. Please pack and scan items to ship.`,
        type: 'Order',
      });
    }

    // 5. Empty user cart in the database
    await Cart.findOneAndUpdate({ user: order.customer }, { $set: { items: [] } });

    // 6. Create Customer notification
    await Notification.create({
      user: order.customer,
      title: 'Order Placed Successfully',
      message: `Thank you for shopping! Your payment was verified, and your order ${order.orderId} is being processed.`,
      type: 'Order',
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and order splitting finalized.',
      order,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Server error during payment verification.' });
  }
};

// @desc    Simulate payment gateway webhook callback
// @route   POST /api/payments/webhook
// @access  Public
export const paymentWebhook = async (req, res) => {
  const { event, payload } = req.body;

  // Verify signature of webhook (Simulated)
  if (req.headers['x-razorpay-signature'] !== 'mock_webhook_signature') {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  try {
    if (event === 'order.paid') {
      const orderId = payload.payment.entity.order_id;
      const paymentId = payload.payment.entity.id;
      const signature = 'valid_webhook_signature_verified';

      // We can invoke payment verification
      // A mock request context is passed
      req.body = { orderId, paymentId, signature };
      await verifyPayment(req, res);
    } else {
      res.status(200).json({ success: true, message: 'Unhandled webhook event' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed.' });
  }
};
