import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const seedBrandOrders = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Generating realistic multi-brand orders...');

    // Find customer
    let customer = await User.findOne({ role: 'CUSTOMER' });
    if (!customer) {
      customer = await User.create({
        name: 'Piyush Sharma',
        email: 'customer@kaia.tech',
        password: 'Password@123',
        role: 'CUSTOMER',
        phone: '9876543210',
      });
    }

    const brands = await Brand.find({ status: 'Approved' });
    if (brands.length === 0) {
      console.log('No approved brands found.');
      process.exit(1);
    }

    const cities = ['Bengaluru', 'Mumbai', 'New Delhi', 'Hyderabad', 'Pune', 'Chennai'];
    const fulfillmentStatuses = ['Processing', 'Packed', 'Shipped', 'Delivered'];

    let createdParentCount = 0;
    let createdSellerCount = 0;

    for (let i = 0; i < 20; i++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - (i * 2)); // Spread across past 40 days

      const selectedBrand = brands[i % brands.length];
      const brandProducts = await Product.find({ brand: selectedBrand._id, isActive: true }).limit(3);

      if (brandProducts.length === 0) continue;

      const p1 = brandProducts[0];
      const qty1 = (i % 2) + 1;
      const subtotal = p1.sellingPrice * qty1;
      const gstAmount = Math.round(subtotal * 0.18);
      const finalAmount = subtotal + gstAmount;
      const commissionRate = 5.0;
      const commissionAmount = Math.round((subtotal * commissionRate) / 100);

      const orderNumber = `ORD-2026-${String(1000 + i).padStart(5, '0')}`;
      const sellerOrderNumber = `SO-${selectedBrand.slug.substring(0, 3).toUpperCase()}-${String(1000 + i).padStart(5, '0')}`;
      const city = cities[i % cities.length];

      // 1. Create Parent Order
      const parentOrder = await Order.create({
        orderId: orderNumber,
        customer: customer._id,
        shippingAddress: {
          name: customer.name,
          street: `${(i % 50) + 10}, Tech Park Avenue, Sector ${i + 1}`,
          city,
          state: 'Karnataka',
          postalCode: `5600${String((i % 90) + 10)}`,
          country: 'India',
          phone: customer.phone || '9876543210',
        },
        billingAddress: {
          name: customer.name,
          street: `${(i % 50) + 10}, Tech Park Avenue, Sector ${i + 1}`,
          city,
          state: 'Karnataka',
          postalCode: `5600${String((i % 90) + 10)}`,
          country: 'India',
          phone: customer.phone || '9876543210',
        },
        subtotal,
        taxAmount: gstAmount,
        shippingAmount: 0,
        discountAmount: 0,
        finalAmount,
        paymentStatus: 'Paid',
        orderStatus: 'paid',
        paymentDetails: {
          provider: 'razorpay',
          transactionId: `pay_mock_${Date.now().toString().slice(-8)}_${i}`,
        },
        createdAt: orderDate,
        updatedAt: orderDate,
      });
      createdParentCount++;

      // 2. Create Seller Order
      const sellerOrder = await SellerOrder.create({
        parentOrder: parentOrder._id,
        orderId: sellerOrderNumber,
        seller: selectedBrand._id,
        items: [
          {
            product: p1._id,
            name: p1.name,
            price: p1.sellingPrice,
            qty: qty1,
            gstRate: 18.0,
            serialNumbers: [`${p1.SKU.replace(/-/g, '')}SN000${(i % 5) + 1}`],
          },
        ],
        subtotal,
        gstAmount,
        commissionRate,
        commissionAmount,
        shippingAmount: 0,
        finalAmount,
        fulfillmentStatus: fulfillmentStatuses[i % fulfillmentStatuses.length],
        logistics: {
          provider: 'KAIA Express Logistics',
          trackingId: `TRK${Date.now().toString().slice(-6)}${i}`,
          courierName: 'Blue Dart Express',
        },
        invoiceNumber: `INV-2026-${String(2000 + i).padStart(5, '0')}`,
        createdAt: orderDate,
        updatedAt: orderDate,
      });
      createdSellerCount++;

      // Link seller order to parent order
      parentOrder.childOrders = [sellerOrder._id];
      await parentOrder.save();
    }

    console.log(`✅ Seeded ${createdParentCount} Parent Orders & ${createdSellerCount} Seller Orders across ${brands.length} brands!`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding brand orders:', err);
    process.exit(1);
  }
};

seedBrandOrders();
