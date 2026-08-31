import mongoose from 'mongoose';
import Shipment, { ALLOWED_TRANSITIONS, VALID_STATUSES } from '../../models/Shipment.js';
import ShipmentTrackingEvent from '../../models/ShipmentTrackingEvent.js';
import SellerOrder from '../../models/SellerOrder.js';
import Order from '../../models/Order.js';
import Brand from '../../models/Brand.js';
import Warehouse from '../../models/Warehouse.js';
import Product from '../../models/Product.js';
import SerialNumber from '../../models/SerialNumber.js';
import Notification from '../../models/Notification.js';
import AuditLog from '../../models/AuditLog.js';
import WebhookEvent from '../../models/WebhookEvent.js';
import shiprocketAdapter from './shiprocket.adapter.js';
import { deriveMasterOrderStatus } from '../../controllers/orderController.js';

export class ShippingService {
  constructor() {
    this.adapter = shiprocketAdapter;
  }

  /**
   * Helper to obtain active provider status
   */
  getProviderStatus() {
    return {
      provider: this.adapter.name,
      configured: this.adapter.isConfigured(),
    };
  }

  /**
   * 1. Create a Shipment for an eligible SellerOrder
   */
  async createShipmentForSellerOrder({ sellerOrderId, brandId, warehouseId = null, packageInfo = {}, userContext = null }) {
    // 1. Fetch & Validate Seller Order
    const isObjectId = mongoose.Types.ObjectId.isValid(sellerOrderId);
    const query = isObjectId ? { $or: [{ _id: sellerOrderId }, { orderId: sellerOrderId }] } : { orderId: sellerOrderId };

    // Multi-tenant brand isolation
    if (brandId) {
      query.seller = brandId;
    }

    const sellerOrder = await SellerOrder.findOne(query)
      .populate('parentOrder')
      .populate('seller');

    if (!sellerOrder) {
      throw new Error('Seller Order not found or unauthorized for this brand.');
    }

    // 2. Shipping Eligibility Validations
    const parentOrder = sellerOrder.parentOrder;
    if (!parentOrder) {
      throw new Error('Parent Master Order not found.');
    }

    if (sellerOrder.paymentStatus !== 'Paid' || parentOrder.paymentStatus !== 'Paid') {
      throw new Error('Cannot create shipment: Payment has not been confirmed for this order.');
    }

    if (sellerOrder.fulfillmentStatus === 'Cancelled' || parentOrder.orderStatus === 'cancelled') {
      throw new Error('Cannot create shipment for a cancelled order.');
    }

    if (sellerOrder.fulfillmentStatus === 'Delivered') {
      throw new Error('Shipment has already been delivered.');
    }

    // Prevent duplicate shipment creation for the same seller order
    const existingShipment = await Shipment.findOne({
      sellerOrderId: sellerOrder._id,
      shipmentStatus: { $ne: 'cancelled' },
    });
    if (existingShipment) {
      return {
        success: true,
        alreadyExists: true,
        shipment: existingShipment,
        providerStatus: this.getProviderStatus(),
      };
    }

    if (!sellerOrder.items || sellerOrder.items.length === 0) {
      throw new Error('Seller Order contains no items to ship.');
    }

    // 3. Serial / IMEI Allocation Validation for Tracked Hardware
    for (let item of sellerOrder.items) {
      const product = await Product.findById(item.product);
      if (product && product.isSerialTracked) {
        if (!item.serialNumbers || item.serialNumbers.length < item.qty) {
          throw new Error(
            `Serial/IMEI allocation required for "${item.name}". Assigned: ${item.serialNumbers?.length || 0}/${item.qty}. Please assign serial barcodes before creating shipment.`
          );
        }
      }
    }

    // 4. Warehouse Allocation & Ownership Validation
    const brandDoc = sellerOrder.seller;
    let selectedWarehouse = null;

    if (warehouseId) {
      selectedWarehouse = await Warehouse.findOne({ _id: warehouseId, brandId: brandDoc._id });
      if (!selectedWarehouse) {
        throw new Error('Specified warehouse not found or unauthorized for this brand partner.');
      }
    } else {
      selectedWarehouse = await Warehouse.findOne({ brandId: brandDoc._id, isPrimary: true }) ||
        await Warehouse.findOne({ brandId: brandDoc._id, isActive: true });
    }

    // 5. Pickup & Delivery Address Snapshots
    const pickupAddress = {
      warehouseName: selectedWarehouse?.name || `${brandDoc?.name || 'Brand'} Warehouse`,
      name: selectedWarehouse?.name || `${brandDoc?.name || 'Brand'} Warehouse`,
      contactName: selectedWarehouse?.contactName || brandDoc?.name || '',
      phone: selectedWarehouse?.phone || brandDoc?.contactPhone || '9876543210',
      address: selectedWarehouse ? `${selectedWarehouse.addressLine1}, ${selectedWarehouse.city}` : 'Authorized Logistics Depot',
      addressLine1: selectedWarehouse?.addressLine1 || brandDoc?.businessDetails?.address || 'Authorized Logistics Depot',
      addressLine2: selectedWarehouse?.addressLine2 || '',
      city: selectedWarehouse?.city || 'Bengaluru',
      state: selectedWarehouse?.state || 'Karnataka',
      postalCode: selectedWarehouse?.postalCode || '560001',
      country: selectedWarehouse?.country || 'India',
    };

    const shippingAddress = {
      fullName: parentOrder.shippingAddress.name,
      name: parentOrder.shippingAddress.name,
      phone: parentOrder.shippingAddress.phone,
      address: `${parentOrder.shippingAddress.street}, ${parentOrder.shippingAddress.city}`,
      addressLine1: parentOrder.shippingAddress.street,
      addressLine2: '',
      city: parentOrder.shippingAddress.city,
      state: parentOrder.shippingAddress.state,
      postalCode: parentOrder.shippingAddress.postalCode,
      country: parentOrder.shippingAddress.country || 'India',
    };

    // 6. Package Dimensions & Weight
    const length = Math.max(1, Number(packageInfo.length) || 15);
    const breadth = Math.max(1, Number(packageInfo.breadth) || 15);
    const height = Math.max(1, Number(packageInfo.height) || 10);
    const weight = Math.max(0.1, Number(packageInfo.weight) || 0.5);

    // 7. Generate Unique Human-Readable Shipment ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    const shipmentId = `SHIP-${dateStr}-${rand}`;

    // 8. Call Shipping Provider Adapter (if configured)
    let providerRes = { configured: false, providerOrderId: '', providerShipmentId: '', providerAwbCode: '' };
    if (this.adapter.isConfigured()) {
      providerRes = await this.adapter.createShipment({
        sellerOrderId: sellerOrder.orderId,
        pickupLocationName: pickupAddress.warehouseName,
        shippingAddress,
        customerEmail: parentOrder.customer?.email || 'customer@kaia.tech',
        items: sellerOrder.items,
        subtotal: sellerOrder.subtotal,
        package: { length, breadth, height, weight },
      });
    }

    const assignedAwb = packageInfo.awbNumber || (providerRes.providerAwbCode || '');
    const assignedCourier = packageInfo.courierName || (this.adapter.isConfigured() ? 'Blue Dart Express' : 'Blue Dart Express');

    // 9. Create Shipment Record in DB
    const shipment = await Shipment.create({
      shipmentId,
      shipmentNumber: shipmentId,
      masterOrderId: parentOrder._id,
      sellerOrderId: sellerOrder._id,
      brandId: sellerOrder.seller._id || sellerOrder.seller,
      warehouseId: selectedWarehouse?._id || undefined,
      customerId: parentOrder.customer,
      items: sellerOrder.items.map((it) => ({
        product: it.product,
        name: it.name,
        sku: it.sku || '',
        qty: it.qty,
        price: it.price,
        serialNumbers: it.serialNumbers || [],
      })),
      package: {
        length,
        breadth,
        height,
        weight,
        unit: 'cm',
        weightUnit: 'kg',
      },
      pickupAddress,
      shippingAddress,
      courierProvider: this.adapter.isConfigured() ? 'shiprocket' : 'bluedart',
      courierName: assignedCourier,
      courier: {
        name: assignedCourier,
        code: 'BLUEDART',
        serviceType: 'Surface Express Air Priority',
      },
      courierCode: 'BLUEDART',
      awbNumber: assignedAwb,
      trackingNumber: assignedAwb,
      shipmentStatus: 'ready_to_ship',
      customerShippingFee: sellerOrder.shippingAmount || 0,
      shippingCost: packageInfo.shippingCost || (sellerOrder.shippingAmount || 150),
      marketplaceSubsidy: Math.max(0, (packageInfo.shippingCost || 150) - (sellerOrder.shippingAmount || 0)),
      estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // +4 days estimate
      providerReference: {
        provider: this.adapter.name.toLowerCase(),
        providerOrderId: providerRes.providerOrderId || '',
        providerShipmentId: providerRes.providerShipmentId || '',
        providerAwbCode: assignedAwb,
      },
    });

    // 10. Initial Tracking Event
    await ShipmentTrackingEvent.create({
      shipmentId: shipment._id,
      masterOrderId: parentOrder._id,
      sellerOrderId: sellerOrder._id,
      status: 'ready_to_ship',
      description: 'Shipment created and package ready for courier dispatch at warehouse.',
      location: `${pickupAddress.city}, ${pickupAddress.state}`,
      eventTime: new Date(),
      source: 'BrandDispatch',
    });

    // 11. Update SellerOrder fulfillmentStatus
    if (sellerOrder.fulfillmentStatus === 'Processing' || sellerOrder.fulfillmentStatus === 'Packed') {
      sellerOrder.fulfillmentStatus = 'Packed';
      if (assignedAwb) {
        sellerOrder.logistics = sellerOrder.logistics || {};
        sellerOrder.logistics.trackingId = assignedAwb;
      }
      await sellerOrder.save();
      await deriveMasterOrderStatus(parentOrder._id);
    }

    // 12. Audit Log & Notifications
    const userId = userContext?._id || parentOrder.customer;
    await AuditLog.create({
      user: userId,
      brand: sellerOrder.seller._id || sellerOrder.seller,
      action: 'SHIPMENT_CREATED',
      entity: 'Shipment',
      entityId: shipment._id,
      changes: {
        shipmentId: shipment.shipmentId,
        sellerOrderId: sellerOrder.orderId,
        masterOrderId: parentOrder.orderId,
        warehouseId: selectedWarehouse?._id,
      },
    });

    await Notification.create({
      user: parentOrder.customer,
      title: 'Shipment Created',
      message: `Shipment #${shipment.shipmentId} for ${brandDoc?.name || 'Brand'} is packed and scheduled for dispatch.`,
      type: 'Order',
    });

    return {
      success: true,
      shipment,
      providerStatus: this.getProviderStatus(),
    };
  }

