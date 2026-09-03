import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Otp from '../models/Otp.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const cleanUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();

    const allUsers = await User.find({}, 'name email role emailVerified');
    console.log(`Found ${allUsers.length} total users in database:`);
    allUsers.forEach((u) => {
      console.log(` - [${u.role}] ${u.name} <${u.email}> (Verified: ${u.emailVerified})`);
    });

    // Delete all users and otps
    const userDeleteResult = await User.deleteMany({});
    const otpDeleteResult = await Otp.deleteMany({});

    console.log(`\n✓ Successfully deleted ${userDeleteResult.deletedCount} user(s).`);
    console.log(`✓ Successfully deleted ${otpDeleteResult.deletedCount} OTP record(s).`);
    console.log('Database registration slate is now completely clean!');

    process.exit(0);
  } catch (err) {
    console.error('Error cleaning users:', err);
    process.exit(1);
  }
};

cleanUsers();
