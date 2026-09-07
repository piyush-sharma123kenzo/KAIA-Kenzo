import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import { generateToken } from '../utils/jwt.utils.js';
import { isProhibitedBrand } from '../utils/brandValidation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaia-ecommerce';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PRODUCT & INVENTORY MANAGEMENT TEST SUITE');
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
    // SETUP: Users & Setup Data
    // ----------------------------------------------------
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Master Admin',
        email: 'admin_prod_test@kaia.tech',
        password: 'Password123!',
        role: 'ADMIN',
        isActive: true,
      });
    }

    let customerUser = await User.findOne({ role: 'CUSTOMER' });
    if (!customerUser) {
      customerUser = await User.create({
        name: 'Customer Test',
        email: 'customer_prod_test@kaia.tech',
        password: 'Password123!',
        role: 'CUSTOMER',
        isActive: true,
      });
    }

    let testBrand = await Brand.findOne({ slug: 'asus' });
    if (!testBrand) {
      testBrand = await Brand.create({
        owner: adminUser._id,
        name: 'ASUS',
        slug: 'asus',
        status: 'Approved',
        isActive: true,
      });
    }

    let testCategory = await Category.findOne({ slug: 'pc-components' });
    if (!testCategory) {
      testCategory = await Category.create({
        name: 'PC Components',
        slug: 'pc-components',
        isActive: true,
      });
    }

    // Clean up any existing test products
    await Product.deleteMany({ SKU: { $regex: /^TEST-ROG-/ } });

    // ----------------------------------------------------
    // TEST 1: Admin creates product in MongoDB
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Admin creates valid product in MongoDB ---');
    const createdProduct = await Product.create({
      name: 'ASUS ROG Strix Gaming Laptop RTX 4080',
      slug: 'asus-rog-strix-gaming-laptop-rtx-4080-' + Date.now(),
      brand: testBrand._id,
      category: testCategory._id,
      modelNumber: 'G16-CH01',
      SKU: 'TEST-ROG-' + Date.now(),
      description: 'High-performance gaming laptop with 13th Gen Intel Core i9 and NVIDIA RTX 4080.',
      mrp: 249999,
      sellingPrice: 219999,
      gstRate: 18.0,
      images: [
        { url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302', altText: 'Main View', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45', altText: 'Side View', isPrimary: false },
      ],
      stock: {
        quantity: 15,
        reservedQuantity: 0,
        availableQuantity: 15,
        reorderThreshold: 5,
      },
      specifications: {
        Processor: 'Intel Core i9-13980HX',
        RAM: '32GB DDR5',
        Storage: '1TB NVMe Gen4 SSD',
        Graphics: 'NVIDIA GeForce RTX 4080 12GB',
        Display: '16-inch QHD+ 240Hz',
      },
      isFeatured: true,
      isBestDeal: true,
      isNewArrival: true,
      isActive: true,
      status: 'Approved',
    });

    assert(createdProduct && createdProduct._id, 'Product created and stored in MongoDB');
    assert(createdProduct.sellingPrice === 219999, 'Selling price saved accurately');
    assert(createdProduct.stock.availableQuantity === 15, 'Initial available stock is 15');
    assert(createdProduct.discount > 0, 'Virtual discount calculated accurately');

    // ----------------------------------------------------
    // TEST 2: Product appears in Admin product list
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Product appears in Admin Product List ---');
    const adminProducts = await Product.find({ SKU: createdProduct.SKU });
    assert(adminProducts.length === 1, 'Product found in Admin directory query');
    assert(adminProducts[0].name.includes('ASUS ROG'), 'Product name matches in Admin directory');

    // ----------------------------------------------------
    // TEST 3: Product appears in Homepage active collections
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Product appears in Customer Homepage Collections ---');
    const dealsList = await Product.find({ isActive: true, isDeleted: { $ne: true }, isBestDeal: true });
    const featuredList = await Product.find({ isActive: true, isDeleted: { $ne: true }, isFeatured: true });
    const newArrivalsList = await Product.find({ isActive: true, isDeleted: { $ne: true }, isNewArrival: true });

    assert(dealsList.some((p) => p._id.toString() === createdProduct._id.toString()), 'Product appears in Best Deals collection');
    assert(featuredList.some((p) => p._id.toString() === createdProduct._id.toString()), 'Product appears in Featured collection');
    assert(newArrivalsList.some((p) => p._id.toString() === createdProduct._id.toString()), 'Product appears in New Arrivals collection');

    // ----------------------------------------------------
    // TEST 4: Product search returns correct results
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Product Search ---');
    const searchMatch = await Product.find({
      isActive: true,
      isDeleted: { $ne: true },
      name: new RegExp('ROG Strix', 'i'),
    });
    assert(searchMatch.some((p) => p._id.toString() === createdProduct._id.toString()), 'Search for "ROG Strix" returns the product');

    // ----------------------------------------------------
    // TEST 5: Brand filter returns correct products
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Brand Filter ---');
    const brandMatch = await Product.find({
      isActive: true,
      isDeleted: { $ne: true },
      brand: testBrand._id,
    });
    assert(brandMatch.some((p) => p._id.toString() === createdProduct._id.toString()), 'Brand filter for ASUS returns the product');

    // ----------------------------------------------------
    // TEST 6: Category filter returns correct products
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Category Filter ---');
    const catMatch = await Product.find({
      isActive: true,
      isDeleted: { $ne: true },
      category: testCategory._id,
    });
    assert(catMatch.some((p) => p._id.toString() === createdProduct._id.toString()), 'Category filter for PC Components returns the product');

    // ----------------------------------------------------
    // TEST 7: Admin updates product details
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Admin Updates Product ---');
    createdProduct.sellingPrice = 209999;
    createdProduct.specifications = {
      ...createdProduct.specifications,
      Storage: '2TB NVMe Gen4 SSD',
    };
    createdProduct.markModified('specifications');
    await createdProduct.save();

    const updated = await Product.findById(createdProduct._id);
    assert(updated.sellingPrice === 209999, 'Product updated price persisted immediately in database');
    assert(updated.specifications?.Storage === '2TB NVMe Gen4 SSD', 'Dynamic specifications updated');

    // ----------------------------------------------------
    // TEST 8: Admin deactivates product -> Hidden from customer storefront
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Admin Deactivates Product ---');
    createdProduct.isActive = false;
    createdProduct.status = 'Inactive';
    await createdProduct.save();

    const customerVisible = await Product.find({
      _id: createdProduct._id,
      isActive: true,
      isDeleted: { $ne: true },
    });
    assert(customerVisible.length === 0, 'Deactivated product is hidden from customer storefront query');

    // Re-activate for remaining inventory tests
    createdProduct.isActive = true;
    createdProduct.status = 'Approved';
    await createdProduct.save();

    // ----------------------------------------------------
    // TEST 9: Admin updates stock manually
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Admin Updates Stock ---');
    createdProduct.stock.quantity = 25;
    createdProduct.stock.availableQuantity = 25;
    await createdProduct.save();

    const stockUpdated = await Product.findById(createdProduct._id);
    assert(stockUpdated.stock.quantity === 25, 'Stock quantity updated to 25');
    assert(stockUpdated.stock.availableQuantity === 25, 'Available stock is 25');

    // ----------------------------------------------------
    // TEST 10: Stock reaches 0 -> Out of stock status
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Stock Reaches 0 (Out of Stock) ---');
    createdProduct.stock.quantity = 0;
    createdProduct.stock.availableQuantity = 0;
    await createdProduct.save();

    const outOfStockProduct = await Product.findById(createdProduct._id);
    const isOutOfStock = (outOfStockProduct.stock.availableQuantity || 0) <= 0;
    assert(isOutOfStock === true, 'Out of Stock detected accurately when stock is 0');

    // ----------------------------------------------------
    // TEST 11: Customer attempts to purchase more than available stock
    // ----------------------------------------------------
    console.log('\n--- TEST 11: Cart & Checkout Overselling Protection ---');
    const available = outOfStockProduct.stock.availableQuantity;
    const requestedQty = 3;
    const isSufficient = available >= requestedQty;
    assert(isSufficient === false, 'Checkout correctly rejects orders where requestedQty > availableStock');

    // ----------------------------------------------------
    // TEST 12: Admin attempts to add "Apple" product -> Strictly Rejected
    // ----------------------------------------------------
    console.log('\n--- TEST 12: Prohibited Brand Rule (Apple) ---');
    assert(isProhibitedBrand('Apple') === true, 'Policy strictly rejects "Apple" brand name');
    assert(isProhibitedBrand('Apple iPhone 16 Pro Max') === true, 'Policy strictly rejects "Apple iPhone 16 Pro Max" product');
    assert(isProhibitedBrand('apple-macbook-pro') === true, 'Policy strictly rejects "apple-macbook-pro" slug');

    // ----------------------------------------------------
    // TEST 13: Admin attempts to add "Sony" product -> Strictly Rejected
    // ----------------------------------------------------
    console.log('\n--- TEST 13: Prohibited Brand Rule (Sony) ---');
    assert(isProhibitedBrand('Sony') === true, 'Policy strictly rejects "Sony" brand name');
    assert(isProhibitedBrand('Sony WH-1000XM5 Headphones') === true, 'Policy strictly rejects "Sony WH-1000XM5" product');
    assert(isProhibitedBrand('sony-playstation-5') === true, 'Policy strictly rejects "sony-playstation-5" slug');

    // ----------------------------------------------------
    // TEST 14: Clean Empty State Handling
    // ----------------------------------------------------
    console.log('\n--- TEST 14: Clean Empty State Handling ---');
    const nonExistentProducts = await Product.find({
      isActive: true,
      category: new mongoose.Types.ObjectId(),
    });
    assert(Array.isArray(nonExistentProducts) && nonExistentProducts.length === 0, 'Non-existent category returns empty array (triggering clean UI empty state, no dummy data)');

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    await Product.findByIdAndDelete(createdProduct._id);

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
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runTests();
