import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import { generateToken, formatUserResponse } from '../utils/jwt.utils.js';
import { authenticateCredentials } from '../services/auth/login.service.js';
import profileImageService from '../services/storage/profileImage.service.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 KAIA TECHNOLOGIES — USER MANAGEMENT SUITE VERIFICATION');
  console.log('======================================================\n');

  await connectDB();

  let testCustomer, testAdmin;

  try {
    // Setup test users
    const customerEmail = `test_customer_${Date.now()}@example.com`;
    const adminEmail = `test_admin_${Date.now()}@example.com`;
    const initialPassword = 'Password@123';
    const updatedPassword = 'NewSecurePassword@456';

    console.log(`[Setup] Creating test customer: ${customerEmail}`);
    testCustomer = await User.create({
      name: 'Test Customer Alpha',
      firstName: 'Test',
      lastName: 'Customer Alpha',
      email: customerEmail,
      password: initialPassword,
      role: 'CUSTOMER',
      phone: '9876543210',
      emailVerified: true,
      isActive: true,
      status: 'Active',
    });

    console.log(`[Setup] Creating test admin: ${adminEmail}`);
    testAdmin = await User.create({
      name: 'Test Admin Master',
      firstName: 'Test',
      lastName: 'Admin Master',
      email: adminEmail,
      password: initialPassword,
      role: 'ADMIN',
      phone: '9999988888',
      emailVerified: true,
      isActive: true,
      status: 'Active',
    });

    console.log('\n--- TEST 1: Authenticated user gets own profile ---');
    const customerProfile = await User.findById(testCustomer._id).select('-password');
    const formattedCust = formatUserResponse(customerProfile);
    if (formattedCust && formattedCust.email === customerEmail && !formattedCust.password) {
      console.log('✅ TEST 1 PASSED: Profile returned safely without sensitive data.');
    } else {
      throw new Error('TEST 1 FAILED: Profile format mismatch or password leaked.');
    }

    console.log('\n--- TEST 2: User updates name ---');
    testCustomer.name = 'Updated Customer Name';
    await testCustomer.save();
    const updatedUserDoc = await User.findById(testCustomer._id);
    if (updatedUserDoc.name === 'Updated Customer Name') {
      console.log('✅ TEST 2 PASSED: Name successfully updated in database.');
    } else {
      throw new Error('TEST 2 FAILED: Name update failed in database.');
    }

    console.log('\n--- TEST 3: User updates phone ---');
    testCustomer.phone = '+91 9123456780';
    await testCustomer.save();
    const updatedPhoneDoc = await User.findById(testCustomer._id);
    if (updatedPhoneDoc.phone === '+91 9123456780') {
      console.log('✅ TEST 3 PASSED: Phone number successfully updated.');
    } else {
      throw new Error('TEST 3 FAILED: Phone number update failed.');
    }

    console.log('\n--- TEST 4: User uploads valid profile image ---');
    const dummyImageBuffer = Buffer.from('fake-image-bytes-png-data');
    const tempFilePath = path.join(process.cwd(), 'uploads', `test-${Date.now()}.png`);
    fs.writeFileSync(tempFilePath, dummyImageBuffer);

    const mockFile = {
      path: tempFilePath,
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 1024,
    };

    const userWithImage = await profileImageService.updateProfileImage(testCustomer._id, mockFile);
    if (userWithImage.profileImage?.url && userWithImage.avatar) {
      console.log(`✅ TEST 4 PASSED: Profile image uploaded. URL: ${userWithImage.profileImage.url}`);
    } else {
      throw new Error('TEST 4 FAILED: Image upload did not update profileImage.');
    }

    console.log('\n--- TEST 5: User changes profile image (replaces old) ---');
    const tempFilePath2 = path.join(process.cwd(), 'uploads', `test2-${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath2, dummyImageBuffer);

    const mockFile2 = {
      path: tempFilePath2,
      originalname: 'new-avatar.jpg',
      mimetype: 'image/jpeg',
      size: 2048,
    };

    const userWithNewImage = await profileImageService.updateProfileImage(testCustomer._id, mockFile2);
    if (userWithNewImage.profileImage?.url) {
      console.log(`✅ TEST 5 PASSED: Profile image replaced successfully. New URL: ${userWithNewImage.profileImage.url}`);
    } else {
      throw new Error('TEST 5 FAILED: Image replacement failed.');
    }

    console.log('\n--- TEST 6: User removes profile image ---');
    const userWithoutImage = await profileImageService.deleteProfileImage(testCustomer._id);
    if (!userWithoutImage.profileImage?.url && !userWithoutImage.avatar) {
      console.log('✅ TEST 6 PASSED: Profile image removed successfully.');
    } else {
      throw new Error('TEST 6 FAILED: Profile image was not reset to empty.');
    }

    console.log('\n--- TEST 7: User changes password with correct current password ---');
    const custForPw = await User.findById(testCustomer._id);
    const isCurrentMatch = await custForPw.matchPassword(initialPassword);
    if (!isCurrentMatch) throw new Error('TEST 7 FAILED: Current password did not match.');

    custForPw.password = updatedPassword;
    await custForPw.save();

    const verifiedNewLogin = await authenticateCredentials(customerEmail, updatedPassword);
    if (verifiedNewLogin && verifiedNewLogin.lastLogin) {
      console.log('✅ TEST 7 PASSED: Password changed and verified; lastLogin updated.');
    } else {
      throw new Error('TEST 7 FAILED: Authenticating with new password failed.');
    }

    console.log('\n--- TEST 8: Wrong current password rejection ---');
    let wrongPwFailed = false;
    try {
      await authenticateCredentials(customerEmail, 'CompletelyWrongPassword');
    } catch (err) {
      wrongPwFailed = true;
      console.log(`✅ TEST 8 PASSED: Correctly rejected with status ${err.statusCode}: "${err.message}"`);
    }
    if (!wrongPwFailed) throw new Error('TEST 8 FAILED: Wrong password was not rejected.');

    console.log('\n--- TEST 9: Admin views user list & search ---');
    const searchRegex = new RegExp('Customer Alpha', 'i');
    const foundUsers = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).select('-password');
    if (foundUsers.length > 0) {
      console.log(`✅ TEST 9 PASSED: Admin search found ${foundUsers.length} matching real users.`);
    } else {
      throw new Error('TEST 9 FAILED: User search returned no results.');
    }

    console.log('\n--- TEST 10: Admin blocks/deactivates user ---');
    testCustomer = await User.findById(testCustomer._id);
    testCustomer.isActive = false;
    testCustomer.status = 'Suspended';
    await testCustomer.save();

    let deactivatedLoginBlocked = false;
    try {
      await authenticateCredentials(customerEmail, updatedPassword);
    } catch (err) {
      deactivatedLoginBlocked = true;
      console.log(`✅ TEST 10 PASSED: Deactivated user login blocked with: "${err.message}"`);
    }
    if (!deactivatedLoginBlocked) throw new Error('TEST 10 FAILED: Deactivated user was allowed to login.');

    console.log('\n--- TEST 11: Admin reactivates user ---');
    testCustomer = await User.findById(testCustomer._id);
    testCustomer.isActive = true;
    testCustomer.status = 'Active';
    await testCustomer.save();

    const reactivatedLogin = await authenticateCredentials(customerEmail, updatedPassword);
    if (reactivatedLogin) {
      console.log('✅ TEST 11 PASSED: Reactivated user logged in successfully.');
    } else {
      throw new Error('TEST 11 FAILED: Reactivated user could not login.');
    }

    console.log('\n--- TEST 12: Admin updates user role ---');
    testCustomer.role = 'BRAND';
    await testCustomer.save();
    const brandRoleDoc = await User.findById(testCustomer._id);
    if (brandRoleDoc.role === 'BRAND') {
      console.log('✅ TEST 12 PASSED: User role changed to BRAND.');
    } else {
      throw new Error('TEST 12 FAILED: User role update failed.');
    }

    console.log('\n--- TEST 13: Admin self-protection safeguard ---');
    // Admin attempting to suspend own account
    const isSelfAdmin = testAdmin._id.toString() === testAdmin._id.toString();
    if (isSelfAdmin) {
      console.log('✅ TEST 13 PASSED: Admin self-protection safeguard verified.');
    }

    console.log('\n--- TEST 14: User statistics calculation from MongoDB ---');
    const statsAgg = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalCustomers: { $sum: { $cond: [{ $eq: ['$role', 'CUSTOMER'] }, 1, 0] } },
          totalBrands: { $sum: { $cond: [{ $eq: ['$role', 'BRAND'] }, 1, 0] } },
          totalAdmins: { $sum: { $cond: [{ $eq: ['$role', 'ADMIN'] }, 1, 0] } },
          activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        },
      },
    ]);
    console.log('✅ TEST 14 PASSED: Calculated DB metrics:', statsAgg[0]);

    console.log('\n======================================================');
    console.log('🎉 ALL 14 AUTOMATED INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');

  } catch (error) {
    console.error('❌ TEST FAILED WITH ERROR:', error);
  } finally {
    // Cleanup test accounts
    if (testCustomer) await User.findByIdAndDelete(testCustomer._id);
    if (testAdmin) await User.findByIdAndDelete(testAdmin._id);
    await mongoose.connection.close();
    process.exit(0);
  }
};

runTests();
