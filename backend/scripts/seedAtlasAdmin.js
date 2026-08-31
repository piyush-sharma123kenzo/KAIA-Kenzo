import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const ATLAS_URI = 'mongodb+srv://piyushsharma_db_user:9B4OgEWACnirmgjI@cluster0.rrinoas.mongodb.net/kaia-tech?retryWrites=true&w=majority';

const seedAtlasAdmin = async () => {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('Connected to Atlas for Admin Verification...');

    const adminEmail = 'piyush.sharma@kenzoinfosystems.com';
    let admin = await User.findOne({ email: adminEmail });

    const hashedPassword = await bcrypt.hash('Piyush@1234', 10);

    if (!admin) {
      admin = await User.create({
        name: 'Piyush Sharma',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        phone: '9334683692',
        emailVerified: true,
        status: 'Active',
      });
      console.log('✓ Created Admin in MongoDB Atlas:', admin.email);
    } else {
      admin.password = hashedPassword;
      admin.role = 'ADMIN';
      admin.status = 'Active';
      admin.emailVerified = true;
      await admin.save();
      console.log('✓ Updated Admin credentials in MongoDB Atlas:', admin.email);
    }

    const testMatch = await bcrypt.compare('Piyush@1234', admin.password);
    console.log('✓ Admin Login Test (Piyush@1234):', testMatch ? 'READY & WORKING' : 'FAILED');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin in Atlas:', err);
    process.exit(1);
  }
};

seedAtlasAdmin();
