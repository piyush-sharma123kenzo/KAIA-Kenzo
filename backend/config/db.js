import mongoose from 'mongoose';
import User from '../models/User.js';

const autoBootstrapAdmin = async () => {
  const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || process.env.ADMIN_EMAIL)?.trim()?.toLowerCase();
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const adminName = (process.env.BOOTSTRAP_ADMIN_NAME || process.env.ADMIN_NAME || 'Platform Administrator').trim();

  if (!adminEmail || !adminPassword) return;

  try {
    let user = await User.findOne({ email: adminEmail });
    if (user) {
      user.name = adminName || user.name;
      user.password = adminPassword; // Pre-save hook securely bcrypt-hashes
      user.role = 'ADMIN';
      user.emailVerified = true;
      user.status = 'Active';
      user.isActive = true;
      await user.save();
      console.log(`[KAIA Bootstrap] Verified and synchronized ADMIN account for: ${adminEmail}`);
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        emailVerified: true,
        status: 'Active',
        isActive: true,
      });
      console.log(`[KAIA Bootstrap] Created new root ADMIN account for: ${adminEmail}`);
    }
  } catch (err) {
    console.warn('[KAIA Bootstrap Note]:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await autoBootstrapAdmin();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
