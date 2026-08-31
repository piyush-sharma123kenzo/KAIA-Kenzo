import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Inventory from '../models/Inventory.js';
import SerialNumber from '../models/SerialNumber.js';

const verify = async () => {
  try {
    await connectDB();

    const brandCount = await Brand.countDocuments();
    const catCount = await Category.countDocuments();
    const prodCount = await Product.countDocuments();
    const invCount = await Inventory.countDocuments();
    const snCount = await SerialNumber.countDocuments();

    console.log(`✅ MongoDB Connection Verified`);
    console.log(`Brands: ${brandCount}`);
    console.log(`Categories: ${catCount}`);
    console.log(`Products: ${prodCount}`);
    console.log(`Inventory Records: ${invCount}`);
    console.log(`Serial Numbers: ${snCount}`);

    // Sample product query
    const sample = await Product.findOne({ isFeatured: true }).populate('brand category');
    console.log(`Sample Featured Product: ${sample.name} by ${sample.brand.name} in ${sample.category.name} (₹${sample.sellingPrice})`);
    console.log(`Available stock: ${sample.stock.availableQuantity}, Specifications:`, sample.specifications);

    process.exit(0);
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  }
};

verify();
