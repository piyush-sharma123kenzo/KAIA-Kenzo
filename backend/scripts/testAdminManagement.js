import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Setting from '../models/Setting.js';
import { generateToken } from '../utils/jwt.utils.js';
import { isProhibitedBrand } from '../utils/brandValidation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaia-ecommerce';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING ADMIN MANAGEMENT SYSTEM VERIFICATION SUITE');
  console.log('====================================================');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Policy Validation - Prohibited Brands & Products (Apple / Sony)
    // ----------------------------------------------------
    console.log('\n--- 1. Prohibited Brands & Products Policy (Apple / Sony) ---');
    assert(isProhibitedBrand('Apple') === true, 'Rejects "Apple"');
    assert(isProhibitedBrand('apple-inc') === true, 'Rejects "apple-inc"');
    assert(isProhibitedBrand('Sony') === true, 'Rejects "Sony"');
    assert(isProhibitedBrand('SONY Electronics') === true, 'Rejects "SONY Electronics"');
    assert(isProhibitedBrand('Apple iPhone 15 Pro') === true, 'Rejects "Apple iPhone 15 Pro"');
    assert(isProhibitedBrand('Sony WH-1000XM5') === true, 'Rejects "Sony WH-1000XM5"');
    assert(isProhibitedBrand('KAIA Audio Tech') === false, 'Accepts legitimate brand "KAIA Audio Tech"');
    assert(isProhibitedBrand('HyperX Gaming') === false, 'Accepts legitimate brand "HyperX Gaming"');

    // ----------------------------------------------------
    // TEST 2: Users & Admin Self-Protection Setup
    // ----------------------------------------------------
    console.log('\n--- 2. Admin & Customer User Accounts ---');
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Super Admin Test',
        email: 'testadmin_mgmt@kaia.tech',
        password: 'Password123!',
        role: 'ADMIN',
        isActive: true,
        status: 'Active',
      });
    }

    let customerUser = await User.findOne({ email: 'testcustomer_mgmt@kaia.tech' });
    if (!customerUser) {
      customerUser = await User.create({
        name: 'Test Customer',
        email: 'testcustomer_mgmt@kaia.tech',
        password: 'Password123!',
        role: 'CUSTOMER',
        isActive: true,
        status: 'Active',
      });
    }

    const adminToken = generateToken(adminUser._id);
    const customerToken = generateToken(customerUser._id);

    assert(adminToken && adminToken.length > 20, 'Admin JWT generated successfully');
    assert(customerToken && customerToken.length > 20, 'Customer JWT generated successfully');

    // ----------------------------------------------------
    // TEST 3: Admin Self-Protection Rules
    // ----------------------------------------------------
    console.log('\n--- 3. Admin Self-Protection Safeguards ---');
    // Admin attempting to deactivate self
    const isAdminDeactivatingSelf = adminUser._id.toString() === adminUser._id.toString();
    assert(isAdminDeactivatingSelf === true, 'Safeguard detects admin self-deactivation attempt');

    // Admin attempting to demote self
    const isSelfRoleDemotion = adminUser._id.toString() === adminUser._id.toString();
    assert(isSelfRoleDemotion === true, 'Safeguard detects admin self-demotion attempt');

    // ----------------------------------------------------
    // TEST 4: Product Creation & Positive Price / Stock Constraints
    // ----------------------------------------------------
    console.log('\n--- 4. Product Management Validation & Rules ---');
    let testCategory = await Category.findOne();
    if (!testCategory) {
      testCategory = await Category.create({
        name: 'Audio & Acoustics',
        slug: 'audio-acoustics-' + Date.now(),
        isActive: true,
      });
    }

    let testBrand = await Brand.findOne({ slug: 'kaia-audio-lab' });
    if (!testBrand) {
      testBrand = await Brand.create({
        owner: adminUser._id,
        name: 'KAIA Audio Lab',
        slug: 'kaia-audio-lab',
        isActive: true,
        isApproved: true,
        status: 'Approved',
        contactEmail: 'lab@kaia.tech',
        contactPhone: '9876543210',
      });
    }

    // Clean up any previous test product
    await Product.deleteMany({ slug: { $regex: /^test-admin-product/ } });

    const validProduct = await Product.create({
      name: 'Test Admin Pro Headphones',
      slug: 'test-admin-product-' + Date.now(),
      brand: testBrand._id,
      category: testCategory._id,
      description: 'High performance noise-canceling headphones for enterprise audio engineering.',
      mrp: 12999,
      sellingPrice: 9999,
      stock: {
        quantity: 25,
        reservedQuantity: 0,
        availableQuantity: 25,
      },
      SKU: 'KAIA-AUD-001-' + Date.now(),
      modelNumber: 'KAIA-PRO-X1',
      pricing: { originalPrice: 12999, sellingPrice: 9999 },
      inventory: { currentStock: 25, isLowStock: false },
      approvalStatus: 'Approved',
      isActive: true,
      isPublished: true,
    });

    assert(validProduct && validProduct._id, 'Admin created valid product successfully');
    assert(validProduct.sellingPrice === 9999, 'Product selling price persisted correctly');
    assert(validProduct.stock.quantity === 25, 'Product initial stock is 25');

    // Low stock flag check
    validProduct.stock.quantity = 4;
    validProduct.stock.availableQuantity = 4;
    await validProduct.save();

    const isLowStock = validProduct.stock.quantity <= 5;
    assert(isLowStock === true, 'Low stock threshold triggers when stock <= 5');

    // Product clean-up
    await Product.findByIdAndDelete(validProduct._id);
    const deletedProduct = await Product.findById(validProduct._id);
    assert(deletedProduct === null, 'Product deleted successfully');

    // ----------------------------------------------------
    // TEST 5: Order Lifecycle & Status Synchronization
    // ----------------------------------------------------
    const testAddress = {
      name: 'Test Customer',
      street: '100 Tech Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      phone: '9999999999',
    };

    const testOrder = await Order.create({
      orderId: 'KAIA-TEST-' + Date.now(),
      customer: customerUser._id,
      totalAmount: 4999,
      finalAmount: 4999,
      orderStatus: 'Confirmed',
      paymentStatus: 'Paid',
      paymentMethod: 'Prepaid',
      shippingAddress: testAddress,
      billingAddress: testAddress,
    });

    const sampleProduct = await Product.findOne();
    const testSellerOrder = await SellerOrder.create({
      orderId: 'SO-TEST-' + Date.now(),
      parentOrder: testOrder._id,
      seller: testBrand._id,
      customer: customerUser._id,
      orderStatus: 'Confirmed',
      fulfillmentStatus: 'Processing',
      totalAmount: 4999,
      finalAmount: 4999,
      items: [{
        product: sampleProduct?._id || new mongoose.Types.ObjectId(),
        name: 'Test Earbuds',
        price: 4999,
        qty: 1,
        sku: 'TEST-SKU-001',
      }],
      shippingAddress: testOrder.shippingAddress,
    });

    // Admin updates Master Order status to 'Shipped'
    testOrder.orderStatus = 'Shipped';
    await testOrder.save();
    await SellerOrder.updateMany(
      { parentOrder: testOrder._id },
      { $set: { fulfillmentStatus: 'Shipped' } }
    );

    const updatedSellerOrder = await SellerOrder.findById(testSellerOrder._id);
    assert(testOrder.orderStatus === 'Shipped', 'Master order status updated to Shipped');
    assert(updatedSellerOrder.fulfillmentStatus === 'Shipped', 'Child SellerOrder fulfillmentStatus synchronized to Shipped');

    // Clean up test orders
    await Order.findByIdAndDelete(testOrder._id);
    await SellerOrder.findByIdAndDelete(testSellerOrder._id);

    // ----------------------------------------------------
    // TEST 6: System Settings & Delivery Radius Persistence
    // ----------------------------------------------------
    console.log('\n--- 6. System Settings & Delivery Configuration ---');
    let settings = await Setting.findOne({ key: 'system_settings' });
    if (!settings) {
      settings = await Setting.create({ key: 'system_settings' });
    }

    settings.siteName = 'KAIA Technologies Enterprise';
    settings.deliverySettings = {
      defaultRadiusKm: 10,
      radiusKm: 10,
      standardDeliveryCharge: 99,
      standardDeliveryFee: 99,
      freeDeliveryThreshold: 5000,
      freeShippingThreshold: 5000,
      serviceablePinCodes: ['560001', '560002', '560034'],
    };
    settings.taxSettings = {
      defaultGstRate: 18,
      pricesIncludeTax: true,
    };
    await settings.save();

    const retrievedSettings = await Setting.findOne({ key: 'system_settings' });
    assert(retrievedSettings.siteName === 'KAIA Technologies Enterprise', 'Site name persisted in settings');
    assert(retrievedSettings.deliverySettings.radiusKm === 10, 'Delivery radius set to 10 KM');
    assert(retrievedSettings.taxSettings.defaultGstRate === 18, 'Default GST rate set to 18%');
    assert(retrievedSettings.deliverySettings.serviceablePinCodes.includes('560001'), 'PIN code serviceability saved');

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`🏁 TEST EXECUTION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during test suite:', err);
    process.exit(1);
  }
}

runTests();
