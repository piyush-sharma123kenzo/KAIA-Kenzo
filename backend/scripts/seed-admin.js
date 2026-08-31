import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await connectDB();

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kaia.tech').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Password@123';
    const adminName = process.env.ADMIN_NAME || 'KAIA Admin Team';
    const adminPhone = process.env.ADMIN_PHONE || '9876543210';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`Admin account with email [${adminEmail}] already exists. Updating credentials and verifying...`);
      admin.name = adminName;
      admin.role = 'ADMIN';
      admin.phone = adminPhone;
      admin.emailVerified = true;
      admin.status = 'Active';
      admin.password = adminPassword; // Pre-save hook will hash
      await admin.save();
      console.log(`[SUCCESS] Admin account [${adminEmail}] updated successfully with role ADMIN.`);
    } else {
      console.log(`Creating new Admin account [${adminEmail}]...`);
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        phone: adminPhone,
        emailVerified: true,
        status: 'Active',
      });
      console.log(`[SUCCESS] Admin account created successfully!`);
    }

    console.log('\n=============================================');
    console.log('KAIA TECHNOLOGIES — ADMIN CREDENTIALS');
    console.log('=============================================');
    console.log(`URL:      http://localhost:5173/login`);
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role:     ${admin.role}`);
    console.log(`Verified: ${admin.emailVerified}`);
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[ERROR] Seeding admin account failed:', error);
    process.exit(1);
  }
};

seedAdmin();
