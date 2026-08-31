import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const ATLAS_URI = 'mongodb+srv://piyushsharma_db_user:9B4OgEWACnirmgjI@cluster0.rrinoas.mongodb.net/kaia-tech?retryWrites=true&w=majority';

const setAtlasAdmin = async () => {
  try {
    await mongoose.connect(ATLAS_URI);
    const hash = await bcrypt.hash('Piyush@1234', 10);
    
    await User.updateOne(
      { email: 'piyush.sharma@kenzoinfosystems.com' },
      {
        $set: {
          name: 'Piyush Sharma',
          password: hash,
          role: 'ADMIN',
          status: 'Active',
          emailVerified: true,
        },
      },
      { upsert: true }
    );

    const user = await User.findOne({ email: 'piyush.sharma@kenzoinfosystems.com' });
    const isMatch = await bcrypt.compare('Piyush@1234', user.password);
    console.log('✓ Atlas Admin user password verified:', isMatch);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

setAtlasAdmin();
