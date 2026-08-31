import mongoose from 'mongoose';
import ReturnRequest from '../../models/ReturnRequest.js';
import Refund from '../../models/Refund.js';
import Order from '../../models/Order.js';
import SellerOrder from '../../models/SellerOrder.js';
import Product from '../../models/Product.js';
import Brand from '../../models/Brand.js';
import Warehouse from '../../models/Warehouse.js';
import Inventory from '../../models/Inventory.js';
import SerialNumber from '../../models/SerialNumber.js';
import Shipment from '../../models/Shipment.js';
import AuditLog from '../../models/AuditLog.js';
import Notification from '../../models/Notification.js';
import inventoryService from '../inventory/inventory.service.js';
import paymentService from '../payment/payment.service.js';

export class ReturnService {
  /**
   * 1. Create Return Request (Customer-initiated)
   */
  async createReturnRequest({
    masterOrderId,
    sellerOrderId,
    items,
    reason,
    customerComment = '',
    returnType = 'refund',
    user,
  }) {
    // 1. Fetch orders and validate ownership
    const masterOrder = await Order.findById(masterOrderId).populate('customer');
    if (!masterOrder) throw new Error('Master Order not found.');

    if (masterOrder.customer._id.toString() !== user._id.toString() && user.role !== 'ADMIN') {
      throw new Error('Unauthorized: You can only request returns for your own orders.');
    }

    const sellerOrder = await SellerOrder.findById(sellerOrderId).populate('seller');
    if (!sellerOrder) throw new Error('Seller Order not found.');

    // 2. Eligibility checks
    if (sellerOrder.fulfillmentStatus !== 'Delivered' && masterOrder.orderStatus !== 'delivered') {
      throw new Error('Only delivered orders are eligible for return or replacement.');
    }

    // 3. Return Window check (Default 10 days from delivery)
    const deliveryDate = sellerOrder.deliveredAt || sellerOrder.updatedAt || masterOrder.updatedAt;
    const returnWindowDays = 10;
    const windowExpiry = new Date(deliveryDate.getTime() + returnWindowDays * 24 * 60 * 60 * 1000);
    if (new Date() > windowExpiry) {
      throw new Error(`Return window of ${returnWindowDays} days has expired for this order.`);
    }

    // 4. Duplicate Check
    const activeReturn = await ReturnRequest.findOne({
      sellerOrderId: sellerOrder._id,
      status: { $nin: ['rejected', 'cancelled'] },
    });
    if (activeReturn) {
      throw new Error(`A return request (${activeReturn.returnNumber}) is already active for this item.`);
    }

    // 5. Validate Return Items & Serial Numbers
    const validatedItems = [];
    let calculatedRefundTotal = 0;

    for (let reqItem of items) {
      const originalItem = sellerOrder.items.find(
        (it) => it.product.toString() === reqItem.productId.toString()
      );
      if (!originalItem) {
        throw new Error(`Product ${reqItem.productName || reqItem.productId} was not part of this seller order.`);
      }

      if (reqItem.quantity > originalItem.qty) {
        throw new Error(`Cannot return ${reqItem.quantity} units. Only ${originalItem.qty} were purchased.`);
      }

      // If serial-tracked product, validate serial
      if (originalItem.serialNumbers && originalItem.serialNumbers.length > 0) {
        if (!reqItem.serialNumbers || reqItem.serialNumbers.length === 0) {
          throw new Error(`Please select the serial barcode for ${originalItem.name}.`);
        }

        for (let sn of reqItem.serialNumbers) {
          if (!originalItem.serialNumbers.includes(sn)) {
            throw new Error(`Serial barcode ${sn} does not belong to this purchased order.`);
          }

          // Verify serial record status in SerialNumber collection
          const serialDoc = await SerialNumber.findOne({ serialNumber: sn, brandId: sellerOrder.seller._id });
          if (serialDoc && ['returned', 'replaced'].includes(serialDoc.status)) {
            throw new Error(`Serial barcode ${sn} has already been returned or replaced.`);
          }
        }
      }

      const itemRefundAmount = originalItem.price * reqItem.quantity;
      calculatedRefundTotal += itemRefundAmount;

      validatedItems.push({
        productId: originalItem.product,
        productName: originalItem.name,
        sku: originalItem.sku || '',
        quantity: reqItem.quantity,
        unitPrice: originalItem.price,
        refundAmount: itemRefundAmount,
        serialNumbers: reqItem.serialNumbers || [],
        returnCondition: reqItem.returnCondition || 'opened',
      });
    }

    // 6. Build unique Return Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const brandSlug = sellerOrder.seller?.slug ? sellerOrder.seller.slug.substring(0, 4).toUpperCase() : 'KAIA';
    const returnNumber = `RET-${brandSlug}-${dateStr}-${rand}`;
    const returnId = returnNumber;

    // 7. Create ReturnRequest document
    const returnDoc = await ReturnRequest.create({
      returnId,
      returnNumber,
      masterOrderId: masterOrder._id,
      sellerOrderId: sellerOrder._id,
      customerId: user._id,
      brandId: sellerOrder.seller._id,
      items: validatedItems,
      reason,
      customerComment,
      returnType,
      status: 'requested',
      pickupDetails: {
        pickupAddress: {
          fullName: masterOrder.shippingAddress.name,
          addressLine1: masterOrder.shippingAddress.street,
          city: masterOrder.shippingAddress.city,
          state: masterOrder.shippingAddress.state,
          postalCode: masterOrder.shippingAddress.postalCode,
          phone: masterOrder.shippingAddress.phone,
        },
      },
      resolutionDetails: {
        resolutionType: returnType,
        refundAmount: calculatedRefundTotal,
      },
      timeline: [
        {
          status: 'requested',
          note: `Return request submitted by customer for ${reason}.`,
          updatedBy: user._id,
          timestamp: new Date(),
        },
      ],
    });

    // 8. Audit & Notification
    await AuditLog.create({
      user: user._id,
      brand: sellerOrder.seller._id,
      action: 'RETURN_REQUESTED',
      entity: 'ReturnRequest',
      entityId: returnDoc._id,
      changes: { returnNumber, reason, returnType, amount: calculatedRefundTotal },
    });

    await Notification.create({
      user: user._id,
      title: 'Return Request Received',
      message: `Your return request #${returnNumber} has been received and is under brand review.`,
      type: 'Order',
    });

    return returnDoc;
  }

