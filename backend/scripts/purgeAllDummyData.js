import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Inventory from '../models/Inventory.js';
import SerialNumber from '../models/SerialNumber.js';
import Shipment from '../models/Shipment.js';
import Settlement from '../models/Settlement.js';
import ReturnRequest from '../models/ReturnRequest.js';
import Refund from '../models/Refund.js';
import Transaction from '../models/Transaction.js';
import Review from '../models/Review.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import Address from '../models/Address.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const purgeAllDummyData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB at:', mongoUri);

    // 1. Purge all test products & inventory
    const pRes = await Product.deleteMany({});
    const invRes = await Inventory.deleteMany({});
    const snRes = await SerialNumber.deleteMany({});
    console.log(`✓ Deleted ${pRes.deletedCount} products, ${invRes.deletedCount} inventory records, ${snRes.deletedCount} serials.`);

    // 2. Purge all test orders, shipments & financial ledgers
    const ordRes = await Order.deleteMany({});
    const soRes = await SellerOrder.deleteMany({});
    const shipRes = await Shipment.deleteMany({});
    const setRes = await Settlement.deleteMany({});
    const retRes = await ReturnRequest.deleteMany({});
    const refRes = await Refund.deleteMany({});
    const txRes = await Transaction.deleteMany({});
    console.log(`✓ Deleted ${ordRes.deletedCount} master orders, ${soRes.deletedCount} seller orders, ${shipRes.deletedCount} shipments, ${setRes.deletedCount} settlements, ${retRes.deletedCount} returns, ${refRes.deletedCount} refunds, ${txRes.deletedCount} transactions.`);

    // 3. Purge all test carts, wishlists, reviews & notifications
    const cRes = await Cart.deleteMany({});
    const wRes = await Wishlist.deleteMany({});
    const rRes = await Review.deleteMany({});
    const nRes = await Notification.deleteMany({});
    const aRes = await AuditLog.deleteMany({});
    console.log(`✓ Deleted ${cRes.deletedCount} carts, ${wRes.deletedCount} wishlists, ${rRes.deletedCount} reviews, ${nRes.deletedCount} notifications, ${aRes.deletedCount} audit logs.`);

    // 4. Purge all non-admin users & addresses
    const nonAdminUsers = await User.find({ role: { $ne: 'ADMIN' } });
    const nonAdminIds = nonAdminUsers.map((u) => u._id);
    if (nonAdminIds.length > 0) {
      await Address.deleteMany({ user: { $in: nonAdminIds } });
      const uRes = await User.deleteMany({ _id: { $in: nonAdminIds } });
      console.log(`✓ Deleted ${uRes.deletedCount} dummy/test users.`);
    }

    console.log('\n===============================================================');
    console.log(' ALL DUMMY DATA PURGED FROM DATABASE SUCCESSFULLY!');
    console.log(' Preserved: Admin Account (piyush.sharma@kenzoinfosystems.com), Brands & Categories');
    console.log('===============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error purging dummy data:', err);
    process.exit(1);
  }
};

purgeAllDummyData();
