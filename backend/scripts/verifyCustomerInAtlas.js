import mongoose from 'mongoose';
import OTP from '../models/OTP.js';
import User from '../models/User.js';

const ATLAS_URI = 'mongodb+srv://piyushsharma_db_user:9B4OgEWACnirmgjI@cluster0.rrinoas.mongodb.net/kaia-tech?retryWrites=true&w=majority';

const checkUserAndOtp = async () => {
  try {
    await mongoose.connect(ATLAS_URI);
    const email = 'piyushdeg9@gmail.com';

    // Verify user directly in Atlas so they can log in instantly
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { emailVerified: true, status: 'Active' } },
      { new: true }
    );

    console.log('User status in Atlas:', user ? {
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      status: user.status,
      role: user.role
    } : 'User not found');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkUserAndOtp();
