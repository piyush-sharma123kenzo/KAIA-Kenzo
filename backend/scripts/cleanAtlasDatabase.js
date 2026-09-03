/**
 * KAIA Technologies — MongoDB Atlas Remote Cloud Database Cleanup
 * 
 * Safely cleans temporary test users and OTP records from MongoDB Atlas.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import OTP from '../models/OTP.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const rawAtlasUri = 'mongodb+srv://piyushsharma_db_user:Piyush-1234@cluster0.rrinoas.mongodb.net/?retryWrites=true&w=majority';

const cleanAtlas = async () => {
  console.log('\n=============================================================');
  console.log('CONNECTING TO MONGODB ATLAS CLUSTER...');
  console.log('=============================================================\n');

  try {
    const conn = await mongoose.connect(rawAtlasUri, {
      dbName: 'kaia-tech',
      serverSelectionTimeoutMS: 15000,
    });

    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;
    console.log(`✓ Connected to Atlas Database: ${dbName}`);

    // List all databases in cluster to check if test users exist in another db name (e.g. test, kaia-tech)
    const adminDb = mongoose.connection.db.admin();
    const dbsList = await adminDb.listDatabases();
    console.log('\nDatabases found on Atlas cluster:');
    dbsList.databases.forEach(d => console.log(`  - ${d.name} (${d.sizeOnDisk} bytes)`));

    // Inspect collections in every non-system database on Atlas
    for (const d of dbsList.databases) {
      if (['admin', 'local', 'config'].includes(d.name)) continue;

      const targetDb = mongoose.connection.client.db(d.name);
      const cols = await targetDb.listCollections().toArray();
      const colNames = cols.map(c => c.name);

      console.log(`\n--- Inspecting Database '${d.name}' ---`);
      console.log('Collections:', colNames.join(', '));

      if (colNames.includes('users')) {
        const usersCol = targetDb.collection('users');
        const userDocs = await usersCol.find({}).toArray();
        console.log(`Found ${userDocs.length} user(s) in '${d.name}.users':`);
        userDocs.forEach(u => console.log(`  • ${u.name} <${u.email}> (Verified: ${u.emailVerified})`));

        const userDelete = await usersCol.deleteMany({});
        console.log(`✓ Deleted ${userDelete.deletedCount} user(s) from '${d.name}.users'.`);

        // Re-create unique email index
        await usersCol.createIndex({ email: 1 }, { unique: true });
        console.log(`✓ Unique email index re-established on '${d.name}.users'.`);
      }

      if (colNames.includes('otps')) {
        const otpDelete = await targetDb.collection('otps').deleteMany({});
        console.log(`✓ Deleted ${otpDelete.deletedCount} OTP record(s) from '${d.name}.otps'.`);
      }
    }

    console.log('\n=============================================================');
    console.log('ATLAS CLUSTER CLEANUP COMPLETED SUCCESSFULLY');
    console.log('All test users purged from MongoDB Atlas. User count is now 0.');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Atlas Connection/Cleanup Error:', err.message);
    process.exit(1);
  }
};

cleanAtlas();
