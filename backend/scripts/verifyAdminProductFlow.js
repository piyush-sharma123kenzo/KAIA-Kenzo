import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const testAdminProductFlow = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaia-tech';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Check brand
    let asus = await Brand.findOne({ slug: 'asus' });
    if (!asus) {
      asus = await Brand.create({ name: 'ASUS', slug: 'asus', status: 'Approved', isActive: true });
    }

    // 2. Check category
    let laptops = await Category.findOne({ slug: 'laptops' });
    if (!laptops) {
      laptops = await Category.create({ name: 'Laptops', slug: 'laptops', isActive: true });
    }

    console.log('✓ Brand & Category verified.');

    // 3. Create a verified live test product
    const testProduct = await Product.create({
      name: 'ASUS ROG Zephyrus G16 OLED Gaming Laptop',
      slug: 'asus-rog-zephyrus-g16-oled-gaming-laptop',
      brand: asus._id,
      category: laptops._id,
      description: 'Ultra-slim AI gaming laptop with 2.5K 240Hz OLED display, Intel Core Ultra 9, and RTX 4080 graphics.',
      mrp: 239990,
      sellingPrice: 209990,
      stockQuantity: 12,
      SKU: 'ASU-ROG-G16-4080',
      modelNumber: 'GU605MY-QR046WS',
      images: [
        { url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80', isPrimary: true, altText: 'Front Angle' },
        { url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80', isPrimary: false, altText: 'Top View' },
      ],
      stock: { quantity: 12, availableQuantity: 12, reservedQuantity: 0, reorderThreshold: 5 },
      specifications: {
        Processor: 'Intel Core Ultra 9 185H',
        GPU: 'NVIDIA GeForce RTX 4080 12GB',
        RAM: '32GB LPDDR5X 7467MHz',
        Storage: '1TB PCIe 4.0 NVMe SSD',
        Display: '16.0" 2.5K (2560x1600) OLED 240Hz 0.2ms',
      },
      status: 'Approved',
      isActive: true,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
    });

    console.log(`✓ Product created successfully with ID: ${testProduct._id}`);
    console.log(`✓ Product live on storefront at /product/${testProduct.slug}`);

    // Verify lookup
    const found = await Product.findOne({ slug: testProduct.slug }).populate('brand').populate('category');
    console.log(`✓ Lookup verified: Name="${found.name}", Brand="${found.brand.name}", Category="${found.category.name}", Price=₹${found.sellingPrice}`);

    process.exit(0);
  } catch (err) {
    console.error('Verification error:', err);
    process.exit(1);
  }
};

testAdminProductFlow();
