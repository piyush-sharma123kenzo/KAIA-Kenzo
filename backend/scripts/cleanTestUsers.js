import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Order from '../models/Order.js';
import SellerOrder from '../models/SellerOrder.js';
import Address from '../models/Address.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const cleanTestUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB at:', mongoUri);

    // Find all users except ADMIN
    const nonAdminUsers = await User.find({ role: { $ne: 'ADMIN' } });
    const nonAdminIds = nonAdminUsers.map((u) => u._id);

    console.log(`Found ${nonAdminUsers.length} dummy/test users to remove.`);

    // Delete associated carts, wishlists, addresses, and test users
    if (nonAdminIds.length > 0) {
      await Cart.deleteMany({ user: { $in: nonAdminIds } });
      await Wishlist.deleteMany({ user: { $in: nonAdminIds } });
      await Address.deleteMany({ user: { $in: nonAdminIds } });
      const deleteResult = await User.deleteMany({ _id: { $in: nonAdminIds } });
      console.log(`✓ Deleted ${deleteResult.deletedCount} dummy users.`);
    }

    const remainingUsers = await User.find().select('name email role');
    console.log('\n=== REMAINING USERS IN DATABASE ===');
    console.log(JSON.stringify(remainingUsers, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error cleaning test users:', err);
    process.exit(1);
  }
};

cleanTestUsers();