  /**
   * 2. Approve Return Request (Brand / Admin)
   */
  async approveReturnRequest({ returnId, returnWarehouseId = null, user }) {
    const returnDoc = await this.getReturnDoc(returnId);

    if (!['requested', 'under_review'].includes(returnDoc.status)) {
      throw new Error(`Cannot approve return with current status: ${returnDoc.status}`);
    }

    // Default primary warehouse if not specified
    let targetWh = returnWarehouseId;
    if (!targetWh) {
      const primaryWh = await Warehouse.findOne({ brandId: returnDoc.brandId, isPrimary: true });
      targetWh = primaryWh?._id || (await Warehouse.findOne({ brandId: returnDoc.brandId }))?._id;
    }

    returnDoc.status = 'approved';
    returnDoc.approvedBy = user._id;
    returnDoc.approvedAt = new Date();
    returnDoc.pickupDetails.returnWarehouseId = targetWh;
    returnDoc.pickupDetails.pickupScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day pickup

    returnDoc.timeline.push({
      status: 'approved',
      note: 'Return approved by brand. Reverse courier pickup scheduled.',
      updatedBy: user._id,
      timestamp: new Date(),
    });

    await returnDoc.save();

    await AuditLog.create({
      user: user._id,
      brand: returnDoc.brandId,
      action: 'RETURN_APPROVED',
      entity: 'ReturnRequest',
      entityId: returnDoc._id,
      changes: { returnNumber: returnDoc.returnNumber, status: 'approved' },
    });

    await Notification.create({
      user: returnDoc.customerId,
      title: 'Return Request Approved',
      message: `Return #${returnDoc.returnNumber} has been approved. Our courier partner will arrive for pickup shortly.`,
      type: 'Order',
    });

    return returnDoc;
  }

  /**
   * 3. Reject Return Request (Brand / Admin)
   */
  async rejectReturnRequest({ returnId, rejectionReason, user }) {
    if (!rejectionReason) throw new Error('Please provide a rejection reason.');

    const returnDoc = await this.getReturnDoc(returnId);
    if (!['requested', 'under_review'].includes(returnDoc.status)) {
      throw new Error(`Cannot reject return in status: ${returnDoc.status}`);
    }

    returnDoc.status = 'rejected';
    returnDoc.rejectionReason = rejectionReason;
    returnDoc.rejectedBy = user._id;
    returnDoc.rejectedAt = new Date();

    returnDoc.timeline.push({
      status: 'rejected',
      note: `Return rejected: ${rejectionReason}`,
      updatedBy: user._id,
      timestamp: new Date(),
    });

    await returnDoc.save();

    await AuditLog.create({
      user: user._id,
      brand: returnDoc.brandId,
      action: 'RETURN_REJECTED',
      entity: 'ReturnRequest',
      entityId: returnDoc._id,
      changes: { returnNumber: returnDoc.returnNumber, rejectionReason },
    });

    await Notification.create({
      user: returnDoc.customerId,
      title: 'Return Request Rejected',
      message: `Your return #${returnDoc.returnNumber} was not approved: ${rejectionReason}`,
      type: 'Order',
    });

    return returnDoc;
  }