  /**
   * 2. Generate Shipping Label
   */
  async generateShippingLabel({ shipmentId, brandId, userContext = null }) {
    const isObjectId = mongoose.Types.ObjectId.isValid(shipmentId);
    const query = isObjectId ? { $or: [{ _id: shipmentId }, { shipmentId }] } : { shipmentId };
    if (brandId) query.brandId = brandId;

    const shipment = await Shipment.findOne(query).populate('sellerOrderId brandId');
    if (!shipment) throw new Error('Shipment not found or unauthorized.');

    let labelUrl = '';

    if (this.adapter.isConfigured() && shipment.providerReference?.providerShipmentId) {
      const labelRes = await this.adapter.generateLabel(shipment.providerReference.providerShipmentId);
      if (labelRes.success && labelRes.labelUrl) {
        labelUrl = labelRes.labelUrl;
      }
    }

    if (!labelUrl) {
      labelUrl = `/api/orders/${shipment.sellerOrderId?._id || shipment.sellerOrderId}/invoice`;
    }

    shipment.shippingLabelUrl = labelUrl;
    shipment.labelUrl = labelUrl;

    if (shipment.shipmentStatus === 'ready_to_ship' || shipment.shipmentStatus === 'pending') {
      shipment.shipmentStatus = 'label_generated';
    }
    await shipment.save();

    await ShipmentTrackingEvent.create({
      shipmentId: shipment._id,
      masterOrderId: shipment.masterOrderId,
      sellerOrderId: shipment.sellerOrderId?._id || shipment.sellerOrderId,
      status: 'label_generated',
      description: 'Shipping label and GST package manifest generated.',
      location: `${shipment.pickupAddress.city}, ${shipment.pickupAddress.state}`,
      eventTime: new Date(),
      source: 'BrandDispatch',
    });

    await AuditLog.create({
      user: userContext?._id || shipment.customerId,
      brand: shipment.brandId,
      action: 'LABEL_GENERATED',
      entity: 'Shipment',
      entityId: shipment._id,
      changes: { shipmentId: shipment.shipmentId, labelUrl },
    });

    return {
      success: true,
      labelUrl,
      shipment,
    };
  }

