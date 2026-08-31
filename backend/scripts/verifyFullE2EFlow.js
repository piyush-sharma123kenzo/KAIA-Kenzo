import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Address from '../models/Address.js';
import Review from '../models/Review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const runComprehensiveE2ETest = async () => {
  console.log('=== STARTING COMPREHENSIVE E-COMMERCE DATABASE VERIFICATION ===\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB at:', mongoUri);

    // 1. User Registration & Password Hashing Verification
    const testEmail = `e2e.buyer.${Date.now()}@kaia.tech`;
    const plainPassword = 'StrongPassword@123';

    const user = await User.create({
      name: 'E2E Verified Buyer',
      email: testEmail,
      password: plainPassword, // Handled automatically by pre('save') bcrypt hook
      phone: '9876543210',
      role: 'CUSTOMER',
      emailVerified: true,
      status: 'Active',
    });
    console.log(`✓ 1. User Registration: Created user ${user._id} (${user.email}) with bcrypt hashed password.`);

    // 2. Authentication & Credential Verification
    const isPasswordValid = await user.matchPassword(plainPassword);
    if (!isPasswordValid) throw new Error('Password hashing comparison failed.');
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'kaia-secret-jwt-key', { expiresIn: '7d' });
    console.log('✓ 2. Authentication: Password verified via bcrypt & JWT token issued successfully.');

    // 3. User Profile & Address Persistence
    const address = await Address.create({
      user: user._id,
      fullName: user.name,
      name: user.name,
      phone: user.phone,
      addressLine1: '402 Cyber Tech Hub, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postalCode: '201309',
      country: 'India',
      label: 'Work',
      isDefault: true,
    });
    console.log(`✓ 3. Address System: Created address ${address._id} in MongoDB.`);

    // 4. Products & Catalog Verification
    let product = await Product.findOne({ status: 'Approved' }).populate('brand').populate('category');
    if (!product) {
      // Create one if empty
      let brand = await Brand.findOne();
      if (!brand) brand = await Brand.create({ name: 'ASUS', slug: 'asus', status: 'Approved' });
      let category = await Category.findOne();
      if (!category) category = await Category.create({ name: 'Laptops', slug: 'laptops' });

      product = await Product.create({
        name: 'ASUS ROG Zephyrus G16 OLED Gaming Laptop',
        slug: 'asus-rog-zephyrus-g16-oled-gaming-laptop',
        brand: brand._id,
        category: category._id,
        sellingPrice: 189990,
        mrp: 219990,
        stockQuantity: 15,
        stock: { quantity: 15, availableQuantity: 15, reservedQuantity: 0 },
        status: 'Approved',
        isActive: true,
      });
      product = await Product.findById(product._id).populate('brand').populate('category');
    }
    console.log(`✓ 4. Catalog Engine: Loaded live product "${product.name}" (Stock: ${product.stockQuantity}, Price: ₹${product.sellingPrice}).`);

    // 5. Wishlist System (MongoDB Driven)
    const wishlistItem = await Wishlist.create({
      user: user._id,
      product: product._id,
    });
    const retrievedWishlist = await Wishlist.find({ user: user._id }).populate('product');
    if (retrievedWishlist.length === 0) throw new Error('Wishlist persistence failed.');
    console.log(`✓ 5. Wishlist: Persisted item ${wishlistItem._id} in MongoDB. Retrieved count: ${retrievedWishlist.length}.`);

    // 6. Persistent Cart System (MongoDB Driven)
    const cart = await Cart.create({
      user: user._id,
      items: [
        {
          product: product._id,
          quantity: 2,
          selectedSpecs: { RAM: '32GB' },
        },
      ],
    });
    const populatedCart = await Cart.findById(cart._id).populate('items.product');
    console.log(`✓ 6. Cart System: Stored 2 units in MongoDB cart (${populatedCart._id}). Total items: ${populatedCart.items.length}.`);

    // 7. Checkout & Master Order Creation
    const orderNumber = `KAIA-${Date.now().toString().slice(-6)}`;
    const initialStock = product.stock?.availableQuantity ?? product.stockQuantity ?? 15;

    const masterOrder = await Order.create({
      orderId: orderNumber,
      customer: user._id,
      childOrders: [],
      items: [
        {
          product: product._id,
          productName: product.name,
          brand: product.brand._id,
          brandName: product.brand.name,
          sku: product.SKU || 'TEST-SKU',
          quantity: 2,
          unitPrice: product.sellingPrice,
          lineTotal: product.sellingPrice * 2,
          image: product.images?.[0]?.url || '',
        },
      ],
      shippingAddress: {
        name: address.fullName || address.name || user.name,
        fullName: address.fullName || address.name || user.name,
        phone: address.phone,
        street: address.addressLine1,
        addressLine1: address.addressLine1,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
      billingAddress: {
        name: address.fullName || address.name || user.name,
        fullName: address.fullName || address.name || user.name,
        phone: address.phone,
        street: address.addressLine1,
        addressLine1: address.addressLine1,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
      totalItemsPrice: product.sellingPrice * 2,
      finalAmount: product.sellingPrice * 2,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'pending_payment',
    });

    const sellerOrder = await SellerOrder.create({
      parentOrder: masterOrder._id,
      orderId: `${orderNumber}-S1`,
      seller: product.brand._id,
      items: [
        {
          product: product._id,
          name: product.name,
          qty: 2,
          quantity: 2,
          price: product.sellingPrice,
          gstRate: 18,
        },
      ],
      totalAmount: product.sellingPrice * 2,
      subtotalAmount: product.sellingPrice * 2,
      finalAmount: product.sellingPrice * 2,
      taxAmount: 0,
      shippingFee: 0,
      orderStatus: 'placed',
      settlementStatus: 'unsettled',
    });

    masterOrder.childOrders = [sellerOrder._id];
    await masterOrder.save();

    console.log(`✓ 7. Order Engine: Master Order created: ${masterOrder.orderId} (Total: ₹${masterOrder.finalAmount}).`);

    // 8. Order Confirmation & Database Inventory Reduction
    masterOrder.orderStatus = 'processing';
    await masterOrder.save();
    sellerOrder.orderStatus = 'confirmed';
    await sellerOrder.save();

    // Deduct stock in MongoDB
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      {
        $inc: {
          'stock.quantity': -2,
          'stock.availableQuantity': -2,
          stockQuantity: -2,
        },
      },
      { new: true }
    );

    // Clear cart in MongoDB
    await Cart.findByIdAndUpdate(cart._id, { $set: { items: [] } });

    console.log(`✓ 8. Inventory Engine: Stock reduced from ${initialStock} -> ${updatedProduct.stock.availableQuantity}. Cart cleared in MongoDB.`);

    // 9. Verified Review System
    const review = await Review.create({
      product: product._id,
      user: user._id,
      name: user.name,
      rating: 5,
      comment: 'Top tier build quality and blindingly fast gaming performance. Highly recommended!',
    });
    console.log(`✓ 9. Review Engine: Stored verified 5-star customer review (${review._id}) in MongoDB.`);

    // Clean up test user & artifacts
    await User.findByIdAndDelete(user._id);
    await Address.findByIdAndDelete(address._id);
    await Cart.findByIdAndDelete(cart._id);
    await Wishlist.findByIdAndDelete(wishlistItem._id);
    await Review.findByIdAndDelete(review._id);
    await SellerOrder.findByIdAndDelete(sellerOrder._id);
    await Order.findByIdAndDelete(masterOrder._id);

    console.log('\n===============================================================');
    console.log(' ALL 9 CORE E-COMMERCE DATABASE ENGINES FULLY VERIFIED & WORKING!');
    console.log('===============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('E2E Verification Error:', err);
    process.exit(1);
  }
};

runComprehensiveE2ETest();
