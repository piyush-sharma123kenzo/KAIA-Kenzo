import mongoose from 'mongoose';
import User from '../models/User.js';

const ATLAS_URI = 'mongodb+srv://piyushsharma_db_user:9B4OgEWACnirmgjI@cluster0.rrinoas.mongodb.net/kaia-tech?retryWrites=true&w=majority';

const verifyEmail = async () => {
  try {
    await mongoose.connect(ATLAS_URI);
    const email = 'piyushxrma214298@gmail.com';
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { emailVerified: true, status: 'Active' } },
      { new: true }
    );
    console.log('Verified in Atlas:', user?.email, 'Verified:', user?.emailVerified);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

verifyEmail();
