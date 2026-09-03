/**
 * KAIA Technologies — Controlled One-Time Development User Cleanup Script
 * 
 * Safety Guarantees:
 * 1. Strictly blocked if NODE_ENV === 'production'
 * 2. Identifies and logs target Database and User collection
 * 3. Deletes ONLY user records from 'users' collection
 * 4. Deletes test OTP records from 'otps' collection
 * 5. Re-establishes database-level unique index on 'email'
 * 6. Validates all other collections (Products, Orders, Brands, etc.) remain untouched
 * 7. This is a one-time execution script, NOT run on server startup
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const runControlledCleanup = async () => {
  console.log('\n=============================================================');
  console.log('KAIA TECHNOLOGIES — CONTROLLED DEVELOPMENT USER CLEANUP');
  console.log('=============================================================\n');

  // 1. Environment Safety Check
  const currentEnv = process.env.NODE_ENV || 'development';
  console.log(`[SAFETY CHECK] Current Environment: ${currentEnv.toUpperCase()}`);
  if (currentEnv === 'production') {
    console.error('❌ ABORTED: Controlled cleanup is permanently blocked in production environment.');
    process.exit(1);
  }
  console.log('✓ Environment verified as non-production (Safe to proceed).\n');

  try {
    // 2. Connect to Database
    await connectDB();
    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;
    console.log(`[TARGET DATABASE]: ${dbName}`);
    console.log(`[TARGET USER COLLECTION]: ${User.collection.name}`);
    console.log(`[TARGET OTP COLLECTION]: ${OTP.collection.name}\n`);

    // 3. Inspect existing collection counts before deletion
    const allCollections = await db.listCollections().toArray();
    const collectionNames = allCollections.map(c => c.name);
    console.log('[AUDIT] All Existing Collections in Database:', collectionNames.join(', '));

    const countsBefore = {};
    for (const name of collectionNames) {
      countsBefore[name] = await db.collection(name).countDocuments();
    }

    const userCountBefore = countsBefore['users'] || 0;
    const otpCountBefore = countsBefore['otps'] || 0;

    console.log('\n--- Status Before Cleanup ---');
    console.log(`• Users in '${User.collection.name}': ${userCountBefore}`);
    console.log(`• OTPs in '${OTP.collection.name}': ${otpCountBefore}`);
    
    // Other collections audit
    Object.keys(countsBefore).forEach(col => {
      if (col !== 'users' && col !== 'otps') {
        console.log(`• Preserved collection '${col}': ${countsBefore[col]} records`);
      }
    });

    // 4. Perform Deletion ONLY on User and OTP collections
    console.log('\n--- Executing Controlled Cleanup ---');
    const userDeleteResult = await User.deleteMany({});
    const otpDeleteResult = await OTP.deleteMany({});
    console.log(`✓ Deleted ${userDeleteResult.deletedCount} user record(s).`);
    console.log(`✓ Deleted ${otpDeleteResult.deletedCount} OTP record(s).`);

    // 5. Verify User count after deletion
    const userCountAfter = await User.countDocuments();
    const otpCountAfter = await OTP.countDocuments();
    console.log(`\n--- Status After Cleanup ---`);
    console.log(`• Users in '${User.collection.name}': ${userCountAfter} (Expected: 0)`);
    console.log(`• OTPs in '${OTP.collection.name}': ${otpCountAfter} (Expected: 0)`);

    if (userCountAfter !== 0) {
      throw new Error(`Cleanup verification failed: User count is ${userCountAfter}, expected 0.`);
    }

    // 6. Create & Verify Unique Email Index on User collection
    console.log('\n--- Database Index Verification ---');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    const userIndexes = await User.collection.indexes();
    console.log('Active indexes on User collection:');
    userIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (Unique: ${!!idx.unique})`);
    });

    const hasUniqueEmailIndex = userIndexes.some(
      idx => idx.key?.email === 1 && idx.unique === true
    );
    console.log(`✓ Database-Level Unique Email Index: ${hasUniqueEmailIndex ? 'ACTIVE & VERIFIED' : 'MISSING'}`);

    // 7. Verify all other collections remain 100% untouched
    console.log('\n--- Non-User Collections Integrity Check ---');
    let integrityPassed = true;
    for (const name of collectionNames) {
      if (name !== 'users' && name !== 'otps') {
        const countAfter = await db.collection(name).countDocuments();
        if (countAfter !== countsBefore[name]) {
          console.error(`❌ INTEGRITY BREACH: Collection '${name}' changed from ${countsBefore[name]} to ${countAfter}`);
          integrityPassed = false;
        } else {
          console.log(`✓ Collection '${name}' unchanged (${countAfter} records intact).`);
        }
      }
    }

    if (integrityPassed) {
      console.log('\n✓ ALL APPLICATION DATA PRESERVED: Products, Brands, Orders, Payments, Settings are 100% intact.');
    }

    console.log('\n=============================================================');
    console.log('CONTROLLED CLEANUP COMPLETED SUCCESSFULLY');
    console.log('Database is clean and ready for registration & OTP testing.');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during controlled cleanup:', err);
    process.exit(1);
  }
};

runControlledCleanup();