  /**
   * 4. Mark Return Received at Depot
   */
  async markReturnReceived({ returnId, warehouseId = null, user }) {
    const returnDoc = await this.getReturnDoc(returnId);

    returnDoc.status = 'inspection_pending';
    returnDoc.pickupDetails.receivedAt = new Date();
    returnDoc.pickupDetails.receivedBy = user._id;
    if (warehouseId) returnDoc.pickupDetails.returnWarehouseId = warehouseId;

    returnDoc.timeline.push({
      status: 'inspection_pending',
      note: 'Package received at warehouse depot. Sent to hardware testing desk.',
      updatedBy: user._id,
      timestamp: new Date(),
    });

    await returnDoc.save();

    await AuditLog.create({
      user: user._id,
      brand: returnDoc.brandId,
      action: 'RETURN_RECEIVED',
      entity: 'ReturnRequest',
      entityId: returnDoc._id,
    });

    return returnDoc;
  }

  /**
   * 5. Submit Return Inspection & Execute Decision (Refund vs Replacement vs Reject)
   */
  async submitReturnInspection({ returnId, inspectionData, decision = 'passed', user }) {
    const returnDoc = await this.getReturnDoc(returnId);

    returnDoc.inspectionDetails = {
      inspectedBy: user._id,
      inspectedAt: new Date(),
      result: decision,
      serialMatched: inspectionData.serialMatched !== false,
      packagingCondition: inspectionData.packagingCondition || 'good',
      accessoriesComplete: inspectionData.accessoriesComplete !== false,
      physicalDamage: !!inspectionData.physicalDamage,
      functionalTest: inspectionData.functionalTest || (decision === 'passed' ? 'passed' : 'failed'),
      inspectionNotes: inspectionData.inspectionNotes || '',
      failureReason: inspectionData.failureReason || (decision === 'failed' ? 'Failed hardware authenticity test' : ''),
    };

    if (decision === 'failed') {
      // Inspection Failed -> Reject Return & log damaged inventory
      returnDoc.status = 'inspection_failed';
      returnDoc.timeline.push({
        status: 'inspection_failed',
        note: `Inspection failed: ${returnDoc.inspectionDetails.failureReason}`,
        updatedBy: user._id,
        timestamp: new Date(),
      });

      // Mark serials as damaged
      for (let it of returnDoc.items) {
        if (it.serialNumbers) {
          for (let sn of it.serialNumbers) {
            await SerialNumber.findOneAndUpdate({ serialNumber: sn }, { status: 'damaged' });
          }
        }
      }

      await returnDoc.save();
      return { success: false, returnDoc, message: 'Inspection failed. Return rejected.' };
    }

    // ==========================================
    // INSPECTION PASSED: RESOLUTION EXECUTION
    // ==========================================
    returnDoc.status = 'inspection_passed';

    if (returnDoc.returnType === 'refund') {
      // 1. Execute Atomic Refund via Gateway
      const refundAmount = returnDoc.resolutionDetails?.refundAmount || returnDoc.items.reduce((acc, it) => acc + it.refundAmount, 0);

      // Find original payment
      const masterOrder = await Order.findById(returnDoc.masterOrderId);
      const paymentId = masterOrder?.paymentDetails?.transactionId || 'mock_pay_id';

      const refundResult = await paymentService.initiateRefund({
        paymentId,
        amountInRupees: refundAmount,
        notes: { returnNumber: returnDoc.returnNumber, sellerOrderId: returnDoc.sellerOrderId.toString() },
      });

      // Create Refund Record (Idempotent)
      const idempotencyKey = `REFUND-${returnDoc.returnNumber}`;
      const refundDoc = await Refund.findOneAndUpdate(
        { idempotencyKey },
        {
          refundId: refundResult.providerRefundId,
          returnRequestId: returnDoc._id,
          sellerOrderId: returnDoc.sellerOrderId,
          masterOrderId: returnDoc.masterOrderId,
          providerPaymentId: paymentId,
          providerRefundId: refundResult.providerRefundId,
          customerId: returnDoc.customerId,
          brandId: returnDoc.brandId,
          amount: refundAmount,
          currency: 'INR',
          status: 'processed',
          idempotencyKey,
          refundedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      returnDoc.status = 'refunded';
      returnDoc.completedAt = new Date();
      returnDoc.resolutionDetails.refundId = refundDoc._id;

      // Restock Returned Items back to Available Inventory
      for (let it of returnDoc.items) {
        await inventoryService.addStock({
          productId: it.productId,
          warehouseId: returnDoc.pickupDetails.returnWarehouseId,
          brandId: returnDoc.brandId,
          quantity: it.quantity,
          reason: `Customer Return Restock (${returnDoc.returnNumber})`,
          user,
        });

        // Transition original serial status to 'returned'
        if (it.serialNumbers) {
          for (let sn of it.serialNumbers) {
            await SerialNumber.findOneAndUpdate({ serialNumber: sn }, { status: 'returned' });
          }
        }
      }

      returnDoc.timeline.push({
        status: 'refunded',
        note: `Inspection passed. ₹${refundAmount.toLocaleString('en-IN')} refunded to original payment method.`,
        updatedBy: user._id,
        timestamp: new Date(),
      });

      await returnDoc.save();

      await AuditLog.create({
        user: user._id,
        brand: returnDoc.brandId,
        action: 'REFUND_COMPLETED',
        entity: 'Refund',
        entityId: refundDoc._id,
        changes: { refundAmount, refundId: refundResult.providerRefundId },
      });

      await Notification.create({
        user: returnDoc.customerId,
        title: 'Refund Processed',
        message: `Your refund of ₹${refundAmount.toLocaleString('en-IN')} for Return #${returnDoc.returnNumber} has been processed.`,
        type: 'Order',
      });

      return { success: true, returnDoc, refundDoc };
    }

    if (returnDoc.returnType === 'replacement') {
      // 2. Execute Replacement: Reserve replacement unit and assign replacement serial
      const replacementItem = returnDoc.items[0];
      const prod = await Product.findById(replacementItem.productId);

      // Verify replacement stock
      const isAvailable = await inventoryService.checkAvailability({
        productId: prod._id,
        quantity: replacementItem.quantity,
      });

      if (!isAvailable) {
        throw new Error('Replacement hardware unit is currently out of stock. Please approve a Refund instead.');
      }

      // Reserve replacement stock
      await inventoryService.reserveStock({
        productId: prod._id,
        brandId: returnDoc.brandId,
        quantity: replacementItem.quantity,
        referenceType: 'ReturnRequest',
        referenceId: returnDoc.returnNumber,
        user,
      });

      // Find an available replacement serial if product is serial-tracked
      let replacementSerialNum = '';
      if (prod.isSerialTracked) {
        const availSerial = await SerialNumber.findOne({
          productId: prod._id,
          brandId: returnDoc.brandId,
          status: 'available',
        });
        if (availSerial) {
          availSerial.status = 'assigned';
          availSerial.assignedAt = new Date();
          await availSerial.save();
          replacementSerialNum = availSerial.serialNumber;
        }
      }

      // Mark original serial as 'replaced'
      if (replacementItem.serialNumbers) {
        for (let sn of replacementItem.serialNumbers) {
          await SerialNumber.findOneAndUpdate({ serialNumber: sn }, { status: 'replaced' });
        }
      }

      returnDoc.status = 'replacement_shipped';
      returnDoc.resolutionDetails.replacementProductId = prod._id;
      returnDoc.resolutionDetails.replacementSerial = replacementSerialNum;

      returnDoc.timeline.push({
        status: 'replacement_shipped',
        note: `Inspection passed. Replacement unit dispatched${replacementSerialNum ? ` (New Serial: ${replacementSerialNum})` : ''}.`,
        updatedBy: user._id,
        timestamp: new Date(),
      });

      await returnDoc.save();

      await AuditLog.create({
        user: user._id,
        brand: returnDoc.brandId,
        action: 'REPLACEMENT_SHIPPED',
        entity: 'ReturnRequest',
        entityId: returnDoc._id,
        changes: { replacementSerial: replacementSerialNum },
      });

      await Notification.create({
        user: returnDoc.customerId,
        title: 'Replacement Dispatched',
        message: `Your replacement unit for Return #${returnDoc.returnNumber} has been verified and dispatched.`,
        type: 'Order',
      });

      return { success: true, returnDoc, replacementSerial: replacementSerialNum };
    }

    await returnDoc.save();
    return { success: true, returnDoc };
  }

  /**
   * Helper: Get return document by ID or returnNumber
   */
  async getReturnDoc(identifier) {
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId ? { $or: [{ _id: identifier }, { returnId: identifier }, { returnNumber: identifier }] } : { $or: [{ returnId: identifier }, { returnNumber: identifier }] };

    const doc = await ReturnRequest.findOne(query)
      .populate('masterOrderId', 'orderId paymentStatus createdAt shippingAddress')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount deliveredAt items')
      .populate('brandId', 'name slug logo')
      .populate('customerId', 'name email');

    if (!doc) throw new Error('Return request not found.');
    return doc;
  }
}

export const returnService = new ReturnService();
export default returnService;
