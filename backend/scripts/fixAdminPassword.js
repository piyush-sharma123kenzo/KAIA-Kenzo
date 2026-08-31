import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const fixAdminPassword = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const admin = await User.findOne({ email: 'piyush.sharma@kenzoinfosystems.com' });
    if (!admin) {
      console.error('Admin user not found!');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Piyush@2024', salt);

    admin.password = hashedPassword;
    admin.emailVerified = true;
    admin.status = 'Active';
    // Save directly without triggering pre-save double-hash
    await User.updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword, emailVerified: true, status: 'Active' } }
    );

    console.log('✓ Successfully updated Admin password with proper bcrypt hash!');
    console.log('Email: piyush.sharma@kenzoinfosystems.com');
    console.log('Password: Piyush@2024');

    // Test verification
    const updatedAdmin = await User.findOne({ email: 'piyush.sharma@kenzoinfosystems.com' });
    const isMatch = await bcrypt.compare('Piyush@2024', updatedAdmin.password);
    console.log('✓ Password match test result:', isMatch);

    process.exit(0);
  } catch (err) {
    console.error('Error fixing password:', err);
    process.exit(1);
  }
};

fixAdminPassword();
