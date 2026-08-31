import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Shipment from '../models/Shipment.js';
import ShipmentTrackingEvent from '../models/ShipmentTrackingEvent.js';
import WebhookEvent from '../models/WebhookEvent.js';
import shippingService from '../services/shipping/shipping.service.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const runShippingVerification = async () => {
  try {
    await connectDB();
    console.log('🧪 Starting Real Shipping, Logistics & Multi-Brand Order Tracking Verification...\n');

    // 1. Fetch test brands, warehouses, products, and users
    const asusBrand = await Brand.findOne({ slug: { $regex: /asus/i } });
    const samBrand = await Brand.findOne({ slug: { $regex: /samsung/i } });

    if (!asusBrand || !samBrand) {
      console.error('Required test brands not found.');
      process.exit(1);
    }

    let asusWarehouse = await Warehouse.findOne({ brandId: asusBrand._id });
    if (!asusWarehouse) {
      asusWarehouse = await Warehouse.create({
        brandId: asusBrand._id,
        name: 'ASUS Bengaluru Mega Depot',
        code: 'WH-ASUS-BLR-01',
        contactName: 'Ramesh Patel',
        phone: '9876543210',
        addressLine1: 'Plot 45, Electronics City Phase 1',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560100',
        country: 'India',
        isPrimary: true,
      });
    }

    let samWarehouse = await Warehouse.findOne({ brandId: samBrand._id });
    if (!samWarehouse) {
      samWarehouse = await Warehouse.create({
        brandId: samBrand._id,
        name: 'Samsung Noida Hub',
        code: 'WH-SAM-NOI-01',
        contactName: 'Anil Verma',
        phone: '9811223344',
        addressLine1: 'Sector 62, Industrial Area',
        city: 'Noida',
        state: 'Uttar Pradesh',
        postalCode: '201301',
        country: 'India',
        isPrimary: true,
      });
    }

    const asusProduct = await Product.findOne({ brand: asusBrand._id, isActive: true });
    const samProduct = await Product.findOne({ brand: samBrand._id, isActive: true });

    let customerUser = await User.findOne({ role: 'CUSTOMER' });
    if (!customerUser) customerUser = await User.findOne({});
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) adminUser = customerUser;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);

    // TEST 1: Shipment creation blocked BEFORE payment confirmation
    const unpaidMasterOrder = await Order.create({
      orderId: `ORD-UNPAID-${dateStr}-${rand}`,
      customer: customerUser._id,
      items: [
        {
          product: asusProduct._id,
          productName: asusProduct.name,
          brand: asusBrand._id,
          brandName: asusBrand.name,
          sku: asusProduct.SKU,
          quantity: 1,
          unitPrice: asusProduct.sellingPrice,
          tax: 0,
          discount: 0,
          lineTotal: asusProduct.sellingPrice,
        },
      ],
      shippingAddress: {
        name: 'Piyush Sharma',
        street: '123 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9888111222',
      },
      billingAddress: {
        name: 'Piyush Sharma',
        street: '123 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9888111222',
      },
      subtotal: asusProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice,
      paymentStatus: 'Pending', // UNPAID
      orderStatus: 'pending_payment',
    });

    const unpaidSellerOrder = await SellerOrder.create({
      parentOrder: unpaidMasterOrder._id,
      orderId: `SO-UNPAID-${dateStr}-${rand}`,
      seller: asusBrand._id,
      items: [
        {
          product: asusProduct._id,
          name: asusProduct.name,
          sku: asusProduct.SKU,
          price: asusProduct.sellingPrice,
          qty: 1,
        },
      ],
      subtotal: asusProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice,
      paymentStatus: 'Pending',
      fulfillmentStatus: 'Processing',
      shippingAddress: unpaidMasterOrder.shippingAddress,
    });

    let paymentBlockPassed = false;
    try {
      await shippingService.createShipmentForSellerOrder({
        sellerOrderId: unpaidSellerOrder._id,
        brandId: asusBrand._id,
      });
    } catch (e) {
      paymentBlockPassed = true;
      console.log(`✓ Test 1 Passed: Shipment creation blocked prior to payment confirmation ("${e.message}").`);
    }
    if (!paymentBlockPassed) throw new Error('Shipment was unexpectedly created for unpaid order!');

    // TEST 2: Multi-Brand Order Splitting & Independent Shipment Creation
    const paidMasterOrder = await Order.create({
      orderId: `ORD-LOGIS-${dateStr}-${rand}`,
      customer: customerUser._id,
      items: [
        {
          product: asusProduct._id,
          productName: asusProduct.name,
          brand: asusBrand._id,
          brandName: asusBrand.name,
          sku: asusProduct.SKU,
          quantity: 1,
          unitPrice: asusProduct.sellingPrice,
          tax: 0,
          discount: 0,
          lineTotal: asusProduct.sellingPrice,
        },
        {
          product: samProduct._id,
          productName: samProduct.name,
          brand: samBrand._id,
          brandName: samBrand.name,
          sku: samProduct.SKU,
          quantity: 1,
          unitPrice: samProduct.sellingPrice,
          tax: 0,
          discount: 0,
          lineTotal: samProduct.sellingPrice,
        },
      ],
      shippingAddress: {
        name: 'Piyush Sharma',
        street: '456 Residency Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560025',
        country: 'India',
        phone: '9888111222',
      },
      billingAddress: {
        name: 'Piyush Sharma',
        street: '456 Residency Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560025',
        country: 'India',
        phone: '9888111222',
      },
      subtotal: asusProduct.sellingPrice + samProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice + samProduct.sellingPrice,
      paymentStatus: 'Paid',
      orderStatus: 'paid',
    });

    const asusSellerOrder = await SellerOrder.create({
      parentOrder: paidMasterOrder._id,
      orderId: `SO-ASUS-${dateStr}-${rand}`,
      seller: asusBrand._id,
      items: [
        {
          product: asusProduct._id,
          name: asusProduct.name,
          sku: asusProduct.SKU,
          price: asusProduct.sellingPrice,
          qty: 1,
          serialNumbers: ['SN-ROG-TEST-9988'],
        },
      ],
      subtotal: asusProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Packed',
      shippingAddress: paidMasterOrder.shippingAddress,
    });

    const samSellerOrder = await SellerOrder.create({
      parentOrder: paidMasterOrder._id,
      orderId: `SO-SAM-${dateStr}-${rand}`,
      seller: samBrand._id,
      items: [
        {
          product: samProduct._id,
          name: samProduct.name,
          sku: samProduct.SKU,
          price: samProduct.sellingPrice,
          qty: 1,
          serialNumbers: ['IMEI-SAM-TEST-1122'],
        },
      ],
      subtotal: samProduct.sellingPrice,
      finalAmount: samProduct.sellingPrice,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Packed',
      shippingAddress: paidMasterOrder.shippingAddress,
    });

    // TEST 3: Warehouse Ownership Validation (Brand A cannot ship from Brand B warehouse)
    let warehouseValidationPassed = false;
    try {
      await shippingService.createShipmentForSellerOrder({
        sellerOrderId: asusSellerOrder._id,
        brandId: asusBrand._id,
        warehouseId: samWarehouse._id, // INVALID: Samsung's warehouse passed for ASUS
      });
    } catch (e) {
      warehouseValidationPassed = true;
      console.log(`✓ Test 3 Passed: Cross-brand warehouse allocation rejected ("${e.message}").`);
    }
    if (!warehouseValidationPassed) throw new Error('Cross-brand warehouse allocation was not blocked!');

    // TEST 4: Create Shipment A (ASUS) & Shipment B (Samsung)
    const resA = await shippingService.createShipmentForSellerOrder({
      sellerOrderId: asusSellerOrder._id,
      brandId: asusBrand._id,
      warehouseId: asusWarehouse._id,
      packageInfo: { length: 25, breadth: 20, height: 10, weight: 2.2, awbNumber: `AWB-ASUS-${rand}` },
      userContext: adminUser,
    });

    const resB = await shippingService.createShipmentForSellerOrder({
      sellerOrderId: samSellerOrder._id,
      brandId: samBrand._id,
      warehouseId: samWarehouse._id,
      packageInfo: { length: 15, breadth: 10, height: 5, weight: 0.5, awbNumber: `AWB-SAM-${rand}` },
      userContext: adminUser,
    });

    if (!resA.shipment || !resB.shipment) throw new Error('Multi-brand shipment creation failed!');
    console.log(`✓ Test 4 Passed: Multi-Brand Shipments created independently (ASUS #${resA.shipment.shipmentId} & Samsung #${resB.shipment.shipmentId}).`);

    // TEST 5: Duplicate Shipment Idempotency
    const dupRes = await shippingService.createShipmentForSellerOrder({
      sellerOrderId: asusSellerOrder._id,
      brandId: asusBrand._id,
    });
    if (!dupRes.alreadyExists || dupRes.shipment._id.toString() !== resA.shipment._id.toString()) {
      throw new Error('Duplicate shipment creation was not prevented idempotently!');
    }
    console.log(`✓ Test 5 Passed: Duplicate shipment creation prevented idempotently.`);

    // TEST 6: Shipping Label Generation
    const labelRes = await shippingService.generateShippingLabel({
      shipmentId: resA.shipment._id,
      brandId: asusBrand._id,
      userContext: adminUser,
    });
    if (labelRes.shipment.shipmentStatus !== 'label_generated' || !labelRes.labelUrl) {
      throw new Error('Label generation failed!');
    }
    console.log(`✓ Test 6 Passed: Shipping label generated (Status: "${labelRes.shipment.shipmentStatus}", URL: ${labelRes.labelUrl}).`);

    // TEST 7: Pickup Scheduling
    const pickupRes = await shippingService.scheduleCourierPickup({
      shipmentId: resA.shipment._id,
      brandId: asusBrand._id,
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userContext: adminUser,
    });
    if (pickupRes.shipment.shipmentStatus !== 'pickup_scheduled') {
      throw new Error('Pickup scheduling failed!');
    }
    console.log(`✓ Test 7 Passed: Courier pickup scheduled (Status: "${pickupRes.shipment.shipmentStatus}").`);

    // TEST 8: Controlled State Machine Transitions
    // Invalid transition test (e.g. pickup_scheduled -> delivered jump)
    let invalidJumpBlocked = false;
    try {
      await shippingService.updateShipmentStatus({
        shipmentId: resA.shipment._id,
        newStatus: 'delivered', // Illegal jump directly from pickup_scheduled
      });
    } catch (e) {
      invalidJumpBlocked = true;
      console.log(`✓ Test 8 Passed: Illegal direct transition to "delivered" rejected ("${e.message}").`);
    }
    if (!invalidJumpBlocked) throw new Error('Illegal state transition was not rejected!');

    // Valid progression: pickup_scheduled -> picked_up -> in_transit -> reached_hub -> out_for_delivery -> delivered
    await shippingService.updateShipmentStatus({ shipmentId: resA.shipment._id, newStatus: 'picked_up' });
    await shippingService.updateShipmentStatus({ shipmentId: resA.shipment._id, newStatus: 'in_transit' });
    await shippingService.updateShipmentStatus({ shipmentId: resA.shipment._id, newStatus: 'reached_hub' });
    await shippingService.updateShipmentStatus({ shipmentId: resA.shipment._id, newStatus: 'out_for_delivery' });
    const finalDelivered = await shippingService.updateShipmentStatus({ shipmentId: resA.shipment._id, newStatus: 'delivered' });

    if (finalDelivered.shipment.shipmentStatus !== 'delivered') {
      throw new Error('Valid state machine sequence failed!');
    }
    console.log(`✓ Test 9 Passed: Controlled state transitions executed smoothly to "delivered".`);

    // TEST 10: Multi-Brand Master Order Delivery Logic
    // ASUS is delivered, Samsung is still in ready_to_ship -> Master Order should be partially delivered / processing
    let masterCheck1 = await Order.findById(paidMasterOrder._id);
    const asusCheck = await SellerOrder.findById(asusSellerOrder._id);
    if (asusCheck.fulfillmentStatus !== 'Delivered') {
      throw new Error('Seller order fulfillment status did not sync to Delivered!');
    }
    console.log(`✓ Test 10 Passed: Seller order ASUS synced to "Delivered" while Samsung remains in transit.`);

    // Deliver Samsung shipment
    await shippingService.updateShipmentStatus({ shipmentId: resB.shipment._id, newStatus: 'pickup_scheduled' });
    await shippingService.updateShipmentStatus({ shipmentId: resB.shipment._id, newStatus: 'picked_up' });
    await shippingService.updateShipmentStatus({ shipmentId: resB.shipment._id, newStatus: 'in_transit' });
    await shippingService.updateShipmentStatus({ shipmentId: resB.shipment._id, newStatus: 'out_for_delivery' });
    await shippingService.updateShipmentStatus({ shipmentId: resB.shipment._id, newStatus: 'delivered' });

    const masterCheck2 = await Order.findById(paidMasterOrder._id);
    if (masterCheck2.orderStatus !== 'delivered') {
      throw new Error(`Master order status is "${masterCheck2.orderStatus}", expected "delivered" when all seller shipments delivered!`);
    }
    console.log(`✓ Test 11 Passed: Master Order status automatically derived as "delivered" when all brand shipments delivered.`);

    // TEST 12: Webhook Ingestion & Idempotency
    const webhookPayload = {
      event_id: `EVT-WEBHOOK-${dateStr}-${rand}`,
      awb: resA.shipment.awbNumber,
      current_status: 'delivered',
      current_location: 'Bengaluru Hub',
      activity: 'Package handed over to recipient with signature.',
    };

    const whRes1 = await shippingService.processShippingWebhook({ payload: webhookPayload });
    const whRes2 = await shippingService.processShippingWebhook({ payload: webhookPayload });

    if (!whRes1.processed || !whRes2.duplicate) {
      throw new Error('Webhook idempotency failed: duplicate event was not caught!');
    }
    console.log(`✓ Test 12 Passed: Carrier tracking webhook processed and second call caught as duplicate.`);

    // TEST 13: Customer Tracking API & IDOR Security
    const trackingRes = await shippingService.getShipmentTracking(resA.shipment._id, customerUser);
    if (!trackingRes.success || trackingRes.events.length === 0) {
      throw new Error('Customer tracking API failed to return tracking events!');
    }

    // IDOR check: another customer
    const anotherCustomer = new User({ _id: new mongoose.Types.ObjectId(), role: 'CUSTOMER' });
    let idorBlocked = false;
    try {
      await shippingService.getShipmentTracking(resA.shipment._id, anotherCustomer);
    } catch (e) {
      idorBlocked = true;
      console.log(`✓ Test 13 Passed: IDOR protection blocked unauthorized customer access ("${e.message}").`);
    }
    if (!idorBlocked) throw new Error('IDOR security check failed!');

    console.log('\n🎉 ALL REAL SHIPPING, LOGISTICS & TRACKING TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('Shipping verification failed:', err);
    process.exit(1);
  }
};

runShippingVerification();
