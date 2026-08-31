import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const purgeAllProducts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const deleted = await Product.deleteMany({});
    console.log(`Successfully deleted ${deleted.deletedCount} products from database.`);
    console.log('Product catalog is now clean (0 products). Brands and categories are preserved.');
    process.exit(0);
  } catch (err) {
    console.error('Error during product purge:', err);
    process.exit(1);
  }
};

purgeAllProducts();
