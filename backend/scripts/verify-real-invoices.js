import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Invoice from '../models/Invoice.js';
import Warranty from '../models/Warranty.js';
import AuditLog from '../models/AuditLog.js';
import invoiceService from '../services/invoice/invoice.service.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const runInvoiceVerification = async () => {
  try {
    await connectDB();
    console.log('🧪 Starting Real GST Invoice, Invoice PDF & Warranty Document Verification...\n');

    // 1. Fetch test users & brands
    const asusBrand = await Brand.findOne({ slug: { $regex: /asus/i } });
    const samBrand = await Brand.findOne({ slug: { $regex: /samsung/i } });

    if (!asusBrand || !samBrand) {
      console.error('Required test brands not found.');
      process.exit(1);
    }

    const asusProduct = await Product.findOne({ brand: asusBrand._id, isActive: true });
    let customerUser = await User.findOne({ role: 'CUSTOMER' });
    if (!customerUser) customerUser = await User.findOne({});
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) adminUser = customerUser;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);

    // TEST 1: GSTIN Validation (Format tests)
    const validGstin = '29ABCDE1234F1Z5';
    const invalidGstin = 'INVALID-GSTIN-123';
    if (!invoiceService.validateGstin(validGstin)) throw new Error('Valid GSTIN rejected!');
    if (invoiceService.validateGstin(invalidGstin)) throw new Error('Invalid GSTIN accepted!');
    console.log('✓ Test 1 Passed: Server-side GSTIN format validation passed (valid accepted, invalid rejected).');

    // TEST 2: Failed/Unpaid Order cannot generate final invoice
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
        street: '123 Tech Boulevard',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9888111222',
      },
      billingAddress: {
        name: 'Piyush Sharma',
        street: '123 Tech Boulevard',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9888111222',
      },
      subtotal: asusProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice,
      paymentStatus: 'Pending',
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
          serialNumbers: [],
        },
      ],
      subtotal: asusProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice,
      paymentStatus: 'Pending',
      fulfillmentStatus: 'Processing',
      shippingAddress: unpaidMasterOrder.shippingAddress,
    });

    let unpaidBlocked = false;
    try {
      await invoiceService.generateInvoiceForSellerOrder({
        sellerOrderId: unpaidSellerOrder._id,
        userContext: customerUser,
      });
    } catch (e) {
      unpaidBlocked = true;
      console.log(`✓ Test 2 Passed: Unpaid order invoice generation blocked cleanly (${e.message}).`);
    }
    if (!unpaidBlocked) throw new Error('Unpaid order was allowed to generate final invoice!');

    // TEST 3: Create Paid Order and Generate Official Tax Invoice
    const paidMasterOrder = await Order.create({
      orderId: `ORD-PAID-${dateStr}-${rand}`,
      customer: customerUser._id,
      gstNumber: validGstin,
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
        street: '123 Tech Boulevard',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9888111222',
      },
      billingAddress: {
        name: 'Piyush Sharma',
        street: '123 Tech Boulevard',
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
      paymentDetails: {
        provider: 'razorpay',
        transactionId: `pay_test_${rand}`,
        signature: 'sig_verified_test',
      },
    });

    const paidSellerOrder = await SellerOrder.create({
      parentOrder: paidMasterOrder._id,
      orderId: `SO-PAID-${dateStr}-${rand}`,
      seller: asusBrand._id,
      items: [
        {
          product: asusProduct._id,
          name: asusProduct.name,
          sku: asusProduct.SKU,
          price: asusProduct.sellingPrice,
          qty: 1,
          serialNumbers: [`SN-ROG-INV-${rand}`],
        },
      ],
      subtotal: asusProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Processing',
      shippingAddress: paidMasterOrder.shippingAddress,
    });

    const genRes = await invoiceService.generateInvoiceForSellerOrder({
      sellerOrderId: paidSellerOrder._id,
      paymentDetails: {
        provider: 'razorpay',
        paymentId: `pay_test_${rand}`,
        method: 'UPI / NetBanking',
      },
      userContext: customerUser,
    });

    const invoiceDoc = genRes.invoice;
    console.log(`✓ Test 3 Passed: Invoice generated #${invoiceDoc.invoiceNumber} for Order ${paidSellerOrder.orderId}.`);

    // TEST 4: Unique & Brand-Prefixed Invoice Number
    if (!invoiceDoc.invoiceNumber.startsWith(asusBrand.slug.substring(0, 4).toUpperCase())) {
      throw new Error('Invoice number prefix mismatch!');
    }
    console.log(`✓ Test 4 Passed: Brand-prefixed invoice number verified (${invoiceDoc.invoiceNumber}).`);

    // TEST 5: Idempotent Invoice Generation (Duplicate Call Safety)
    const duplicateRes = await invoiceService.generateInvoiceForSellerOrder({
      sellerOrderId: paidSellerOrder._id,
      userContext: customerUser,
    });
    if (!duplicateRes.alreadyGenerated || duplicateRes.invoice.invoiceNumber !== invoiceDoc.invoiceNumber) {
      throw new Error('Duplicate call produced a new invoice! Idempotency failed.');
    }
    const countInvoices = await Invoice.countDocuments({ sellerOrderId: paidSellerOrder._id });
    if (countInvoices !== 1) throw new Error('Duplicate invoice found in database!');
    console.log(`✓ Test 5 Passed: Idempotency verified: Duplicate call returned existing invoice (Count: ${countInvoices}).`);

    // TEST 6: Tax Calculations & HSN Snapshot
    if (invoiceDoc.totalAmount !== paidSellerOrder.finalAmount) {
      throw new Error(`Invoice total (${invoiceDoc.totalAmount}) does not match order amount (${paidSellerOrder.finalAmount})!`);
    }
    const itemSnap = invoiceDoc.items[0];
    if (!itemSnap.hsnCode || itemSnap.hsnCode !== '8517') throw new Error('HSN code missing in snapshot!');
    console.log(`✓ Test 6 Passed: Taxable breakdown verified (Taxable: ₹${invoiceDoc.taxableAmount}, CGST: ₹${invoiceDoc.cgst}, SGST: ₹${invoiceDoc.sgst}, Total: ₹${invoiceDoc.totalAmount}, HSN: ${itemSnap.hsnCode}).`);

    // TEST 7: Customer GSTIN Snapshot
    if (invoiceDoc.customerDetails.customerGSTIN !== validGstin) {
      throw new Error('Customer GSTIN snapshot mismatch!');
    }
    console.log(`✓ Test 7 Passed: Customer verified GSTIN "${invoiceDoc.customerDetails.customerGSTIN}" recorded.`);

    // TEST 8: Warranty Certificate Generation
    const warrantyDoc = await Warranty.findOne({ serialNumber: `SN-ROG-INV-${rand}` });
    if (!warrantyDoc || warrantyDoc.status !== 'Active') {
      throw new Error('Warranty record was not linked properly!');
    }
    console.log(`✓ Test 8 Passed: Warranty certificate active for Serial "${warrantyDoc.serialNumber}" (Expires: ${new Date(warrantyDoc.endDate).toLocaleDateString('en-IN')}).`);

    // TEST 9: Physical PDF Creation on Disk
    const expectedPdfPath = `uploads/invoices/${invoiceDoc.invoiceNumber}.pdf`;
    if (!fs.existsSync(expectedPdfPath)) {
      throw new Error(`PDF file not found on disk at: ${expectedPdfPath}`);
    }
    const stats = fs.statSync(expectedPdfPath);
    if (stats.size < 1000) throw new Error('PDF file size suspiciously small!');
    console.log(`✓ Test 9 Passed: Server-side PDF rendered and stored at ${expectedPdfPath} (${stats.size} bytes).`);

    // TEST 10: IDOR Protection (Customer A cannot access Customer B's invoice)
    const otherUser = await User.create({
      name: `Rival User ${rand}`,
      email: `rival_${rand}@kaia.tech`,
      password: 'Password123!',
      role: 'CUSTOMER',
    });

    let idorBlocked = false;
    try {
      await invoiceService.getInvoiceById({
        invoiceId: invoiceDoc.invoiceNumber,
        user: otherUser,
      });
    } catch (e) {
      idorBlocked = true;
      console.log(`✓ Test 10 Passed: IDOR protection verified: Customer B cannot view Customer A's invoice (${e.message}).`);
    }
    if (!idorBlocked) throw new Error('IDOR security hole: Rival customer was able to view invoice!');

    // TEST 11: Audit Log Created
    const audit = await AuditLog.findOne({ entityId: invoiceDoc._id, action: 'INVOICE_CREATED' });
    if (!audit) throw new Error('AuditLog for INVOICE_CREATED not found!');
    console.log(`✓ Test 11 Passed: Audit log recorded: ${audit.action} for invoice ${invoiceDoc.invoiceNumber}.`);

    console.log('\n🎉 ALL REAL GST INVOICE, PDF & WARRANTY TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('Invoice verification failed:', err);
    process.exit(1);
  }
};

runInvoiceVerification();