  /**
   * 3. Schedule Courier Pickup
   */
  async scheduleCourierPickup({ shipmentId, brandId, pickupDate, userContext = null }) {
    const isObjectId = mongoose.Types.ObjectId.isValid(shipmentId);
    const query = isObjectId ? { $or: [{ _id: shipmentId }, { shipmentId }] } : { shipmentId };
    if (brandId) query.brandId = brandId;

    const shipment = await Shipment.findOne(query);
    if (!shipment) throw new Error('Shipment not found or unauthorized.');

    const scheduledDate = pickupDate ? new Date(pickupDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (this.adapter.isConfigured() && shipment.providerReference?.providerShipmentId) {
      await this.adapter.schedulePickup({
        providerShipmentId: shipment.providerReference.providerShipmentId,
      });
    }

    shipment.pickupScheduledAt = scheduledDate;
    shipment.shipmentStatus = 'pickup_scheduled';
    await shipment.save();

    await ShipmentTrackingEvent.create({
      shipmentId: shipment._id,
      masterOrderId: shipment.masterOrderId,
      sellerOrderId: shipment.sellerOrderId,
      status: 'pickup_scheduled',
      description: `Courier pickup scheduled for ${scheduledDate.toLocaleDateString('en-IN')}.`,
      location: `${shipment.pickupAddress.city}, ${shipment.pickupAddress.state}`,
      eventTime: new Date(),
      source: 'BrandDispatch',
    });

    await AuditLog.create({
      user: userContext?._id || shipment.customerId,
      brand: shipment.brandId,
      action: 'PICKUP_SCHEDULED',
      entity: 'Shipment',
      entityId: shipment._id,
      changes: { shipmentId: shipment.shipmentId, scheduledDate },
    });

    return {
      success: true,
      message: 'Courier pickup successfully scheduled.',
      shipment,
    };
  }

  /**
   * 4. Dispatch / Update Status with Controlled State Transitions
   */
  async updateShipmentStatus({ shipmentId, newStatus, location, description, trackingNumber, courierName, userContext = null }) {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid shipment status: "${newStatus}".`);
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(shipmentId);
    const query = isObjectId ? { $or: [{ _id: shipmentId }, { shipmentId }] } : { shipmentId };

    const shipment = await Shipment.findOne(query).populate('sellerOrderId');
    if (!shipment) throw new Error('Shipment not found.');

    const currentStatus = shipment.shipmentStatus;

    // Validate state transition
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (currentStatus !== newStatus && !allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowed.join(', ') || 'None'}`);
    }

