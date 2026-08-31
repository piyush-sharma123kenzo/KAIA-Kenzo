import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/kaia-tech';
const ATLAS_URI = 'mongodb+srv://piyushsharma_db_user:9B4OgEWACnirmgjI@cluster0.rrinoas.mongodb.net/kaia-tech?retryWrites=true&w=majority';

const updateAdminPassword = async () => {
  const newPassword = 'Piyush@2004';
  const email = 'piyush.sharma@kenzoinfosystems.com';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 1. Update Atlas
  try {
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    const AtlasUser = atlasConn.model('User', User.schema);
    await AtlasUser.updateOne(
      { email },
      { $set: { password: hashedPassword, role: 'ADMIN', status: 'Active', emailVerified: true } },
      { upsert: true }
    );
    console.log(`✓ Atlas Database: Admin password updated to "${newPassword}"`);
    await atlasConn.close();
  } catch (err) {
    console.error('Atlas update error:', err.message);
  }

  // 2. Update Local DB
  try {
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    const LocalUser = localConn.model('User', User.schema);
    await LocalUser.updateOne(
      { email },
      { $set: { password: hashedPassword, role: 'ADMIN', status: 'Active', emailVerified: true } },
      { upsert: true }
    );
    console.log(`✓ Local Database: Admin password updated to "${newPassword}"`);
    await localConn.close();
  } catch (err) {
    console.error('Local update error:', err.message);
  }

  process.exit(0);
};

updateAdminPassword();
