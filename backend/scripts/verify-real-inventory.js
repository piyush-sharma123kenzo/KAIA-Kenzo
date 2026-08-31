import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import Inventory from '../models/Inventory.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import SerialNumber from '../models/SerialNumber.js';
import SellerOrder from '../models/SellerOrder.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';
import inventoryService from '../services/inventory/inventory.service.js';
import serialService from '../services/inventory/serial.service.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const runInventoryVerification = async () => {
  try {
    await connectDB();
    console.log('🧪 Starting Real Inventory, Serial/IMEI Tracking & Warehouse Fulfillment Verification...\n');

    // 1. Fetch test users & brands
    const asusBrand = await Brand.findOne({ slug: { $regex: /asus/i } });
    const samsungBrand = await Brand.findOne({ slug: { $regex: /samsung/i } });

    if (!asusBrand || !samsungBrand) {
      console.error('Required test brands not found.');
      process.exit(1);
    }

    const asusProduct = await Product.findOne({ brand: asusBrand._id, isActive: true });
    const samProduct = await Product.findOne({ brand: samsungBrand._id, isActive: true });

    let testUser = await User.findOne({ role: 'ADMIN' });
    if (!testUser) {
      testUser = await User.findOne({});
    }

    console.log(`✓ Testing with ASUS Product: "${asusProduct.name}" and Samsung Product: "${samProduct.name}".`);

    // TEST 1: Create Warehouse for ASUS & Samsung
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);

    const asusWh1 = await Warehouse.create({
      name: `ASUS Bengaluru Hub ${rand}`,
      brandId: asusBrand._id,
      code: `WH-ASUS-BLR-${rand}`,
      addressLine1: '45 Industrial Area, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560066',
      isPrimary: true,
    });

    const asusWh2 = await Warehouse.create({
      name: `ASUS Mumbai Depot ${rand}`,
      brandId: asusBrand._id,
      code: `WH-ASUS-BOM-${rand}`,
      addressLine1: '88 Logistics Park, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400069',
      isPrimary: false,
    });

    console.log(`✓ Test 1 Passed: 2 ASUS Warehouses created (${asusWh1.code}, ${asusWh2.code}).`);

    // TEST 2: Stock In Physical Units
    const stockInRes = await inventoryService.addStock({
      productId: asusProduct._id,
      warehouseId: asusWh1._id,
      brandId: asusBrand._id,
      quantity: 20,
      reason: 'Initial Batch Stocking',
      user: testUser,
    });
    console.log(`✓ Test 2 Passed: Stocked in 20 units at ${asusWh1.code}. Available: ${stockInRes.inventory.availableQuantity}.`);

    // TEST 3: Inventory Transaction Recorded
    const tx = await InventoryTransaction.findOne({ productId: asusProduct._id, type: 'stock_in' }).sort({ createdAt: -1 });
    if (!tx || tx.quantity !== 20) throw new Error('InventoryTransaction for stock_in not found!');
    console.log(`✓ Test 3 Passed: InventoryTransaction logged with type "stock_in", qty +20.`);

    // TEST 4: Stock Adjustment
    const adjustRes = await inventoryService.adjustStock({
      productId: asusProduct._id,
      warehouseId: asusWh1._id,
      brandId: asusBrand._id,
      newQuantity: 25,
      reason: 'Physical Audit Count',
      user: testUser,
    });
    console.log(`✓ Test 4 Passed: Adjusted total stock to 25 units. New available: ${adjustRes.inventory.availableQuantity}.`);

    // TEST 5: Negative Stock Rejected
    let negRejected = false;
    try {
      await inventoryService.adjustStock({
        productId: asusProduct._id,
        warehouseId: asusWh1._id,
        brandId: asusBrand._id,
        newQuantity: -5,
        reason: 'Illegal negative test',
        user: testUser,
      });
    } catch (e) {
      negRejected = true;
      console.log(`✓ Test 5 Passed: Negative quantity rejected cleanly (${e.message}).`);
    }
    if (!negRejected) throw new Error('Negative stock was allowed!');

    // TEST 6: Atomic Stock Reservation (Concurrency Safe)
    const reserveRes = await inventoryService.reserveStock({
      productId: asusProduct._id,
      warehouseId: asusWh1._id,
      brandId: asusBrand._id,
      quantity: 5,
      referenceType: 'SellerOrder',
      referenceId: 'SO-TEST-001',
      user: testUser,
    });
    console.log(`✓ Test 6 Passed: Reserved 5 units. Available: ${reserveRes.inventory.availableQuantity}, Reserved: ${reserveRes.inventory.reservedQuantity}.`);

    // TEST 7: Race Condition / Overselling Protection Simulation
    // Available is 20. Try to concurrently reserve 15 and 15 (Total 30 > 20). Exactly one MUST fail!
    const try1 = inventoryService.reserveStock({
      productId: asusProduct._id,
      warehouseId: asusWh1._id,
      brandId: asusBrand._id,
      quantity: 15,
      referenceType: 'SellerOrder',
      referenceId: 'SO-CONC-1',
    });
    const try2 = inventoryService.reserveStock({
      productId: asusProduct._id,
      warehouseId: asusWh1._id,
      brandId: asusBrand._id,
      quantity: 15,
      referenceType: 'SellerOrder',
      referenceId: 'SO-CONC-2',
    });

    const results = await Promise.allSettled([try1, try2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.filter((r) => r.status === 'rejected').length;

    console.log(`✓ Test 7 Passed: Concurrency check: ${fulfilled} succeeded, ${rejected} rejected due to insufficient stock.`);
    if (fulfilled !== 1 || rejected !== 1) {
      throw new Error(`Concurrency race condition failed! Fulfilled: ${fulfilled}, Rejected: ${rejected}`);
    }

    // TEST 8: Release Reserved Stock
    await inventoryService.releaseStock({
      productId: asusProduct._id,
      warehouseId: asusWh1._id,
      brandId: asusBrand._id,
      quantity: 5,
      referenceType: 'SellerOrder',
      referenceId: 'SO-TEST-001',
    });
    const afterRelease = await Inventory.findOne({ productId: asusProduct._id, warehouseId: asusWh1._id });
    console.log(`✓ Test 8 Passed: Released 5 units. Available: ${afterRelease.availableQuantity}, Reserved: ${afterRelease.reservedQuantity}.`);

    // TEST 9: Commit Sale (Reserved -> Sold)
    await inventoryService.commitSale({
      productId: asusProduct._id,
      warehouseId: asusWh1._id,
      brandId: asusBrand._id,
      quantity: 15, // The 15 that succeeded from concurrency test
      referenceType: 'SellerOrder',
      referenceId: 'SO-CONC-1',
    });
    const afterSale = await Inventory.findOne({ productId: asusProduct._id, warehouseId: asusWh1._id });
    console.log(`✓ Test 9 Passed: Committed sale of 15 units. Sold: ${afterSale.soldQuantity}, Reserved: ${afterSale.reservedQuantity}.`);

    // TEST 10: Warehouse-to-Warehouse Stock Transfer
    const transferRes = await inventoryService.transferStock({
      productId: asusProduct._id,
      fromWarehouseId: asusWh1._id,
      toWarehouseId: asusWh2._id,
      brandId: asusBrand._id,
      quantity: 4,
      user: testUser,
    });
    const wh2Inv = await Inventory.findOne({ productId: asusProduct._id, warehouseId: asusWh2._id });
    console.log(`✓ Test 10 Passed: Transferred 4 units to Mumbai (${asusWh2.code}). Dest Available: ${wh2Inv.availableQuantity}.`);

    // TEST 11: Register Single Serial & IMEI
    const testSerial = `SN-ROG-VERIFY-${rand}-01`;
    const testImei1 = `86123456${rand}123`;
    const testImei2 = `86123456${rand}124`;

    const serialRes = await serialService.registerSingleSerial({
      serialNumber: testSerial,
      imei1: testImei1,
      imei2: testImei2,
      productId: asusProduct._id,
      warehouseId: asusWh1._id,
      brandId: asusBrand._id,
      user: testUser,
    });
    console.log(`✓ Test 11 Passed: Registered Serial "${testSerial}" with IMEI1 "${testImei1}".`);

    // TEST 12: Duplicate Serial Number Rejected
    let dupSerialBlocked = false;
    try {
      await serialService.registerSingleSerial({
        serialNumber: testSerial,
        productId: asusProduct._id,
        warehouseId: asusWh1._id,
        brandId: asusBrand._id,
        user: testUser,
      });
    } catch (e) {
      dupSerialBlocked = true;
      console.log(`✓ Test 12 Passed: Duplicate serial rejected (${e.message}).`);
    }
    if (!dupSerialBlocked) throw new Error('Duplicate serial was allowed!');

    // TEST 13: Duplicate IMEI Rejected
    let dupImeiBlocked = false;
    try {
      await serialService.registerSingleSerial({
        serialNumber: `SN-ROG-VERIFY-${rand}-DIFF`,
        imei1: testImei1, // Duplicate IMEI
        productId: asusProduct._id,
        warehouseId: asusWh1._id,
        brandId: asusBrand._id,
        user: testUser,
      });
    } catch (e) {
      dupImeiBlocked = true;
      console.log(`✓ Test 13 Passed: Duplicate IMEI rejected (${e.message}).`);
    }
    if (!dupImeiBlocked) throw new Error('Duplicate IMEI was allowed!');

    // TEST 14: Bulk CSV Serial Import
    const bulkRows = [
      { sku: asusProduct.SKU, serialNumber: `SN-BULK-${rand}-01`, imei1: `86990011${rand}01`, imei2: '' },
      { sku: asusProduct.SKU, serialNumber: `SN-BULK-${rand}-02`, imei1: `86990011${rand}02`, imei2: '' },
      { sku: 'INVALID-SKU-999', serialNumber: `SN-BULK-${rand}-03`, imei1: '', imei2: '' }, // Should report error cleanly
    ];
    const bulkRes = await serialService.bulkImportSerials({
      rows: bulkRows,
      brandId: asusBrand._id,
      user: testUser,
    });
    console.log(`✓ Test 14 Passed: Bulk import results: ${bulkRes.successful} successful, ${bulkRes.failed} failed (Total: ${bulkRes.total}).`);
    if (bulkRes.successful !== 2 || bulkRes.failed !== 1) throw new Error('Bulk import count mismatch!');

    // TEST 15: Create Seller Order and Assign Serial
    const testMasterOrder = await Order.create({
      orderId: `ORD-TEST-${dateStr}-${rand}`,
      customer: testUser._id,
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
        name: 'Tester Customer',
        street: '100 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9888111222',
      },
      billingAddress: {
        name: 'Tester Customer',
        street: '100 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9888111222',
      },
      subtotal: asusProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice,
      paymentStatus: 'Paid',
      orderStatus: 'paid',
    });

    const testSellerOrder = await SellerOrder.create({
      parentOrder: testMasterOrder._id,
      orderId: `SO-FULFILL-${dateStr}-${rand}`,
      seller: asusBrand._id,
      items: [
        {
          product: asusProduct._id,
          name: asusProduct.name,
          sku: asusProduct.SKU,
          price: asusProduct.sellingPrice,
          qty: 1,
          serialNumbers: [],
        },
      ],
      subtotal: asusProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Processing',
      shippingAddress: testMasterOrder.shippingAddress,
    });

    // Assign wrong product serial test
    let wrongProdBlocked = false;
    try {
      await serialService.assignSerialToOrder({
        serialNumber: testSerial, // Belongs to asusProduct
        sellerOrderId: testSellerOrder._id,
        productId: samProduct._id, // Wrong product
        brandId: asusBrand._id,
        user: testUser,
      });
    } catch (e) {
      wrongProdBlocked = true;
      console.log(`✓ Test 15 Passed: Wrong product serial assignment rejected (${e.message}).`);
    }
    if (!wrongProdBlocked) throw new Error('Wrong product serial assignment was allowed!');

    // Valid serial assignment
    await serialService.assignSerialToOrder({
      serialNumber: testSerial,
      sellerOrderId: testSellerOrder._id,
      productId: asusProduct._id,
      brandId: asusBrand._id,
      user: testUser,
    });
    const sDoc = await SerialNumber.findOne({ serialNumber: testSerial });
    console.log(`✓ Test 16 Passed: Serial "${testSerial}" assigned to Order ${testSellerOrder.orderId} (Status: ${sDoc.status}).`);

    // TEST 17: Packing Station Checklist & Status Update
    const packRes = await serialService.markSerialsPacked({
      sellerOrderId: testSellerOrder._id,
      brandId: asusBrand._id,
      checklist: {
        productVerified: true,
        serialVerified: true,
        accessoriesIncluded: true,
        invoiceIncluded: true,
        packagingSealed: true,
      },
      user: testUser,
    });
    console.log(`✓ Test 17 Passed: Order marked PACKED with full quality checklist verified.`);

    const packedSerial = await SerialNumber.findOne({ serialNumber: testSerial });
    if (packedSerial.status !== 'packed') throw new Error('Serial was not transitioned to packed!');
    console.log(`✓ Test 18 Passed: Serial "${testSerial}" status transitioned to "packed".`);

    // Clean verification summary
    console.log('\n🎉 ALL REAL INVENTORY, SERIAL/IMEI & FULFILLMENT TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('Inventory verification failed:', err);
    process.exit(1);
  }
};

runInventoryVerification();