    const prevStatus = shipment.shipmentStatus;
    shipment.shipmentStatus = newStatus;

    if (trackingNumber) {
      shipment.trackingNumber = trackingNumber;
      shipment.awbNumber = trackingNumber;
    }
    if (courierName) {
      shipment.courier = shipment.courier || {};
      shipment.courier.name = courierName;
      shipment.courierName = courierName;
    }

    const now = new Date();
    if (newStatus === 'picked_up') {
      shipment.pickedUpAt = now;
      shipment.actualPickupDate = now;
    }
    if (newStatus === 'in_transit') shipment.shippedAt = shipment.shippedAt || now;
    if (newStatus === 'reached_hub') shipment.reachedHubAt = now;
    if (newStatus === 'out_for_delivery') shipment.outForDeliveryAt = now;
    if (newStatus === 'delivered') {
      shipment.deliveredAt = now;
      shipment.actualDeliveryDate = now;
    }
    if (newStatus === 'delivery_attempted') {
      shipment.failedAt = now;
      shipment.failureReason = description || 'Delivery attempt failed. Re-attempt will be scheduled.';
    }
    if (newStatus === 'lost') {
      shipment.failedAt = now;
      shipment.failureReason = description || 'Shipment declared lost by carrier during transit.';
    }
    if (newStatus === 'damaged') {
      shipment.failedAt = now;
      shipment.failureReason = description || 'Package damaged during transit. Returned to seller inspection depot.';
    }
    if (newStatus === 'rto_initiated' || newStatus === 'rto_in_transit' || newStatus === 'rto_delivered') {
      shipment.returnedAt = now;
      shipment.returnReason = description || 'Return to Origin initiated.';
    }

