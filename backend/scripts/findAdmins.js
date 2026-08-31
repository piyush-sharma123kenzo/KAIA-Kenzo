import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const findAdmins = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    await mongoose.connect(mongoUri);
    const admins = await User.find({ role: 'ADMIN' }).select('name email role status emailVerified createdAt');
    console.log('=== ADMIN ACCOUNTS IN DATABASE ===');
    console.log(JSON.stringify(admins, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error finding admins:', err);
    process.exit(1);
  }
};

findAdmins();
