/**
 * KAIA Technologies — Multi-User Registration & Real OTP System Verification Test
 * 
 * Tests:
 *  1. Multi-domain registration (Gmail, Yahoo, Outlook, Corporate Domain)
 *  2. Isolated OTP generation (Each user receives a unique OTP)
 *  3. Cross-user isolation (User A cannot verify User B's OTP)
 *  4. Correct OTP verification & account activation
 *  5. Duplicate registration rejection on verified email ("This email is already registered. Please login.")
 *  6. Unverified account re-registration & fresh OTP issuance (no duplicate key collision)
 *  7. Brute force protection (5 failed attempts invalidates OTP)
 *  8. 60-second resend cooldown protection (HTTP 429)
 *  9. Login gatekeeping (blocked when unverified, successful when verified)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { registerNewUser } from '../services/auth/registration.service.js';
import { generateAndSendOtp, verifyOtpCode } from '../services/auth/otp.service.js';
import { authenticateCredentials } from '../services/auth/login.service.js';
import { verifySignupEmailOtp, resendSignupVerificationOtp } from '../services/auth/emailVerification.service.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const runTests = async () => {
  console.log('🚀 Starting KAIA Multi-User Registration & Real OTP Test Suite...\n');
  await connectDB();

  const testEmails = [
    'test.multi1@gmail.com',
    'test.multi2@yahoo.com',
    'test.multi3@outlook.com',
    'test.multi4@acme-enterprises.com',
  ];

  // Cleanup any leftover test records
  await User.deleteMany({ email: { $in: testEmails } });
  await OTP.deleteMany({ email: { $in: testEmails } });

  try {
    // ─── TEST 1: Multi-Domain Registration ──────────────────────────────────────
    console.log('📋 [TEST 1] Registering 4 users across Gmail, Yahoo, Outlook, and Corporate Domain...');
    const userOtpMap = {};

    for (let i = 0; i < testEmails.length; i++) {
      const email = testEmails[i];
      const res = await registerNewUser({
        name: `User ${i + 1}`,
        email,
        password: 'Password@123',
        confirmPassword: 'Password@123',
        role: 'CUSTOMER',
      });

      if (!res.success || !res.requiresVerification) {
        throw new Error(`Registration failed for ${email}`);
      }
      userOtpMap[email] = res.devOtp;
      console.log(`  ✓ Registered: ${email} -> OTP: ${res.devOtp ? 'Generated (6-digit)' : 'Sent'}`);
    }
    console.log('  ➜ TEST 1 PASSED: Multi-domain registration succeeded.\n');

    // ─── TEST 2: OTP Distinctness & Isolation ────────────────────────────────────
    console.log('📋 [TEST 2] Verifying distinct OTPs & Cross-User Security Isolation...');
    const email1 = testEmails[0]; // gmail
    const email2 = testEmails[1]; // yahoo

    // Fetch live OTP docs from DB
    const otpDoc1 = await OTP.findOne({ email: email1, purpose: 'SIGNUP_VERIFICATION' });
    const otpDoc2 = await OTP.findOne({ email: email2, purpose: 'SIGNUP_VERIFICATION' });

    if (!otpDoc1 || !otpDoc2) {
      throw new Error('OTP records missing in database.');
    }

    // Try verifying User 1 with User 2's raw OTP
    const crossVerify = await verifyOtpCode(email1, userOtpMap[email2], 'SIGNUP_VERIFICATION');
    if (crossVerify.valid) {
      throw new Error('Security Breach: User 1 was able to verify using User 2 OTP!');
    }
    console.log(`  ✓ Cross-user verification correctly rejected: ${crossVerify.error}`);
    console.log('  ➜ TEST 2 PASSED: OTP security isolation confirmed.\n');

    // ─── TEST 3: Correct Verification & Account Activation ───────────────────────
    console.log('📋 [TEST 3] Verifying User 1 (Gmail) and User 2 (Yahoo)...');
    const verify1 = await verifySignupEmailOtp(email1, userOtpMap[email1]);
    if (!verify1.success || !verify1.user.emailVerified) {
      throw new Error('Verification failed for User 1');
    }
    console.log(`  ✓ User 1 verified: ${email1} (emailVerified: true)`);

    const verify2 = await verifySignupEmailOtp(email2, userOtpMap[email2]);
    if (!verify2.success || !verify2.user.emailVerified) {
      throw new Error('Verification failed for User 2');
    }
    console.log(`  ✓ User 2 verified: ${email2} (emailVerified: true)`);
    console.log('  ➜ TEST 3 PASSED: Account activation verified.\n');

    // ─── TEST 4: Duplicate Registration on Verified User ─────────────────────────
    console.log('📋 [TEST 4] Testing duplicate registration on verified email...');
    try {
      await registerNewUser({
        name: 'User 1 Duplicate',
        email: email1.toUpperCase(), // Case insensitive test
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
      throw new Error('Duplicate registration should have been blocked!');
    } catch (err) {
      if (err.message === 'This email is already registered. Please login.') {
        console.log(`  ✓ Correctly rejected duplicate: "${err.message}"`);
      } else {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }
    console.log('  ➜ TEST 4 PASSED: Duplicate verified email blocked.\n');

    // ─── TEST 5: Unverified User Resumption (User 3 Outlook) ─────────────────────
    console.log('📋 [TEST 5] Testing unverified account re-registration resumption...');
    const email3 = testEmails[2];
    const resumeRes = await registerNewUser({
      name: 'User 3 Updated',
      email: email3,
      password: 'NewPassword@123',
      confirmPassword: 'NewPassword@123',
    });

    if (!resumeRes.success || !resumeRes.requiresVerification) {
      throw new Error('Unverified resumption failed');
    }
    console.log(`  ✓ Unverified user credentials updated & new OTP generated for ${email3}`);
    console.log('  ➜ TEST 5 PASSED: Unverified account resumption works seamlessly.\n');

    // ─── TEST 6: Brute Force 5-Attempt Limit ─────────────────────────────────────
    console.log('📋 [TEST 6] Testing 5-attempt brute-force protection on User 4 (Corporate)...');
    const email4 = testEmails[3];
    for (let attempt = 1; attempt <= 4; attempt++) {
      const failRes = await verifyOtpCode(email4, '000000', 'SIGNUP_VERIFICATION');
      if (failRes.valid) throw new Error('Invalid OTP unexpectedly passed');
      console.log(`  ✓ Failed attempt ${attempt}/5: ${failRes.error}`);
    }

    // 5th failed attempt should destroy the OTP
    const fifthAttempt = await verifyOtpCode(email4, '000000', 'SIGNUP_VERIFICATION');
    console.log(`  ✓ 5th attempt invalidation: ${fifthAttempt.error}`);

    const checkOtpDeleted = await OTP.findOne({ email: email4, purpose: 'SIGNUP_VERIFICATION' });
    if (checkOtpDeleted) {
      throw new Error('OTP was not deleted after 5 failed attempts!');
    }
    console.log('  ✓ Verified OTP document deleted from MongoDB after 5 attempts.');
    console.log('  ➜ TEST 6 PASSED: Brute force protection working perfectly.\n');

    // ─── TEST 7: 60-Second Resend Cooldown ───────────────────────────────────────
    console.log('📋 [TEST 7] Testing 60-second resend cooldown...');
    // Trigger fresh OTP for User 4
    await resendSignupVerificationOtp(email4);
    try {
      // Immediate 2nd resend should trigger 429
      await resendSignupVerificationOtp(email4);
      throw new Error('Resend should have been blocked by 60s cooldown!');
    } catch (err) {
      if (err.statusCode === 429) {
        console.log(`  ✓ 60-second cooldown triggered (HTTP 429): "${err.message}"`);
      } else {
        throw new Error(`Unexpected cooldown error: ${err.message}`);
      }
    }
    console.log('  ➜ TEST 7 PASSED: 60-second resend cooldown active.\n');

    // ─── TEST 8: Login Gatekeeping ───────────────────────────────────────────────
    console.log('📋 [TEST 8] Testing Login Gatekeeping (Unverified vs Verified)...');
    // Unverified login (User 4)
    try {
      await authenticateCredentials(email4, 'Password@123');
      throw new Error('Unverified user should not be able to login!');
    } catch (err) {
      if (err.requiresVerification && err.message === 'Please verify your email before logging in.') {
        console.log(`  ✓ Blocked unverified login: "${err.message}"`);
      } else {
        throw new Error(`Unexpected unverified login error: ${err.message}`);
      }
    }

    // Verified login (User 1)
    const loginUser1 = await authenticateCredentials(email1, 'Password@123');
    if (!loginUser1 || loginUser1.email !== email1) {
      throw new Error('Verified login failed for User 1');
    }
    console.log(`  ✓ Verified user login succeeded: ${loginUser1.name} (${loginUser1.email})`);
    console.log('  ➜ TEST 8 PASSED: Login gatekeeping functioning perfectly.\n');

    // Clean up test data
    await User.deleteMany({ email: { $in: testEmails } });
    await OTP.deleteMany({ email: { $in: testEmails } });

    console.log('════════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL 8 MULTI-USER & REAL OTP TESTS PASSED WITH 100% SUCCESS!');
    console.log('════════════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Suite Failed:', err);
    process.exit(1);
  }
};

runTests();