    await shipment.save();

    // Create Tracking Event (Idempotent by compound index)
    try {
      await ShipmentTrackingEvent.create({
        shipmentId: shipment._id,
        masterOrderId: shipment.masterOrderId,
        sellerOrderId: shipment.sellerOrderId?._id || shipment.sellerOrderId,
        status: newStatus,
        description: description || `Shipment status updated to ${newStatus.replace(/_/g, ' ')}.`,
        location: location || `${shipment.pickupAddress.city}, ${shipment.pickupAddress.state}`,
        eventTime: now,
        timestamp: now,
        source: userContext?.role === 'ADMIN' ? 'AdminIntervention' : 'CarrierAPI',
      });
    } catch (e) {
      // Duplicate event safely ignored
    }

    // Synchronize corresponding SellerOrder fulfillmentStatus
    const sellerOrder = await SellerOrder.findById(shipment.sellerOrderId?._id || shipment.sellerOrderId);
    if (sellerOrder) {
      if (['picked_up', 'in_transit', 'reached_hub'].includes(newStatus)) {
        sellerOrder.fulfillmentStatus = 'Shipped';
      } else if (newStatus === 'out_for_delivery') {
        sellerOrder.fulfillmentStatus = 'Out for Delivery';
      } else if (newStatus === 'delivered') {
        sellerOrder.fulfillmentStatus = 'Delivered';
        sellerOrder.deliveredAt = now;
      } else if (['rto_delivered', 'damaged'].includes(newStatus)) {
        sellerOrder.fulfillmentStatus = 'Returned';
      }

      if (trackingNumber) {
        sellerOrder.logistics = sellerOrder.logistics || {};
        sellerOrder.logistics.trackingId = trackingNumber;
        sellerOrder.logistics.courierName = shipment.courierName;
      }
      await sellerOrder.save();

      // Re-derive Master Order status dynamically
      await deriveMasterOrderStatus(shipment.masterOrderId);
    }

    // Customer Notifications
    let notifTitle = 'Shipment Update';
    let notifMsg = `Shipment #${shipment.shipmentId} status updated to ${newStatus.replace(/_/g, ' ')}.`;

    if (newStatus === 'in_transit' || newStatus === 'picked_up') {
      notifTitle = 'Package Shipped';
      notifMsg = `Your package #${shipment.shipmentId} has been picked up by ${shipment.courierName} and is in transit.`;
    } else if (newStatus === 'out_for_delivery') {
      notifTitle = 'Out for Delivery';
      notifMsg = `Your KAIA package #${shipment.shipmentId} is out for delivery today!`;
    } else if (newStatus === 'delivered') {
      notifTitle = 'Package Delivered';
      notifMsg = `Your KAIA package #${shipment.shipmentId} has been successfully delivered.`;
    } else if (newStatus === 'delivery_attempted') {
      notifTitle = 'Delivery Attempted';
      notifMsg = `Courier attempted delivery for #${shipment.shipmentId}. A re-attempt will be made on the next working day.`;
    } else if (newStatus.startsWith('rto')) {
      notifTitle = 'Return to Origin Initiated';
      notifMsg = `Package #${shipment.shipmentId} is being returned to the brand warehouse.`;
    }

    await Notification.create({
      user: shipment.customerId,
      title: notifTitle,
      message: notifMsg,
      type: 'Order',
    });

    await AuditLog.create({
      user: userContext?._id || shipment.customerId,
      brand: shipment.brandId,
      action: 'SHIPMENT_STATUS_UPDATED',
      entity: 'Shipment',
      entityId: shipment._id,
      changes: { previousStatus: prevStatus, newStatus, description },
    });

