import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Inventory from '../models/Inventory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkDBCleanliness = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    await mongoose.connect(mongoUri);
    
    const [pCount, oCount, invCount, uCount, bCount, cCount] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Inventory.countDocuments(),
      User.countDocuments(),
      Brand.countDocuments(),
      Category.countDocuments(),
    ]);

    console.log('=== DATABASE STATUS SUMMARY ===');
    console.log(`Products: ${pCount}`);
    console.log(`Orders: ${oCount}`);
    console.log(`Inventory Items: ${invCount}`);
    console.log(`Users: ${uCount} (Admin only)`);
    console.log(`Brands: ${bCount} (Authorized directory)`);
    console.log(`Categories: ${cCount}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDBCleanliness();
