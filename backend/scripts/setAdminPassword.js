import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const setAdminPassword = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Piyush@1234', salt);

    const result = await User.updateOne(
      { email: 'piyush.sharma@kenzoinfosystems.com' },
      { $set: { password: hashedPassword, emailVerified: true, status: 'Active', role: 'ADMIN' } }
    );

    console.log('✓ Successfully set Admin password to Piyush@1234');
    console.log('Matched Count:', result.matchedCount, 'Modified Count:', result.modifiedCount);

    const user = await User.findOne({ email: 'piyush.sharma@kenzoinfosystems.com' });
    const isMatch = await bcrypt.compare('Piyush@1234', user.password);
    console.log('✓ Tested password match with Piyush@1234:', isMatch);

    process.exit(0);
  } catch (err) {
    console.error('Error setting password:', err);
    process.exit(1);
  }
};

setAdminPassword();
