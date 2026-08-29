import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../backend/config/db.js';
import User from '../backend/models/User.js';
import Brand from '../backend/models/Brand.js';
import Category from '../backend/models/Category.js';
import Product from '../backend/models/Product.js';
import SerialNumber from '../backend/models/SerialNumber.js';
import Coupon from '../backend/models/Coupon.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    console.log('Clearing database...');
    await User.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await SerialNumber.deleteMany({});
    await Coupon.deleteMany({});

    console.log('Creating Users...');
    // Base password hash helper
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password@123', salt);

    const adminUser = await User.create({
      name: 'KAIA Admin Team',
      email: 'admin@kaia.tech',
      password: 'Password@123', // hooks hash it too, but let's provide plain text for hooks or pre-hashed
      role: 'ADMIN',
      phone: '9876543210',
    });

    const appleOwner = await User.create({
      name: 'Apple India Logistics',
      email: 'apple@kaia.tech',
      password: 'Password@123',
      role: 'BRAND',
      phone: '9876543211',
    });

    const samsungOwner = await User.create({
      name: 'Samsung Electronics India',
      email: 'samsung@kaia.tech',
      password: 'Password@123',
      role: 'BRAND',
      phone: '9876543212',
    });

    const asusOwner = await User.create({
      name: 'ASUS Republic of Gamers',
      email: 'asus@kaia.tech',
      password: 'Password@123',
      role: 'BRAND',
      phone: '9876543213',
    });

    const customerUser = await User.create({
      name: 'Piyush Sharma',
      email: 'customer@kaia.tech',
      password: 'Password@123',
      role: 'CUSTOMER',
      phone: '9876543214',
      gstin: '07AAAAA1111A1Z1', // Sample valid format GST
    });

    console.log('Creating Brands...');
    const appleBrand = await Brand.create({
      owner: appleOwner._id,
      name: 'Apple',
      slug: 'apple',
      logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&auto=format&fit=crop&q=60',
      description: 'Think Different. High-end consumer devices, Macs, and iOS computing technology.',
      contactEmail: 'partner@apple.kaia.tech',
      contactPhone: '1800100200',
      status: 'Approved',
      businessDetails: {
        gstin: '27AAAAA1111A1Z1',
        pan: 'AAAAA1111A',
        address: 'BKC, Bandra East, Mumbai, MH, 400051',
      },
      bankDetails: {
        accountNumber: '12345678901',
        ifsc: 'HDFC0000060',
        bankName: 'HDFC Bank',
      },
    });

    const samsungBrand = await Brand.create({
      owner: samsungOwner._id,
      name: 'Samsung',
      slug: 'samsung',
      logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=60',
      description: 'Inspire the World, Create the Future. Leading screen, mobile, and memory technologies.',
      contactEmail: 'partner@samsung.kaia.tech',
      contactPhone: '1800200300',
      status: 'Approved',
      businessDetails: {
        gstin: '27BBBBB2222B2Z2',
        pan: 'BBBBB2222B',
        address: 'DLF CyberCity, Gurgaon, HR, 122002',
      },
      bankDetails: {
        accountNumber: '23456789012',
        ifsc: 'ICIC0000104',
        bankName: 'ICICI Bank',
      },
    });

    const asusBrand = await Brand.create({
      owner: asusOwner._id,
      name: 'ASUS',
      slug: 'asus',
      logo: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&auto=format&fit=crop&q=60',
      description: 'In Search of Incredible. High performance gaming PCs, motherboards, and PC DIY gear.',
      contactEmail: 'partner@asus.kaia.tech',
      contactPhone: '1800300400',
      status: 'Approved',
      businessDetails: {
        gstin: '27CCCCC3333C3Z3',
        pan: 'CCCCC3333C',
        address: 'Nehru Place, New Delhi, DL, 110019',
      },
      bankDetails: {
        accountNumber: '34567890123',
        ifsc: 'SBIN0000691',
        bankName: 'State Bank of India',
      },
    });

    console.log('Creating Categories...');
    const laptopsCat = await Category.create({
      name: 'Laptops',
      slug: 'laptops',
      description: 'Premium laptops, ultrabooks, and mobile workstations.',
      baseCommission: 5.0,
    });

    const smartphonesCat = await Category.create({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'High end mobile devices and cellular phones.',
      baseCommission: 6.0,
    });

    const headphonesCat = await Category.create({
      name: 'Audio & Sound',
      slug: 'audio-and-sound',
      description: 'Wireless earbuds, noise-canceling headphones, and studio monitors.',
      baseCommission: 8.0,
    });

    const componentsCat = await Category.create({
      name: 'PC Components',
      slug: 'pc-components',
      description: 'CPUs, Motherboards, RAM, Graphic Cards, and custom PC components.',
      baseCommission: 4.5,
    });

    const accessoriesCat = await Category.create({
      name: 'Keyboards & Accessories',
      slug: 'keyboards-and-accessories',
      description: 'Mechanical keyboards, gaming mice, and premium office gear.',
      baseCommission: 7.5,
    });

    console.log('Creating Products...');
    // Apple Macbook Pro
    const macbook = await Product.create({
      brand: appleBrand._id,
      name: 'Apple MacBook Pro 16" (M3 Max)',
      slug: 'apple-macbook-pro-16-m3-max',
      modelNumber: 'MRW33HN/A',
      SKU: 'APL-MBP16-M3M-01',
      category: laptopsCat._id,
      description: 'The MacBook Pro 16-inch blasts forward with M3 Max, an outrageously advanced chip that brings massive performance for the most extreme workflows. Up to 22 hours of battery life and a stunning Liquid Retina XDR display.',
      mrp: 349900,
      sellingPrice: 329900,
      gstRate: 18,
      images: [
        { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60', alt: 'MacBook Pro side profile', order: 0 },
        { url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=60', alt: 'MacBook Pro open view', order: 1 }
      ],
      stock: {
        quantity: 15,
        reservedQuantity: 0,
        reorderThreshold: 3,
      },
      specifications: {
        Processor: 'Apple M3 Max (16-Core CPU, 40-Core GPU)',
        RAM: '48GB Unified Memory',
        Storage: '1TB Superfast SSD',
        Display: '16.2-inch Liquid Retina XDR (3024 x 1964), 120Hz',
        OS: 'macOS Sonoma',
        Battery: 'Up to 22 Hours',
      },
      status: 'Approved',
    });

    // Apple iPhone 15 Pro Max
    const iphone = await Product.create({
      brand: appleBrand._id,
      name: 'Apple iPhone 15 Pro Max (256GB)',
      slug: 'apple-iphone-15-pro-max-256gb',
      modelNumber: 'MU773HN/A',
      SKU: 'APL-IP15PM-256-01',
      category: smartphonesCat._id,
      description: 'Forged in titanium, the iPhone 15 Pro Max features the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever with 5x optical zoom.',
      mrp: 159900,
      sellingPrice: 148900,
      gstRate: 18,
      images: [
        { url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=60', alt: 'iPhone 15 Pro Max angled', order: 0 },
        { url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&auto=format&fit=crop&q=60', alt: 'iPhone screen interface', order: 1 }
      ],
      stock: {
        quantity: 25,
        reservedQuantity: 0,
        reorderThreshold: 5,
      },
      specifications: {
        Processor: 'A17 Pro chip with 6-core GPU',
        RAM: '8GB RAM',
        Storage: '256GB NVMe',
        Display: '6.7-inch Super Retina XDR OLED, 120Hz ProMotion',
        OS: 'iOS 17',
        Weight: '221g',
      },
      status: 'Approved',
    });

    // Samsung Galaxy S24 Ultra
    const s24Ultra = await Product.create({
      brand: samsungBrand._id,
      name: 'Samsung Galaxy S24 Ultra (512GB)',
      slug: 'samsung-galaxy-s24-ultra-512gb',
      modelNumber: 'SM-S928B',
      SKU: 'SAM-S24U-512-01',
      category: smartphonesCat._id,
      description: 'Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility, featuring a titanium frame, built-in S Pen, and 200MP camera.',
      mrp: 139900,
      sellingPrice: 129900,
      gstRate: 18,
      images: [
        { url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=60', alt: 'Galaxy S24 Ultra Front', order: 0 },
        { url: 'https://images.unsplash.com/photo-1583573636246-18cb2246697f?w=800&auto=format&fit=crop&q=60', alt: 'Galaxy S24 Side', order: 1 }
      ],
      stock: {
        quantity: 30,
        reservedQuantity: 0,
        reorderThreshold: 5,
      },
      specifications: {
        Processor: 'Snapdragon 8 Gen 3 for Galaxy',
        RAM: '12GB LPDDR5X',
        Storage: '512GB UFS 4.0',
        Display: '6.8-inch Dynamic AMOLED 2X, QHD+, 120Hz, 2600 nits',
        OS: 'Android 14 with One UI 6.1',
        Battery: '5000 mAh',
      },
      status: 'Approved',
    });

    // Samsung Buds
    const buds2pro = await Product.create({
      brand: samsungBrand._id,
      name: 'Samsung Galaxy Buds2 Pro',
      slug: 'samsung-galaxy-buds2-pro',
      modelNumber: 'SM-R510N',
      SKU: 'SAM-BUDS2P-WHT',
      category: headphonesCat._id,
      description: 'Ultimate 24-bit Hi-Fi sound with intelligent active noise cancelling. Experience premium studio-grade sound directly in your ears with ergonomic design.',
      mrp: 19990,
      sellingPrice: 14990,
      gstRate: 18,
      images: [
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=60', alt: 'Earbuds charging case open', order: 0 }
      ],
      stock: {
        quantity: 50,
        reservedQuantity: 0,
        reorderThreshold: 10,
      },
      specifications: {
        Connectivity: 'Bluetooth 5.3',
        ANC: 'Intelligent Active Noise Cancellation with Ambient Sound',
        Battery: 'Up to 5 hours (20 hours with case) ANC ON',
        Waterproof: 'IPX7 Water Resistance',
      },
      status: 'Approved',
    });

    // ASUS Zephyrus G14
    const zephyrus = await Product.create({
      brand: asusBrand._id,
      name: 'ASUS ROG Zephyrus G14 (2024)',
      slug: 'asus-rog-zephyrus-g14-2024',
      modelNumber: 'GA403UI',
      SKU: 'ASU-ZEPH-G14-RTX4070',
      category: laptopsCat._id,
      description: 'High performance gaming and editing ultrabook. Powered by AMD Ryzen 9 and Nvidia RTX 4070, packing a gorgeous ROG Nebula OLED display in a thin CNC-aluminum chassis.',
      mrp: 194900,
      sellingPrice: 174900,
      gstRate: 18,
      images: [
        { url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=60', alt: 'ROG Zephyrus G14 Open', order: 0 },
        { url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=60', alt: 'ROG Zephyrus Lid AniMe Matrix', order: 1 }
      ],
      stock: {
        quantity: 12,
        reservedQuantity: 0,
        reorderThreshold: 2,
      },
      specifications: {
        Processor: 'AMD Ryzen 9 8945HS (8 Cores, 16 Threads)',
        RAM: '32GB LPDDR5X Dual Channel',
        GPU: 'NVIDIA GeForce RTX 4070 (8GB GDDR6)',
        Storage: '1TB PCIe 4.0 NVMe SSD',
        Display: '14-inch 2.8K OLED, 120Hz, 100% DCI-P3',
        OS: 'Windows 11 Home',
      },
      status: 'Approved',
    });

    // ASUS Azoth Keyboard
    const azoth = await Product.create({
      brand: asusBrand._id,
      name: 'ASUS ROG Azoth Mechanical Keyboard',
      slug: 'asus-rog-azoth-mechanical-keyboard',
      modelNumber: 'ROG-AZOTH-NXRD',
      SKU: 'ASU-AZOTH-NXRED-KB',
      category: accessoriesCat._id,
      description: 'ROG Azoth is a 75% gaming custom keyboard bristling with premium DIY features: gasket mount, pre-lubed ROG NX switches, switch lube kit, and a customizable OLED display.',
      mrp: 22900,
      sellingPrice: 19900,
      gstRate: 18,
      images: [
        { url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=60', alt: 'ROG Azoth Top Down', order: 0 }
      ],
      stock: {
        quantity: 20,
        reservedQuantity: 0,
        reorderThreshold: 4,
      },
      specifications: {
        Layout: '75% Mechanical Keyboard',
        Switches: 'ROG NX Red Linear Switches (Hot-swappable)',
        Display: '2-inch OLED Smart Display with Control Knob',
        Connectivity: 'ROG SpeedNova 2.4GHz RF, Bluetooth, USB Wired',
        Keycaps: 'Double-shot PBT Keycaps',
      },
      status: 'Approved',
    });

    console.log('Seeding Serial Numbers...');
    // Seed serial numbers for each product
    const productsList = [macbook, iphone, s24Ultra, buds2pro, zephyrus, azoth];
    for (let product of productsList) {
      for (let i = 1; i <= 5; i++) {
        await SerialNumber.create({
          serialNumber: `${product.SKU.substring(0, 7).replace('-', '')}SN00${i}`,
          imei1: product.category.equals(smartphonesCat._id) ? `35891110024471${i}` : '',
          imei2: product.category.equals(smartphonesCat._id) ? `35891110024472${i}` : '',
          product: product._id,
          brand: product.brand,
          status: 'Available',
        });
      }
    }

    console.log('Creating Coupons...');
    await Coupon.create({
      code: 'KAIAFIRST',
      type: 'PERCENTAGE',
      value: 10,
      minOrderAmount: 10000,
      maxDiscount: 5000,
      expiryDate: new Date('2027-12-31'),
      isActive: true,
    });

    await Coupon.create({
      code: 'KAIAPOWER',
      type: 'FIXED',
      value: 1500,
      minOrderAmount: 25000,
      expiryDate: new Date('2027-12-31'),
      isActive: true,
    });

    console.log('Database Seeding Completed Successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();
