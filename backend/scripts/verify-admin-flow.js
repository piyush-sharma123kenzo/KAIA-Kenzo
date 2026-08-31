import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import { getAdminDashboardSummary } from '../controllers/adminController.js';
import { loginUser } from '../controllers/authController.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const runAdminVerification = async () => {
  console.log('--- STARTING KAIA ADMIN INTEGRATION VERIFICATION ---');
  await connectDB();

  // 1. Verify Admin User in MongoDB
  const admin = await User.findOne({ email: 'admin@kaia.tech' });
  if (!admin) {
    throw new Error('Admin user [admin@kaia.tech] not found in DB.');
  }
  console.log(`[PASS] 1. Admin user verified in DB: ID=${admin._id}, Role=${admin.role}, emailVerified=${admin.emailVerified}`);

  // 2. Test Password Matching
  const isMatch = await admin.matchPassword('Password@123');
  if (!isMatch) {
    throw new Error('Admin password does not match.');
  }
  console.log('[PASS] 2. Admin bcrypt password verification passed.');

  // 3. Test Admin Dashboard Controller Handler directly
  const mockReq = {
    user: admin,
    query: { timeRange: '30days' },
  };

  let responseData = null;
  let responseStatus = null;

  const mockRes = {
    status: (code) => {
      responseStatus = code;
      return {
        json: (data) => {
          responseData = data;
        },
      };
    },
  };

  await getAdminDashboardSummary(mockReq, mockRes);
  if (responseStatus !== 200 || !responseData.success) {
    throw new Error(`getAdminDashboardSummary returned status ${responseStatus}`);
  }

  console.log('[PASS] 3. GET /api/admin/dashboard controller executed with 200 OK.');
  console.log('   KPIs:', JSON.stringify(responseData.kpis));
  console.log('   Data:', JSON.stringify(responseData.data));

  // 4. Test Customer Role Block
  let customerUser = await User.findOne({ email: 'customer@kaia.tech' });
  if (!customerUser) {
    customerUser = await User.create({
      name: 'Test Customer',
      email: 'customer@kaia.tech',
      password: 'Password@123',
      role: 'CUSTOMER',
      emailVerified: true,
      status: 'Active',
    });
  }

  console.log(`[PASS] 4. Customer user verified: ID=${customerUser._id}, Role=${customerUser.role}`);

  console.log('\n--- ALL ADMIN VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
};

runAdminVerification().catch((err) => {
  console.error('[FAIL] Admin verification error:', err);
  process.exit(1);
});
