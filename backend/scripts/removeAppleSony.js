import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const cleanAppleAndSony = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Find Apple and Sony brands
    const brandsToRemove = await Brand.find({
      $or: [
        { slug: { $in: ['apple', 'sony'] } },
        { name: { $regex: /apple|sony/i } },
      ],
    });

    const brandIds = brandsToRemove.map((b) => b._id);
    console.log(`Found ${brandsToRemove.length} brands to remove:`, brandsToRemove.map(b => b.name));

    // 2. Delete all products matching these brand IDs or containing 'Apple' or 'Sony' in name
    const deletedProducts = await Product.deleteMany({
      $or: [
        { brand: { $in: brandIds } },
        { name: { $regex: /apple|sony|macbook|iphone|wh-1000xm5|wf-1000xm5|alpha 7 iv/i } },
        { slug: { $regex: /apple|sony|macbook|iphone|wh-1000xm5|wf-1000xm5|alpha-7-iv/i } },
      ],
    });
    console.log(`Deleted ${deletedProducts.deletedCount} Apple and Sony products.`);

    // 3. Delete the brands
    const deletedBrands = await Brand.deleteMany({
      $or: [
        { _id: { $in: brandIds } },
        { slug: { $in: ['apple', 'sony'] } },
        { name: { $regex: /apple|sony/i } },
      ],
    });
    console.log(`Deleted ${deletedBrands.deletedCount} brands.`);

    // 4. Delete user accounts associated with Apple and Sony
    const deletedUsers = await User.deleteMany({
      email: { $in: ['apple@kaia.tech', 'sony@kaia.tech', 'partner@apple.kaia.tech'] },
    });
    console.log(`Deleted ${deletedUsers.deletedCount} brand owner user accounts.`);

    console.log('Successfully purged all Apple and Sony data from database.');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
};

cleanAppleAndSony();