    return { success: true, shipment };
  }

  /**
   * 5. Ingest Provider Webhook Idempotently
   */
  async processShippingWebhook({ payload, headers = {} }) {
    const eventId =
      payload?.id ||
      payload?.event_id ||
      payload?.provider_event_id ||
      `${payload?.current_status || payload?.status}-${payload?.shipment_id || payload?.awb}`;

    // Idempotency check with WebhookEvent model
    const existing = await WebhookEvent.findOne({ eventId });
    if (existing) {
      return { success: true, duplicate: true, message: 'Webhook event already processed.' };
    }

    const webhookRecord = await WebhookEvent.create({
      provider: 'shiprocket',
      eventId,
      eventType: payload?.current_status || payload?.status || 'SHIPMENT_UPDATE',
      processed: false,
    });

    try {
      const awb = payload?.awb || payload?.awb_code;
      const srStatus = (payload?.current_status || payload?.status || '').toLowerCase();

      let mappedStatus = 'in_transit';
      if (srStatus.includes('pick') || srStatus.includes('manifest')) mappedStatus = 'picked_up';
      else if (srStatus.includes('transit') || srStatus.includes('in-transit')) mappedStatus = 'in_transit';
      else if (srStatus.includes('hub') || srStatus.includes('reached')) mappedStatus = 'reached_hub';
      else if (srStatus.includes('out')) mappedStatus = 'out_for_delivery';
      else if (srStatus.includes('attempt') || srStatus.includes('undeliv')) mappedStatus = 'delivery_attempted';
      else if (srStatus.includes('deliv')) mappedStatus = 'delivered';
      else if (srStatus.includes('lost')) mappedStatus = 'lost';
      else if (srStatus.includes('damage')) mappedStatus = 'damaged';
      else if (srStatus.includes('rto')) mappedStatus = 'rto_in_transit';
      else if (srStatus.includes('cancel')) mappedStatus = 'cancelled';

      const shipment = await Shipment.findOne({
        $or: [
          { awbNumber: awb },
          { trackingNumber: awb },
          { 'providerReference.providerShipmentId': payload?.shipment_id?.toString() },
        ],
      });

      if (shipment) {
        await this.updateShipmentStatus({
          shipmentId: shipment._id,
          newStatus: mappedStatus,
          location: payload?.current_location || payload?.scans?.[0]?.location || '',
          description: payload?.activity || payload?.status || `Status update from carrier: ${mappedStatus}`,
          trackingNumber: awb,
          courierName: payload?.courier_name || shipment.courierName,
        });
      }

      webhookRecord.processed = true;
      webhookRecord.processedAt = new Date();
      await webhookRecord.save();

      return { success: true, processed: true, mappedStatus };
    } catch (err) {
      webhookRecord.processed = false;
      webhookRecord.processingError = err.message;
      await webhookRecord.save();
      throw err;
    }
  }

  /**
   * 6. Track Shipment with Timeline & IDOR Security
   */
  async getShipmentTracking(shipmentId, user) {
    const isObjectId = mongoose.Types.ObjectId.isValid(shipmentId);
    const query = isObjectId ? { $or: [{ _id: shipmentId }, { shipmentId }] } : { shipmentId };

    const shipment = await Shipment.findOne(query)
      .populate('masterOrderId', 'orderId orderStatus paymentStatus createdAt')
      .populate('sellerOrderId', 'orderId fulfillmentStatus finalAmount')
      .populate('warehouseId', 'name code city state')
      .populate('brandId', 'name slug logo contactEmail contactPhone')
      .populate('customerId', 'name email phone');

    if (!shipment) throw new Error('Shipment not found.');

    // Security Check: Customer can only view own, Brand can only view own, Admin can view all
    const isCustomer = user?.role === 'CUSTOMER' && shipment.customerId?._id?.toString() === user?._id?.toString();
    const isBrand = user?.role === 'BRAND' && shipment.brandId?._id?.toString() === user?.brand?.toString();
    const isAdmin = user?.role === 'ADMIN';

    if (!isCustomer && !isBrand && !isAdmin) {
      throw new Error('Unauthorized access to tracking details.');
    }

    const events = await ShipmentTrackingEvent.find({ shipmentId: shipment._id }).sort({ eventTime: 1 });

    return {
      success: true,
      shipment,
      events,
    };
  }
}

export const shippingService = new ShippingService();
export default shippingService;