/**
 * KAIA Technologies — Production Administrator Server-Side Bootstrap CLI
 * 
 * Usage:
 *   npm run bootstrap:admin
 *   node scripts/bootstrapAdmin.js [email] [password] [fullName]
 * 
 * Or configure environment variables:
 *   BOOTSTRAP_ADMIN_EMAIL=admin@kaia.tech
 *   BOOTSTRAP_ADMIN_PASSWORD=SecurePassword@123
 *   BOOTSTRAP_ADMIN_NAME="Chief Administrator"
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const bootstrapAdmin = async () => {
  const args = process.argv.slice(2);
  const targetEmail = (
    args[0] ||
    process.env.BOOTSTRAP_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'piyush.sharma@kenzoinfosystems.com'
  ).trim().toLowerCase();

  const targetPassword = (
    args[1] ||
    process.env.BOOTSTRAP_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    'Piyush@1234'
  );

  const targetName = (
    args[2] ||
    process.env.BOOTSTRAP_ADMIN_NAME ||
    process.env.ADMIN_NAME ||
    'Piyush Kumar Sharma'
  ).trim();

  if (!targetEmail || !targetPassword) {
    console.error('❌ Error: Both Admin Email and Password must be provided.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';

  try {
    console.log('\n========================================================');
    console.log('  KAIA TECHNOLOGIES — ROOT ADMINISTRATOR BOOTSTRAP');
    console.log('========================================================');
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log(`✓ Connected to Database: ${mongoose.connection.name || 'kaia-tech'}`);

    let user = await User.findOne({ email: targetEmail });

    if (user) {
      user.name = targetName || user.name;
      user.password = targetPassword; // User model pre-save hook will securely hash
      user.role = 'ADMIN';
      user.emailVerified = true;
      user.status = 'Active';
      user.isActive = true;
      await user.save();
      console.log(`✓ Updated existing account [${targetEmail}] to verified ADMIN role.`);
    } else {
      user = await User.create({
        name: targetName,
        email: targetEmail,
        password: targetPassword,
        role: 'ADMIN',
        emailVerified: true,
        status: 'Active',
        isActive: true,
      });
      console.log(`✓ Created new verified root ADMIN account for [${targetEmail}].`);
    }

    // Verify password hash comparison
    const verifyMatch = await bcrypt.compare(targetPassword, user.password);
    if (!verifyMatch) {
      throw new Error('Verification assertion failed: Stored password hash does not match input.');
    }

    console.log('--------------------------------------------------------');
    console.log('  ADMIN BOOTSTRAP COMPLETE');
    console.log(`  • Name:           ${user.name}`);
    console.log(`  • Email:          ${user.email}`);
    console.log(`  • Role:           ${user.role}`);
    console.log(`  • Email Verified: ${user.emailVerified}`);
    console.log(`  • Status:         ${user.status}`);
    console.log('========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Admin Bootstrap Failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

bootstrapAdmin();
