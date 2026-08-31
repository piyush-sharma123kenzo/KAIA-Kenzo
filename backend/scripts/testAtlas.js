import mongoose from 'mongoose';

const ATLAS_URI = 'mongodb+srv://piyushsharma_db_user:9B4OgEWACnirmgjI@cluster0.rrinoas.mongodb.net/kaia-tech?retryWrites=true&w=majority';

const testAtlasConnection = async () => {
  try {
    console.log('Testing connection to MongoDB Atlas...');
    const conn = await mongoose.connect(ATLAS_URI);
    console.log(`✓ SUCCESS! Connected to MongoDB Atlas: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`Active Collections: ${collections.map(c => c.name).join(', ') || 'None yet (Fresh DB)'}`);
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Connection Failed:', err.message);
    process.exit(1);
  }
};

testAtlasConnection();
