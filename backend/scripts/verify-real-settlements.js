import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import CommissionRule from '../models/CommissionRule.js';
import SellerLedger from '../models/SellerLedger.js';
import Settlement from '../models/Settlement.js';
import AuditLog from '../models/AuditLog.js';
import commissionService from '../services/commission/commission.service.js';
import settlementService from '../services/settlement/settlement.service.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const runSettlementVerification = async () => {
  try {
    await connectDB();
    console.log('🧪 Starting Real Seller Commission, Marketplace Revenue & Settlement Verification...\n');

    // 1. Fetch test brands and products
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

    const brandUser = await User.findOne({ role: 'BRAND', brand: asusBrand._id }) || adminUser;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);

    // TEST 1: Default Commission Rule Evaluation
    const defaultRule = await commissionService.resolveCommissionRule({});
    if (defaultRule.commissionValue !== 5) {
      throw new Error(`Default commission value is ${defaultRule.commissionValue}, expected 5%!`);
    }
    console.log(`✓ Test 1 Passed: Default Marketplace Commission resolved (${defaultRule.commissionValue}%).`);

    // TEST 2: Hierarchical Priority — Brand Commission Overrides Default
    const brandRule = await CommissionRule.create({
      name: `ASUS Exclusive Partnership ${rand}`,
      scope: 'brand',
      brandId: asusBrand._id,
      commissionType: 'percentage',
      commissionValue: 6.5,
      commissionTaxRate: 18,
      isActive: true,
      createdBy: adminUser._id,
    });

    const resolvedBrandRule = await commissionService.resolveCommissionRule({ brandId: asusBrand._id });
    if (resolvedBrandRule.commissionValue !== 6.5 || resolvedBrandRule.scope !== 'brand') {
      throw new Error('Brand rule did not override default rule!');
    }
    console.log(`✓ Test 2 Passed: Brand Commission Rule (${resolvedBrandRule.commissionValue}%) correctly overrides default.`);

    // TEST 3: Product-level Commission Overrides Brand & Default
    const productRule = await CommissionRule.create({
      name: `ROG High-End Spec Tier ${rand}`,
      scope: 'product',
      productId: asusProduct._id,
      commissionType: 'percentage',
      commissionValue: 8.0,
      commissionTaxRate: 18,
      isActive: true,
      createdBy: adminUser._id,
    });

    const resolvedProdRule = await commissionService.resolveCommissionRule({
      productId: asusProduct._id,
      brandId: asusBrand._id,
    });
    if (resolvedProdRule.commissionValue !== 8.0 || resolvedProdRule.scope !== 'product') {
      throw new Error('Product rule did not take highest priority!');
    }
    console.log(`✓ Test 3 Passed: Product Rule (${resolvedProdRule.commissionValue}%) took highest priority.`);

    // TEST 4: Commission & Seller Payable Calculation
    const sampleGross = 100000;
    const calcResult = await commissionService.calculateSellerOrderCommission({
      sellerOrder: { finalAmount: sampleGross, seller: asusBrand._id },
      items: [{ product: asusProduct._id }],
    });

    if (calcResult.commissionAmount !== 8000) {
      throw new Error(`Commission amount is ₹${calcResult.commissionAmount}, expected ₹8,000!`);
    }
    if (calcResult.commissionTaxAmount !== 1440) {
      throw new Error(`Commission 18% GST tax is ₹${calcResult.commissionTaxAmount}, expected ₹1,440!`);
    }
    if (calcResult.sellerPayableAmount !== 90560) {
      throw new Error(`Seller payable is ₹${calcResult.sellerPayableAmount}, expected ₹90,560!`);
    }
    console.log(`✓ Test 4 Passed: Server-side financial calculation verified (Gross: ₹1,00,000 -> Comm: ₹8,000 + GST: ₹1,440 -> Payable: ₹90,560).`);

    // TEST 5: Double-Entry Traceable Ledger Movements
    const prevEntry = await SellerLedger.findOne({ brandId: asusBrand._id }).sort({ createdAt: -1 });
    const initialBalance = prevEntry ? prevEntry.balanceAfter : 0;

    const entry1 = await settlementService.recordLedgerEntry({
      brandId: asusBrand._id,
      transactionType: 'SALE',
      entryType: 'credit',
      amount: sampleGross,
      referenceType: 'SellerOrder',
      referenceId: `SO-COMM-${rand}`,
      description: `Customer purchase credit for order SO-COMM-${rand}`,
      user: adminUser,
    });

    const entry2 = await settlementService.recordLedgerEntry({
      brandId: asusBrand._id,
      transactionType: 'COMMISSION',
      entryType: 'debit',
      amount: calcResult.commissionAmount + calcResult.commissionTaxAmount,
      referenceType: 'SellerOrder',
      referenceId: `SO-COMM-${rand}`,
      description: `KAIA Platform commission fee and GST deduction`,
      user: adminUser,
    });

    const netMovement = Math.round((entry2.balanceAfter - initialBalance) * 100) / 100;
    if (netMovement !== 90560) {
      throw new Error(`Ledger net movement is ₹${netMovement}, expected ₹90,560!`);
    }
    console.log(`✓ Test 5 Passed: Double-entry ledger traceable movements recorded (Net Delta: +₹${netMovement}, Balance: ₹${entry2.balanceAfter}).`);

    // TEST 6: Proportional Commission Reversal upon Partial Refund
    const refundAmount = 50000; // 50% partial refund
    const reversal = commissionService.calculateCommissionReversal({
      originalCommissionAmount: calcResult.commissionAmount,
      originalGrossAmount: sampleGross,
      refundAmount,
    });

    if (reversal.commissionReversal !== 4000) {
      throw new Error(`Commission reversal is ₹${reversal.commissionReversal}, expected ₹4,000!`);
    }
    console.log(`✓ Test 6 Passed: Proportional commission reversal verified (Refund: ₹50,000 -> Comm Reversal: ₹4,000).`);

    // TEST 7: Settlement Statement Creation & Hold Period Enforcement
    const deliveredPastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago (hold period passed)

    const masterOrder = await Order.create({
      orderId: `ORD-SETTL-${dateStr}-${rand}`,
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
      paymentStatus: 'Paid',
      orderStatus: 'delivered',
    });

    const eligibleSellerOrder = await SellerOrder.create({
      parentOrder: masterOrder._id,
      orderId: `SO-SETTL-${dateStr}-${rand}`,
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
      grossAmount: asusProduct.sellingPrice,
      commissionRate: 8.0,
      commissionAmount: Math.round(asusProduct.sellingPrice * 0.08),
      commissionTaxAmount: Math.round(asusProduct.sellingPrice * 0.08 * 0.18),
      sellerPayableAmount: asusProduct.sellingPrice - Math.round(asusProduct.sellingPrice * 0.08 * 1.18),
      subtotal: asusProduct.sellingPrice,
      finalAmount: asusProduct.sellingPrice,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Delivered',
      settlementStatus: 'unsettled',
      deliveredAt: deliveredPastDate,
      shippingAddress: masterOrder.shippingAddress,
    });

    const settlement = await settlementService.createSettlement({
      brandId: asusBrand._id,
      user: adminUser,
    });

    if (!settlement || settlement.status !== 'pending') {
      throw new Error('Settlement creation failed!');
    }
    console.log(`✓ Test 7 Passed: Settlement statement #${settlement.settlementNumber} generated in pending status (Net: ₹${settlement.netPayable}).`);

    // TEST 8: Settlement Approval & Payout Disbursement
    const approvedSettle = await settlementService.approveSettlement({
      settlementId: settlement._id,
      user: adminUser,
    });
    if (approvedSettle.status !== 'approved') throw new Error('Settlement approval failed!');

    const disbursedSettle = await settlementService.processSettlementPayout({
      settlementId: settlement._id,
      paymentProvider: 'mock',
      user: adminUser,
    });

    if (disbursedSettle.status !== 'paid' || !disbursedSettle.providerPayoutId) {
      throw new Error('Payout disbursement failed!');
    }
    console.log(`✓ Test 8 Passed: Payout disbursed (Ref: ${disbursedSettle.providerPayoutId}, Status: "${disbursedSettle.status}").`);

    // TEST 9: Manual Admin Adjustment
    const adjustmentEntry = await settlementService.recordManualAdjustment({
      brandId: asusBrand._id,
      amount: 2500,
      type: 'credit',
      reason: 'Promotional marketing co-op credit',
      user: adminUser,
    });

    if (!adjustmentEntry || adjustmentEntry.transactionType !== 'ADJUSTMENT') {
      throw new Error('Manual adjustment failed!');
    }
    console.log(`✓ Test 9 Passed: Manual admin adjustment recorded in seller ledger (+₹2,500).`);

    // TEST 10: Financial Summary Aggregation
    const summary = await settlementService.getBrandFinancialSummary(asusBrand._id);
    if (summary.grossSales <= 0) throw new Error('Financial summary aggregation failed!');
    console.log(`✓ Test 10 Passed: Financial summary aggregated (Gross: ₹${summary.grossSales}, Commission: ₹${summary.totalCommission}, Available: ₹${summary.availableBalance}).`);

    console.log('\n🎉 ALL REAL COMMISSION, REVENUE & SETTLEMENT TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('Settlement verification failed:', err);
    process.exit(1);
  }
};

runSettlementVerification();
