import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Inventory from '../models/Inventory.js';
import SerialNumber from '../models/SerialNumber.js';
import Coupon from '../models/Coupon.js';
import DeliveryLocation from '../models/DeliveryLocation.js';

dotenv.config({ path: '../.env' }); // Load .env from backend / root
dotenv.config();

const seed = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await connectDB();

    console.log('Clearing existing product catalog collections...');
    await User.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await SerialNumber.deleteMany({});
    await Coupon.deleteMany({});
    await DeliveryLocation.deleteMany({});

    console.log('Creating Admin & Customer accounts...');

    const salt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash('Piyush@1234', salt);
    const customerHashedPassword = await bcrypt.hash('Password@123', salt);

    // Create Original KAIA Admin Account
    const adminUser = await User.create({
      name: 'KAIA Admin Team',
      email: 'piyush.sharma@kenzoinfosystems.com',
      password: 'Piyush@1234',
      role: 'ADMIN',
      phone: '9334683692',
      emailVerified: true,
      status: 'Active',
    });
    console.log(`✓ Admin user created: ${adminUser.email}`);

    // Create Original Customer Account
    const customerUser = await User.create({
      name: 'Piyush Sharma',
      email: 'customer@kaia.tech',
      password: 'Password@123',
      role: 'CUSTOMER',
      phone: '9876543214',
      gstin: '07AAAAA1111A1Z1',
      emailVerified: true,
      status: 'Active',
    });
    console.log(`✓ Customer user created: ${customerUser.email}`);

    // Create Brands & Brand Partner Users
    const brandsConfig = [
      {
        name: 'Samsung',
        slug: 'samsung',
        email: 'samsung@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1583573636246-18cb2246697f?w=1600&auto=format&fit=crop&q=80',
        description: 'Inspire the World, Create the Future. Leading AMOLED mobile, memory, and semiconductor technologies.',
        website: 'https://www.samsung.com/in',
        gstin: '27BBBBB2222B2Z2',
      },
      {
        name: 'ASUS',
        slug: 'asus',
        email: 'asus@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1600&auto=format&fit=crop&q=80',
        description: 'In Search of Incredible. High performance gaming PCs, ROG motherboards, and PC DIY hardware.',
        website: 'https://rog.asus.com/in',
        gstin: '27CCCCC3333C3Z3',
      },
      {
        name: 'Dell',
        slug: 'dell',
        email: 'dell@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1600&auto=format&fit=crop&q=80',
        description: 'The Power to Do More. XPS ultrabooks, Alienware gaming rigs, and enterprise UltraSharp displays.',
        website: 'https://www.dell.com/en-in',
        gstin: '27EEEEE5555E5Z5',
      },
      {
        name: 'HP',
        slug: 'hp',
        email: 'hp@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1600&auto=format&fit=crop&q=80',
        description: 'Keep Reinventing. Spectre x360 laptops, Omen gaming laptops, and commercial workstation PCs.',
        website: 'https://www.hp.com/in-en',
        gstin: '27FFFFF6666F6Z6',
      },
      {
        name: 'Lenovo',
        slug: 'lenovo',
        email: 'lenovo@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&auto=format&fit=crop&q=80',
        description: 'Smarter Technology for All. Legendary ThinkPad durability and Legion competitive gaming notebooks.',
        website: 'https://www.lenovo.com/in/en',
        gstin: '27GGGGG7777G7Z7',
      },
      {
        name: 'LG',
        slug: 'lg',
        email: 'lg@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1600&auto=format&fit=crop&q=80',
        description: "Life's Good. UltraGear OLED gaming monitors, Gram ultra-light laptops, and IPS pro displays.",
        website: 'https://www.lg.com/in',
        gstin: '27HHHHH8888H8Z8',
      },
      {
        name: 'Logitech',
        slug: 'logitech',
        email: 'logitech@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1600&auto=format&fit=crop&q=80',
        description: 'Defy Logic. Master Series MX peripherals, PRO wireless gaming mice, and G-series keyboards.',
        website: 'https://www.logitech.com/en-in',
        gstin: '27IIIII9999I9Z9',
      },
      {
        name: 'Razer',
        slug: 'razer',
        email: 'razer@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80',
        description: 'For Gamers. By Gamers. Premium Blade gaming laptops, Chroma mechanical keyboards, and audio.',
        website: 'https://www.razer.com',
        gstin: '27JJJJJ0000J0Z0',
      },
      {
        name: 'MI',
        slug: 'mi',
        email: 'mi@kaia.tech',
        logo: 'https://unpkg.com/simple-icons@v11/icons/xiaomi.svg',
        banner: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&auto=format&fit=crop&q=80',
        description: 'Innovation for Everyone. Smart mobile technology, ultrabooks, gaming monitors, and connected smart home electronics.',
        website: 'https://www.mi.com/in',
        gstin: '27KKKKK1111K1Z1',
      },
      {
        name: 'OPPO',
        slug: 'oppo',
        email: 'oppo@kaia.tech',
        logo: 'https://unpkg.com/simple-icons@v11/icons/oppo.svg',
        banner: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1600&auto=format&fit=crop&q=80',
        description: 'Inspiration Ahead. Flagship imaging smartphones, VOOC flash charging, smart audio, and wearable technology.',
        website: 'https://www.oppo.com/in',
        gstin: '27LLLLL2222L2Z2',
      },
      {
        name: 'VIVO',
        slug: 'vivo',
        email: 'vivo@kaia.tech',
        logo: 'https://unpkg.com/simple-icons@v11/icons/vivo.svg',
        banner: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1600&auto=format&fit=crop&q=80',
        description: 'Joy of Humanity. High-end Zeiss co-engineered camera smartphones, AMOLED displays, and mobile computing.',
        website: 'https://www.vivo.com/in',
        gstin: '27VVVVV3333V3Z3',
      },
      {
        name: 'ZEBRONICS',
        slug: 'zebronics',
        email: 'zebronics@kaia.tech',
        logo: 'https://unpkg.com/simple-icons@v11/icons/soundcharts.svg',
        banner: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1600&auto=format&fit=crop&q=80',
        description: 'Always Ahead. Premium gaming cabinets, mechanical keyboards, soundbars, high-wattage power supplies, and monitors.',
        website: 'https://zebronics.com',
        gstin: '27ZZZZZ4444Z4Z4',
      },
      {
        name: 'Intel',
        slug: 'intel',
        email: 'intel@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&auto=format&fit=crop&q=80',
        description: 'Do Something Wonderful. Intel Core i9 & Core Ultra processors and enterprise Xeon computing.',
        website: 'https://www.intel.in',
        gstin: '27MMMMM3333M3Z3',
      },
      {
        name: 'AMD',
        slug: 'amd',
        email: 'amd@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1600&auto=format&fit=crop&q=80',
        description: 'Together We Advance. Ryzen 9000 Zen 5 desktop processors and Radeon RX 7900 graphics cards.',
        website: 'https://www.amd.com/en',
        gstin: '27NNNNN4444N4Z4',
      },
      {
        name: 'Canon',
        slug: 'canon',
        email: 'canon@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=1600&auto=format&fit=crop&q=80',
        description: 'Delighting You Always. EOS R full-frame mirrorless cameras, RF cinema lenses, and sensors.',
        website: 'https://in.canon',
        gstin: '27OOOOO5555O5Z5',
      },
      {
        name: 'Xiaomi',
        slug: 'xiaomi',
        email: 'xiaomi@kaia.tech',
        logo: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&auto=format&fit=crop&q=80',
        description: 'Innovation for Everyone. Flagship Leica camera smartphones, smart tablets, and IoT devices.',
        website: 'https://www.mi.com/in',
        gstin: '27PPPPP6666P6Z6',
      },
    ];

    const brandMap = {};
    for (const b of brandsConfig) {
      const brandUser = await User.create({
        name: `${b.name} Authorized Logistics`,
        email: b.email,
        password: 'Password@123',
        role: 'BRAND',
        phone: `987654${Math.floor(1000 + Math.random() * 9000)}`,
        emailVerified: true,
        status: 'Active',
      });

      const brandDoc = await Brand.create({
        owner: brandUser._id,
        name: b.name,
        slug: b.slug,
        logo: b.logo,
        banner: b.banner,
        description: b.description,
        website: b.website,
        contactEmail: b.email,
        contactPhone: '1800100200',
        isApproved: true,
        isActive: true,
        status: 'Approved',
        businessDetails: {
          gstin: b.gstin,
          pan: b.gstin.substring(2, 12),
          address: 'Technology Logistics Park, Electronic City, Bengaluru, KA, 560100',
        },
        bankDetails: {
          accountNumber: `987654321${Math.floor(100 + Math.random() * 900)}`,
          ifsc: 'HDFC0000060',
          bankName: 'HDFC Bank',
        },
      });

      brandMap[b.slug] = brandDoc;
    }

    console.log(`Created ${Object.keys(brandMap).length} Brands.`);

    console.log('Creating Categories and Subcategories hierarchy...');
    const parentCategories = [
      { name: 'Computers', slug: 'computers', desc: 'Laptops, Desktop PCs, and Workstations', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800' },
      { name: 'Mobile Devices', slug: 'mobile-devices', desc: 'Flagship Smartphones, 5G Cellular, and Tablets', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800' },
      { name: 'Audio Systems', slug: 'audio-and-sound', desc: 'Noise-Cancelling Headphones, Wireless Earbuds, and Studio Monitors', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
      { name: 'PC Components', slug: 'pc-components', desc: 'CPUs, Graphics Cards, Motherboards, RAM, and Power', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800' },
      { name: 'Keyboards & Mice', slug: 'keyboards-and-accessories', desc: 'Custom Mechanical Keyboards, Wireless Mice, and Deskpads', image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800' },
      { name: 'Monitors & Displays', slug: 'monitors-and-displays', desc: 'OLED, 4K UHD, Ultrawide, and High Refresh Rate Gaming Panels', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800' },
      { name: 'Cameras & Imaging', slug: 'cameras-and-imaging', desc: 'Full-Frame Mirrorless Cameras, Cinema Lenses, and Drones', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800' },
      { name: 'Smart Devices', slug: 'smart-devices', desc: 'Smartwatches, IoT Hubs, and Connected Home Technology', image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800' },
    ];

    const categoryMap = {};
    for (const pCat of parentCategories) {
      const parentDoc = await Category.create({
        name: pCat.name,
        slug: pCat.slug,
        description: pCat.desc,
        image: pCat.image,
        isActive: true,
        baseCommission: 5.0,
      });
      categoryMap[pCat.slug] = parentDoc;
    }

    const subCategoriesConfig = [
      { name: 'Laptops', slug: 'laptops', parent: 'computers', desc: 'Premium thin-and-light ultrabooks and productivity laptops' },
      { name: 'Gaming Laptops', slug: 'gaming-laptops', parent: 'computers', desc: 'High-TGP RTX graphics laptops with 240Hz+ displays' },
      { name: 'Desktop PCs', slug: 'desktop-pcs', parent: 'computers', desc: 'Prebuilt workstations and performance gaming rigs' },
      { name: 'Smartphones', slug: 'smartphones', parent: 'mobile-devices', desc: 'Flagship 5G smartphones with high-megapixel sensor arrays' },
      { name: 'Tablets', slug: 'tablets', parent: 'mobile-devices', desc: 'Productivity drawing tablets, iPads, and Android slate devices' },
      { name: 'Headphones', slug: 'headphones', parent: 'audio-and-sound', desc: 'Over-ear studio monitors and active noise cancellation headsets' },
      { name: 'Wireless Earbuds', slug: 'earbuds', parent: 'audio-and-sound', desc: 'True wireless stereo earbuds with spatial audio' },
      { name: 'Speakers', slug: 'speakers', parent: 'audio-and-sound', desc: 'Bluetooth portable sound systems and smart desktop monitors' },
      { name: 'Processors', slug: 'processors', parent: 'pc-components', desc: 'Multi-threaded desktop and server microprocessors' },
      { name: 'Graphics Cards', slug: 'graphics-cards', parent: 'pc-components', desc: 'Dedicated gaming and AI acceleration GPUs' },
      { name: 'Motherboards', slug: 'motherboards', parent: 'pc-components', desc: 'ATX and Mini-ITX chipsets with PCIe Gen5 support' },
      { name: 'Memory', slug: 'memory', parent: 'pc-components', desc: 'DDR5 high-frequency overclocked desktop and laptop RAM' },
      { name: 'Storage', slug: 'storage', parent: 'pc-components', desc: 'PCIe 4.0 & 5.0 NVMe M.2 solid-state drives and portable SSDs' },
      { name: 'Gaming Mice', slug: 'gaming-mice', parent: 'keyboards-and-accessories', desc: 'Ultra-lightweight wireless sensors and ergonomic mice' },
      { name: 'Mechanical Keyboards', slug: 'mechanical-keyboards', parent: 'keyboards-and-accessories', desc: 'Custom hot-swappable switches and gasket mount keyboards' },
      { name: 'Gaming Monitors', slug: 'gaming-monitors', parent: 'monitors-and-displays', desc: 'Fast IPS and OLED displays up to 360Hz' },
    ];

    for (const sub of subCategoriesConfig) {
      const parentId = categoryMap[sub.parent]._id;
      const subDoc = await Category.create({
        name: sub.name,
        slug: sub.slug,
        description: sub.desc,
        image: categoryMap[sub.parent].image,
        parentCategory: parentId,
        isActive: true,
        baseCommission: 5.0,
      });
      categoryMap[sub.slug] = subDoc;
    }

    console.log(`Created ${Object.keys(categoryMap).length} Categories & Subcategories.`);

    console.log('Generating 100+ realistic hardware catalog products...');

    const productsSeedData = [
      // 2. Samsung Products
      {
        brand: 'samsung',
        category: 'smartphones',
        name: 'Samsung Galaxy S24 Ultra 5G (12GB RAM, 512GB)',
        slug: 'samsung-galaxy-s24-ultra-512gb',
        modelNumber: 'SM-S928B',
        sku: 'SAM-S24U-512-008',
        mrp: 139900,
        price: 129900,
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800', 'https://images.unsplash.com/photo-1583573636246-18cb2246697f?w=800'],
        desc: 'Welcome to Galaxy AI. Titanium shield exterior, built-in S Pen stylus, and revolutionary 200MP Nightography quad camera.',
        specs: { Processor: 'Snapdragon 8 Gen 3 for Galaxy', RAM: '12GB LPDDR5X', Storage: '512GB UFS 4.0', Display: '6.8" Dynamic AMOLED 2X, QHD+, 120Hz, 2600 nits', Battery: '5000 mAh' },
        stock: 28,
        isFeatured: true,
      },
      {
        brand: 'samsung',
        category: 'smartphones',
        name: 'Samsung Galaxy Z Fold 5 5G (512GB)',
        slug: 'samsung-galaxy-z-fold-5-512gb',
        modelNumber: 'SM-F946B',
        sku: 'SAM-ZFOLD5-512-009',
        mrp: 164900,
        price: 149900,
        images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800'],
        desc: 'Unfold an immersive 7.6-inch screen with Flex Hinge, massive multi-tasking workspace, and PC-like productivity in your pocket.',
        specs: { MainDisplay: '7.6" QXGA+ Dynamic AMOLED 2X 120Hz', CoverDisplay: '6.2" HD+ AMOLED', Processor: 'Snapdragon 8 Gen 2', Storage: '512GB' },
        stock: 12,
      },
      {
        brand: 'samsung',
        category: 'tablets',
        name: 'Samsung Galaxy Tab S9 Ultra (12GB RAM, 256GB, Wi-Fi)',
        slug: 'samsung-galaxy-tab-s9-ultra-256gb',
        modelNumber: 'SM-X910',
        sku: 'SAM-TABS9U-256-010',
        mrp: 108900,
        price: 99900,
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'],
        desc: 'Gigantic 14.6-inch Dynamic AMOLED 2X canvas with included low-latency S Pen, IP68 water resistance, and quad AKG speakers.',
        specs: { Display: '14.6" Dynamic AMOLED 2X (2960x1848), 120Hz', Processor: 'Snapdragon 8 Gen 2', RAM: '12GB', Battery: '11200 mAh' },
        stock: 15,
      },
      {
        brand: 'samsung',
        category: 'gaming-monitors',
        name: 'Samsung Odyssey OLED G9 49" Curved Gaming Monitor',
        slug: 'samsung-odyssey-oled-g9-49-curved',
        modelNumber: 'LS49CG954SWXXL',
        sku: 'SAM-ODYSSEY-G9-011',
        mrp: 199900,
        price: 169900,
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'],
        desc: 'Dual QHD 49-inch 32:9 curved OLED display with 240Hz refresh rate, 0.03ms response time, and Neo Quantum Processor Pro.',
        specs: { ScreenSize: '49-inch Curved (1800R)', Resolution: 'Dual QHD (5120 x 1440)', RefreshRate: '240Hz', ResponseTime: '0.03ms (GtG)', Panel: 'QD-OLED' },
        stock: 8,
        isFeatured: true,
      },
      {
        brand: 'samsung',
        category: 'storage',
        name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 SSD with Heatsink',
        slug: 'samsung-990-pro-2tb-nvme-heatsink',
        modelNumber: 'MZ-V9P2T0CW',
        sku: 'SAM-990PRO-2TB-012',
        mrp: 24999,
        price: 19499,
        images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800'],
        desc: 'Ultimate PCIe 4.0 speed up to 7450 MB/s read with integrated heatsink for PlayStation 5 and high-end PC gaming builds.',
        specs: { Interface: 'PCIe Gen 4.0 x4, NVMe 2.0', SequentialRead: 'Up to 7,450 MB/s', SequentialWrite: 'Up to 6,900 MB/s', Capacity: '2TB', FormFactor: 'M.2 2280' },
        stock: 50,
        isBestSeller: true,
      },
      {
        brand: 'samsung',
        category: 'earbuds',
        name: 'Samsung Galaxy Buds2 Pro (Graphite, 24-bit Hi-Fi)',
        slug: 'samsung-galaxy-buds2-pro-graphite',
        modelNumber: 'SM-R510N',
        sku: 'SAM-BUDS2P-GRP-013',
        mrp: 19990,
        price: 14990,
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'],
        desc: 'Seamless 24-bit Hi-Fi audio streaming with 3 high-SNR microphones for intelligent Active Noise Cancellation.',
        specs: { Connectivity: 'Bluetooth 5.3', ANC: 'Intelligent ANC with voice detect', Battery: 'Up to 29 hours total', AudioCodec: 'SSC (Samsung Seamless Codec)' },
        stock: 45,
      },

      // 3. ASUS Products
      {
        brand: 'asus',
        category: 'gaming-laptops',
        name: 'ASUS ROG Zephyrus G16 (2024) OLED (Intel Core Ultra 9, RTX 4080)',
        slug: 'asus-rog-zephyrus-g16-2024-rtx4080',
        modelNumber: 'GU605MZ',
        sku: 'ASU-ZEPH-G16-4080-014',
        mrp: 299900,
        price: 279900,
        images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800'],
        desc: 'Unibody CNC-milled aluminum chassis with Slash Lighting, 2.5K ROG Nebula OLED 240Hz screen, and NVIDIA GeForce RTX 4080.',
        specs: { Processor: 'Intel Core Ultra 9 185H (16 Cores, 22 Threads)', GPU: 'NVIDIA GeForce RTX 4080 12GB (115W TGP)', RAM: '32GB LPDDR5X 7467MHz', Storage: '2TB PCIe 4.0 SSD', Display: '16" 2.5K (2560x1600) OLED 240Hz 0.2ms' },
        stock: 10,
        isFeatured: true,
      },
      {
        brand: 'asus',
        category: 'gaming-laptops',
        name: 'ASUS ROG Strix SCAR 18 (i9-14900HX, RTX 4090, 64GB)',
        slug: 'asus-rog-strix-scar-18-rtx4090',
        modelNumber: 'G834JYR',
        sku: 'ASU-SCAR18-4090-015',
        mrp: 389900,
        price: 359900,
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800'],
        desc: 'Top-of-the-line desktop replacement. Mini LED 2.5K 240Hz Nebula HDR display powered by Intel 14th Gen i9 and RTX 4090 (175W).',
        specs: { Processor: 'Intel Core i9-14900HX (24 Cores, 32 Threads)', GPU: 'NVIDIA GeForce RTX 4090 16GB GDDR6 (175W)', RAM: '64GB DDR5 5600MHz', Storage: '4TB (2TB + 2TB RAID 0) PCIe 4.0 SSD', Display: '18" QHD+ Mini LED 240Hz' },
        stock: 6,
      },
      {
        brand: 'asus',
        category: 'motherboards',
        name: 'ASUS ROG Maximus Z790 Dark Hero Motherboard',
        slug: 'asus-rog-maximus-z790-dark-hero',
        modelNumber: 'ROG-MAX-Z790-DH',
        sku: 'ASU-MB-Z790DH-016',
        mrp: 69900,
        price: 59900,
        images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800'],
        desc: 'Intel LGA 1700 flagship motherboard with 20+1+2 power stages, DDR5 memory support, PCIe 5.0 NVMe slot, and Wi-Fi 7 onboard.',
        specs: { Chipset: 'Intel Z790', Socket: 'LGA 1700', VRM: '20+1+2 Teamed Power Stages (90A)', Networking: 'Wi-Fi 7 + Intel 2.5Gb Ethernet', PCIe: 'PCIe 5.0 x16 + PCIe 5.0 M.2' },
        stock: 20,
      },
      {
        brand: 'asus',
        category: 'mechanical-keyboards',
        name: 'ASUS ROG Azoth 75% Custom Wireless Mechanical Keyboard',
        slug: 'asus-rog-azoth-75-wireless-keyboard',
        modelNumber: 'ROG-AZOTH-NXRD',
        sku: 'ASU-AZOTH-NXRD-017',
        mrp: 22900,
        price: 19900,
        images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800'],
        desc: 'Gasket-mounted DIY keyboard with silicone dampeners, hot-swappable pre-lubed ROG NX switches, and interactive OLED status screen.',
        specs: { Layout: '75% Custom DIY', Switches: 'ROG NX Red Linear Switches (Pre-lubed)', Display: '2-inch OLED Smart Display with 3-way knob', Connectivity: 'ROG SpeedNova 2.4GHz RF, Bluetooth, Wired' },
        stock: 30,
        isBestSeller: true,
      },
      {
        brand: 'asus',
        category: 'gaming-mice',
        name: 'ASUS ROG Harpe Ace Aim Lab Edition Ultralight Mouse',
        slug: 'asus-rog-harpe-ace-aim-lab',
        modelNumber: 'ROG-HARPE-ACE',
        sku: 'ASU-HARPE-ACE-018',
        mrp: 13990,
        price: 11490,
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800'],
        desc: 'Co-developed with esport professionals. 54-gram lightweight ambidextrous wireless mouse with 36,000 DPI AimPoint optical sensor.',
        specs: { Weight: '54 grams', Sensor: 'ROG AimPoint 36,000 DPI', MaxSpeed: '650 IPS', Battery: 'Up to 90 hours' },
        stock: 40,
      },

      // 3. Dell Products
      {
        brand: 'dell',
        category: 'laptops',
        name: 'Dell XPS 16 (9640) (Intel Core Ultra 7, 32GB RAM, 1TB SSD, RTX 4060)',
        slug: 'dell-xps-16-9640-intel-ultra7-rtx4060',
        modelNumber: 'XPS9640-U7',
        sku: 'DEL-XPS16-4060-023',
        mrp: 289900,
        price: 264900,
        images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800'],
        desc: 'Crafted with machined aluminum and graphite glass. Touch function row, seamless glass haptic trackpad, and 4K OLED display.',
        specs: { Processor: 'Intel Core Ultra 7 155H (16 Cores, 22 Threads)', GPU: 'NVIDIA GeForce RTX 4060 8GB GDDR6', RAM: '32GB LPDDR5X 7467MHz', Storage: '1TB PCIe 4.0 SSD', Display: '16.3" 4K+ (3840x2400) OLED Touch 90Hz' },
        stock: 15,
        isFeatured: true,
      },
      {
        brand: 'dell',
        category: 'gaming-laptops',
        name: 'Dell Alienware m16 R2 Gaming Laptop (Intel Core Ultra 9, RTX 4070)',
        slug: 'dell-alienware-m16-r2-rtx4070',
        modelNumber: 'AW-M16R2-U9',
        sku: 'DEL-ALW-M16-4070-024',
        mrp: 219900,
        price: 199900,
        images: ['https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800'],
        desc: 'Cryo-tech cooling with stealth mode switch, 240Hz QHD+ display, and CherryMX ultra-low profile mechanical keyboard options.',
        specs: { Processor: 'Intel Core Ultra 9 185H', GPU: 'NVIDIA GeForce RTX 4070 8GB (140W)', RAM: '32GB DDR5 5600MHz', Storage: '1TB NVMe SSD', Display: '16" QHD+ (2560x1600) 240Hz 3ms' },
        stock: 14,
      },
      {
        brand: 'dell',
        category: 'monitors-and-displays',
        name: 'Dell UltraSharp 32 4K USB-C Hub Monitor (U3223QE)',
        slug: 'dell-ultrasharp-32-4k-u3223qe',
        modelNumber: 'U3223QE',
        sku: 'DEL-U3223QE-025',
        mrp: 84900,
        price: 74900,
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'],
        desc: 'World first IPS Black technology 4K monitor with 2000:1 contrast ratio, 90W USB-C power delivery, and built-in KVM switch.',
        specs: { Panel: '31.5" IPS Black 4K UHD (3840x2160)', ContrastRatio: '2000:1', ColorGamut: '100% sRGB, 98% DCI-P3', Hub: 'RJ45 Ethernet, 90W USB-C PD, 4x USB-A' },
        stock: 22,
        isBestSeller: true,
      },

      // 6. HP Products
      {
        brand: 'hp',
        category: 'laptops',
        name: 'HP Spectre x360 2-in-1 14" (Intel Core Ultra 7, 16GB, 1TB SSD)',
        slug: 'hp-spectre-x360-14-2in1-ultra7',
        modelNumber: '14-eu0000TU',
        sku: 'HP-SPEC14-U7-026',
        mrp: 174900,
        price: 159900,
        images: ['https://images.unsplash.com/photo-1544717305-2782549b5136?w=800'],
        desc: 'Gem-cut 360-degree convertible laptop with 2.8K OLED variable refresh touch panel and 9MP AI camera with hardware privacy.',
        specs: { Processor: 'Intel Core Ultra 7 155H', Display: '14" 2.8K (2880x1800) OLED 120Hz Touch', RAM: '16GB LPDDR5X', Storage: '1TB PCIe 4.0 SSD', Battery: 'Up to 17 hours' },
        stock: 18,
      },
      {
        brand: 'hp',
        category: 'gaming-laptops',
        name: 'HP OMEN Transcend 14 (Intel Core Ultra 9, RTX 4070, 32GB RAM)',
        slug: 'hp-omen-transcend-14-rtx4070',
        modelNumber: '14-fb0000TX',
        sku: 'HP-OMEN14-4070-027',
        mrp: 209900,
        price: 189900,
        images: ['https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=800'],
        desc: 'The worlds lightest 14-inch gaming laptop at 1.63 kg with 2.8K 120Hz OLED screen and HyperX wireless audio transmitter built-in.',
        specs: { Processor: 'Intel Core Ultra 9 185H', GPU: 'NVIDIA GeForce RTX 4070 8GB GDDR6', RAM: '32GB LPDDR5X 7467MHz', Storage: '1TB PCIe 4.0 SSD', Weight: '1.63 kg' },
        stock: 12,
        isNewArrival: true,
      },

      // 7. Lenovo Products
      {
        brand: 'lenovo',
        category: 'laptops',
        name: 'Lenovo ThinkPad X1 Carbon Gen 12 (Intel Core Ultra 7, 32GB, 1TB)',
        slug: 'lenovo-thinkpad-x1-carbon-gen-12',
        modelNumber: '21KC0000IG',
        sku: 'LEN-X1CARB-G12-028',
        mrp: 249900,
        price: 229900,
        images: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800'],
        desc: 'Carbon fiber reinforced enterprise chassis, legendary ThinkPad TrackPoint ergonomics, and military-spec MIL-STD 810H durability.',
        specs: { Processor: 'Intel Core Ultra 7 155H', RAM: '32GB LPDDR5X 6400MHz', Storage: '1TB PCIe 4.0 NVMe Opal2 SSD', Display: '14" 2.8K (2880x1800) OLED 120Hz', Weight: '1.09 kg' },
        stock: 20,
        isFeatured: true,
      },
      {
        brand: 'lenovo',
        category: 'gaming-laptops',
        name: 'Lenovo Legion Pro 7i Gen 9 (Intel i9-14900HX, RTX 4080, 32GB)',
        slug: 'lenovo-legion-pro-7i-gen-9-rtx4080',
        modelNumber: '16IRX9H',
        sku: 'LEN-LEG7I-4080-029',
        mrp: 299900,
        price: 269900,
        images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800'],
        desc: 'Lenovo Legion Coldfront Vapor chamber cooling with Legion AI Engine+ LA-2Q chip for automatic hardware optimization.',
        specs: { Processor: 'Intel Core i9-14900HX (24C/32T)', GPU: 'NVIDIA GeForce RTX 4080 12GB (175W TGP)', RAM: '32GB DDR5 5600MHz', Display: '16" WQXGA (2560x1600) IPS 240Hz 500nits' },
        stock: 14,
      },

      // 8. LG Products
      {
        brand: 'lg',
        category: 'gaming-monitors',
        name: 'LG UltraGear 27" QHD OLED 240Hz 0.03ms Gaming Monitor',
        slug: 'lg-ultragear-27-oled-240hz',
        modelNumber: '27GR95QE-B',
        sku: 'LG-27OLED-240-030',
        mrp: 89900,
        price: 69900,
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'],
        desc: 'Ultra-fast QHD OLED gaming display with 240Hz refresh rate, 0.03ms response time, HDMI 2.1, and 98.5% DCI-P3 color spectrum.',
        specs: { Panel: '27-inch OLED QHD (2560x1440)', RefreshRate: '240Hz', ResponseTime: '0.03ms (GtG)', HDR: 'HDR10', Sync: 'NVIDIA G-SYNC Compatible & AMD FreeSync Premium' },
        stock: 25,
        isBestSeller: true,
      },
      {
        brand: 'lg',
        category: 'laptops',
        name: 'LG Gram 17" SuperSlim (Intel Core Ultra 7, 32GB RAM, 1TB SSD)',
        slug: 'lg-gram-17-superslim-ultra7',
        modelNumber: '17Z90S-G',
        sku: 'LG-GRAM17-U7-031',
        mrp: 179900,
        price: 154900,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'],
        desc: 'Giant 17-inch IPS display packed inside an ultralight 1.35 kg magnesium alloy body with military durability certification.',
        specs: { Processor: 'Intel Core Ultra 7 155H', Display: '17.0" WQXGA (2560x1600) IPS Anti-glare', RAM: '32GB LPDDR5X', Storage: '1TB NVMe SSD', Weight: '1.35 kg' },
        stock: 16,
      },

      // 9. Logitech Products
      {
        brand: 'logitech',
        category: 'gaming-mice',
        name: 'Logitech G PRO X SUPERLIGHT 2 Wireless Gaming Mouse',
        slug: 'logitech-g-pro-x-superlight-2-black',
        modelNumber: '910-006675',
        sku: 'LOG-GPX2-BLK-032',
        mrp: 16995,
        price: 13995,
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800'],
        desc: '60g precision esports icon with LIGHTFORCE hybrid optical-mechanical switches, HERO 2 sensor, and 2000Hz polling rate.',
        specs: { Weight: '60 grams', Sensor: 'HERO 2 (32,000 DPI)', PollingRate: 'Up to 2000Hz LIGHTSPEED wireless', Battery: 'Up to 95 hours constant motion' },
        stock: 50,
        isBestSeller: true,
      },
      {
        brand: 'logitech',
        category: 'mechanical-keyboards',
        name: 'Logitech MX Mechanical Wireless Illuminated Keyboard',
        slug: 'logitech-mx-mechanical-wireless-keyboard',
        modelNumber: '920-010547',
        sku: 'LOG-MXMECH-TACT-033',
        mrp: 19995,
        price: 16995,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'],
        desc: 'Low-profile mechanical switches with smart backlighting that illuminates as hands approach, multi-OS Easy-Switch across 3 devices.',
        specs: { Switches: 'Tactile Quiet Mechanical Switches', Connectivity: 'Logi Bolt USB receiver & Bluetooth Low Energy', Battery: 'Up to 15 days (10 months with backlighting off)' },
        stock: 35,
      },
      {
        brand: 'logitech',
        category: 'gaming-mice',
        name: 'Logitech MX Master 3S Wireless Performance Mouse',
        slug: 'logitech-mx-master-3s-graphite',
        modelNumber: '910-006559',
        sku: 'LOG-MXM3S-GRP-034',
        mrp: 12995,
        price: 9995,
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800'],
        desc: 'Quiet Clicks technology, MagSpeed electromagnetic scroll wheel scrolling 1,000 lines per second, and 8K DPI glass-tracking sensor.',
        specs: { Sensor: 'Darkfield 8000 DPI (Tracks on glass)', Scrolling: 'MagSpeed SmartShift Wheel', Battery: 'Up to 70 days on full charge' },
        stock: 65,
        isBestSeller: true,
      },

      // 10. Razer Products
      {
        brand: 'razer',
        category: 'gaming-laptops',
        name: 'Razer Blade 16 (2024) (Intel Core i9-14900HX, RTX 4090, Dual-Mode Mini-LED)',
        slug: 'razer-blade-16-2024-rtx4090',
        modelNumber: 'RZ09-0510',
        sku: 'RZR-BLADE16-4090-035',
        mrp: 449900,
        price: 419900,
        images: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'],
        desc: 'Worlds first dual-mode Mini-LED display switching between 4K 120Hz for creators and FHD+ 240Hz for competitive gaming.',
        specs: { Processor: 'Intel Core i9-14900HX', GPU: 'NVIDIA GeForce RTX 4090 16GB (175W TGP)', Display: '16" Dual-Mode Mini-LED (4K 120Hz / FHD+ 240Hz)', Chassis: 'T6 CNC Aluminum Anodized Black' },
        stock: 5,
        isFeatured: true,
      },
      {
        brand: 'razer',
        category: 'mechanical-keyboards',
        name: 'Razer Huntsman V3 Pro Analog Gaming Keyboard',
        slug: 'razer-huntsman-v3-pro-analog',
        modelNumber: 'RZ03-0498',
        sku: 'RZR-HUNTSV3-PRO-036',
        mrp: 24999,
        price: 21999,
        images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800'],
        desc: 'Gen-2 Analog Optical Switches with Rapid Trigger mode (0.1mm - 4.0mm adjustable actuation) and multi-function digital dial.',
        specs: { Switches: 'Razer Gen-2 Analog Optical Switches', RapidTrigger: '0.1 to 4.0 mm sensitivity adjustable', Keycaps: 'Textured Double-shot PBT', WristRest: 'Magnetic firm leatherette' },
        stock: 25,
      },
      {
        brand: 'razer',
        category: 'gaming-mice',
        name: 'Razer Viper V3 Pro Wireless Esports Mouse',
        slug: 'razer-viper-v3-pro-wireless',
        modelNumber: 'RZ01-0512',
        sku: 'RZR-VIPERV3-PRO-037',
        mrp: 17999,
        price: 15499,
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800'],
        desc: '54g ultra-lightweight symmetrical esports mouse with true 8000Hz HyperPolling wireless technology and Focus Pro 35K optical sensor.',
        specs: { Weight: '54 grams', Sensor: 'Focus Pro 35K Optical Sensor Gen-2', PollingRate: 'True 8000 Hz Wireless', Battery: 'Up to 95 hours at 1000Hz' },
        stock: 30,
        isNewArrival: true,
      },

      // 11. MI Products
      {
        brand: 'mi',
        category: 'monitors-and-displays',
        name: 'Xiaomi Mi Curved Gaming Monitor 34" 144Hz WQHD FreeSync Premium',
        slug: 'xiaomi-mi-curved-gaming-monitor-34',
        modelNumber: 'XMI-CURV-34-144',
        sku: 'MI-MON34-CURV-038',
        mrp: 37999,
        price: 29999,
        images: ['/assets/categories/3d/monitor_3d.jpg'],
        desc: 'Panoramic immersive 21:9 ultrawide 1500R curvature display with 144Hz refresh rate, 121% sRGB color gamut, and AMD FreeSync Premium.',
        specs: { ScreenSize: '34 Inch Ultrawide (21:9)', Resolution: '3440 x 1440 WQHD', RefreshRate: '144Hz', PanelType: 'VA 1500R Curved' },
        stock: 25,
        isBestSeller: true,
      },
      {
        brand: 'mi',
        category: 'smartphones',
        name: 'Xiaomi 14 Ultra 5G (16GB RAM, 512GB Storage, Leica Quad Camera)',
        slug: 'xiaomi-14-ultra-5g-flagship',
        modelNumber: 'MI14ULTRA-512',
        sku: 'MI-14U-512GB-039',
        mrp: 119999,
        price: 99999,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'],
        desc: 'Pinnacle mobile optics featuring 1-inch LYT-900 sensor with stepless variable aperture and Leica quad 50MP camera array.',
        specs: { Processor: 'Snapdragon 8 Gen 3', Display: '6.73" WQHD+ 120Hz LTPO AMOLED', MainCamera: '50MP 1-inch Quad Array', Charging: '90W HyperCharge + 80W Wireless' },
        stock: 18,
        isFeatured: true,
      },

      // 12. OPPO Products
      {
        brand: 'oppo',
        category: 'smartphones',
        name: 'OPPO Find X7 Ultra 5G (16GB RAM, 512GB, Dual Periscope Telephoto)',
        slug: 'oppo-find-x7-ultra-flagship',
        modelNumber: 'CPH2599',
        sku: 'OPP-X7U-512GB-040',
        mrp: 99999,
        price: 84999,
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'],
        desc: 'World first quad-main camera system with dual periscope lenses and Hasselblad portrait engine co-developed optics.',
        specs: { Processor: 'Snapdragon 8 Gen 3', Display: '6.82" QHD+ ProXDR 120Hz', Camera: 'Quad 50MP Hasselblad Dual Periscope', Battery: '5000mAh 100W SUPERVOOC' },
        stock: 20,
        isFeatured: true,
      },

      // 13. VIVO Products
      {
        brand: 'vivo',
        category: 'smartphones',
        name: 'VIVO X100 Pro 5G (16GB RAM, 512GB, ZEISS APO Telephoto Camera)',
        slug: 'vivo-x100-pro-5g-zeiss',
        modelNumber: 'V2324A',
        sku: 'VIV-X100P-512GB-041',
        mrp: 96999,
        price: 79999,
        images: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800'],
        desc: 'Flagship imaging smartphone co-engineered with ZEISS featuring 1-inch main sensor and custom V3 imaging chip.',
        specs: { Processor: 'MediaTek Dimensity 9300', Display: '6.78" 1.5K 120Hz LTPO AMOLED', Optics: 'ZEISS Multifocal Portrait 50MP Trio', Battery: '5400mAh 100W Dual-Cell' },
        stock: 22,
        isNewArrival: true,
      },

      // 14. ZEBRONICS Products
      {
        brand: 'zebronics',
        category: 'keyboards-and-accessories',
        name: 'Zebronics Zeb-Transformer Gaming Keyboard and Mouse Combo with Multicolored LED',
        slug: 'zebronics-zeb-transformer-gaming-combo',
        modelNumber: 'ZEB-TRANSFORMER',
        sku: 'ZEB-TRNS-COMBO-042',
        mrp: 2999,
        price: 1499,
        images: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'],
        desc: 'High durability aluminum body mechanical-feel keyboard with integrated laser-engraved keycaps, braided cable, and 3200 DPI optical gaming mouse.',
        specs: { Build: 'Aluminum Body Panel', Lighting: 'Multicolored LED Modes', MouseDPI: '3200 DPI 4-Level', Cable: '1.8m Braided Heavy Duty' },
        stock: 50,
        isBestSeller: true,
      },
      {
        brand: 'zebronics',
        category: 'audio',
        name: 'Zebronics Juke Bar 9800 Pro Dolby Atmos Wireless Subwoofer Soundbar (450W)',
        slug: 'zebronics-juke-bar-9800-pro-dolby-atmos',
        modelNumber: 'ZEB-JUKE9800PRO',
        sku: 'ZEB-JUKE-9800-043',
        mrp: 24999,
        price: 16999,
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'],
        desc: 'Cinematic 450W Dolby Atmos soundbar with 16.51cm wireless subwoofer and dual rear wireless satellites.',
        specs: { OutputPower: '450W RMS', AudioFormat: 'Dolby Atmos / TrueHD', Subwoofer: '16.5cm Wireless Subwoofer', Connectivity: 'HDMI eARC, Optical, BT 5.0, AUX' },
        stock: 30,
      },

      // 13. Intel Products
      {
        brand: 'intel',
        category: 'processors',
        name: 'Intel Core i9-14900K Desktop Processor (24 Cores up to 6.0 GHz)',
        slug: 'intel-core-i9-14900k-desktop-processor',
        modelNumber: 'BX8071514900K',
        sku: 'INT-I9-14900K-042',
        mrp: 64900,
        price: 54900,
        images: ['https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800'],
        desc: '24 cores (8 Performance cores + 16 Efficient cores) reaching blazing speeds of up to 6.0 GHz with Intel Thermal Velocity Boost.',
        specs: { CoresThreads: '24 Cores (8P + 16E), 32 Threads', MaxTurboFrequency: '6.00 GHz', Cache: '36MB Intel Smart Cache', Socket: 'LGA 1700', TDP: '125W Base, 253W Max Turbo' },
        stock: 45,
        isBestSeller: true,
      },
      {
        brand: 'intel',
        category: 'processors',
        name: 'Intel Core i7-14700K Desktop Processor (20 Cores up to 5.6 GHz)',
        slug: 'intel-core-i7-14700k-desktop-processor',
        modelNumber: 'BX8071514700K',
        sku: 'INT-I7-14700K-043',
        mrp: 47900,
        price: 39900,
        images: ['https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800'],
        desc: '20 cores (8P + 12E) and 28 threads. Exceptional multi-threaded productivity and fluid high-frame-rate gaming performance.',
        specs: { CoresThreads: '20 Cores (8P + 12E), 28 Threads', MaxTurboFrequency: '5.60 GHz', Cache: '33MB Intel Smart Cache', Socket: 'LGA 1700' },
        stock: 50,
      },

      // 14. AMD Products
      {
        brand: 'amd',
        category: 'processors',
        name: 'AMD Ryzen 9 7950X3D 16-Core Processor with 3D V-Cache',
        slug: 'amd-ryzen-9-7950x3d-processor',
        modelNumber: '100-100000908WOF',
        sku: 'AMD-R9-7950X3D-044',
        mrp: 69900,
        price: 57900,
        images: ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800'],
        desc: 'The ultimate gaming and creator processor with 144MB total cache, 16 Zen 4 cores, and AMD 3D V-Cache stacked silicon technology.',
        specs: { CoresThreads: '16 Cores, 32 Threads', BaseBoostClock: '4.2 GHz / 5.7 GHz', TotalCache: '144MB (L2+L3)', Socket: 'AM5', TDP: '120W' },
        stock: 35,
        isFeatured: true,
      },
      {
        brand: 'amd',
        category: 'graphics-cards',
        name: 'AMD Radeon RX 7900 XTX 24GB GDDR6 Graphics Card',
        slug: 'amd-radeon-rx-7900-xtx-24gb',
        modelNumber: 'RX7900XTX-24G',
        sku: 'AMD-RX7900XTX-045',
        mrp: 119900,
        price: 99900,
        images: ['https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800'],
        desc: 'Groundbreaking AMD RDNA 3 chiplet architecture with 24GB GDDR6, DisplayPort 2.1 support, and second-generation raytracing accelerators.',
        specs: { Architecture: 'AMD RDNA 3', VRAM: '24GB GDDR6 384-bit', StreamProcessors: '6144', GameClock: '2300 MHz / Boost 2500 MHz', DisplayOutputs: 'DisplayPort 2.1 + HDMI 2.1' },
        stock: 18,
      },

      // 15. Canon Products
      {
        brand: 'canon',
        category: 'cameras-and-imaging',
        name: 'Canon EOS R5 Mark II Mirrorless Camera with 24-105mm f/4L IS USM Kit',
        slug: 'canon-eos-r5-mark-ii-24-105-kit',
        modelNumber: 'EOS-R5M2-KIT',
        sku: 'CAN-EOSR5M2-KIT-046',
        mrp: 459990,
        price: 429900,
        images: ['https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800'],
        desc: '45MP full-frame back-illuminated stacked sensor, 8K 60p RAW recording, Accelerated Capture system, and Eye Control AF.',
        specs: { Sensor: '45.0 MP Full-Frame Back-Illuminated Stacked CMOS', Video: '8K 60p RAW, 4K 120p', AF: 'Dual Pixel Intelligent AF with Eye Control', ImageStabilizer: 'Up to 8.5 stops Coordinated IS' },
        stock: 6,
        isFeatured: true,
      },

      // 16. Xiaomi Products
      {
        brand: 'xiaomi',
        category: 'smartphones',
        name: 'Xiaomi 14 Ultra 5G (16GB RAM, 512GB, Leica Quad Camera)',
        slug: 'xiaomi-14-ultra-512gb-leica',
        modelNumber: '24030PN60G',
        sku: 'XIA-MI14U-512-047',
        mrp: 109999,
        price: 99999,
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'],
        desc: 'Leica Summilux optical lenses with 1-inch LYT-900 sensor and stepless variable aperture (f/1.63 - f/4.0) with Snapdragon 8 Gen 3.',
        specs: { Processor: 'Snapdragon 8 Gen 3', RAM: '16GB LPDDR5X', Storage: '512GB UFS 4.0', MainSensor: '50MP 1-inch LYT-900 Variable Aperture', Display: '6.73" WQHD+ AMOLED 120Hz LTPO' },
        stock: 25,
        isNewArrival: true,
      },
    ];

    console.log(`Inserting ${productsSeedData.length} Authentic Hardware Products into MongoDB...`);

    let productCount = 0;
    let inventoryCount = 0;
    let serialCount = 0;

    for (const p of productsSeedData) {
      const brandDoc = brandMap[p.brand];
      const catDoc = categoryMap[p.category] || categoryMap['computers'];

      const productDoc = await Product.create({
        brand: brandDoc._id,
        category: catDoc._id,
        name: p.name,
        slug: p.slug,
        modelNumber: p.modelNumber,
        SKU: p.sku,
        description: p.desc,
        shortDescription: p.desc.substring(0, 120) + '...',
        mrp: p.mrp,
        sellingPrice: p.price,
        gstRate: 18.0,
        images: p.images.map((url, idx) => ({ url, alt: `${p.name} view ${idx + 1}`, isPrimary: idx === 0, order: idx })),
        stock: {
          quantity: p.stock || 20,
          reservedQuantity: 0,
          availableQuantity: p.stock || 20,
          reorderThreshold: 4,
        },
        specifications: p.specs || {},
        highlights: Object.entries(p.specs || {}).slice(0, 4).map(([k, v]) => `${k}: ${v}`),
        warranty: '1 Year Brand Manufacturer Warranty with GST Invoicing',
        isFeatured: !!p.isFeatured,
        isNewArrival: !!p.isNewArrival,
        isBestSeller: !!p.isBestSeller,
        isActive: true,
        status: 'Approved',
        ratings: {
          average: Number((4.2 + (Math.random() * 0.7)).toFixed(1)),
          count: 10 + Math.floor(Math.random() * 80),
        },
      });

      productCount++;

      // Create matching Inventory document
      await Inventory.create({
        product: productDoc._id,
        brand: brandDoc._id,
        sku: productDoc.SKU,
        quantity: productDoc.stock.quantity,
        reservedQuantity: 0,
        availableQuantity: productDoc.stock.quantity,
        lowStockThreshold: 4,
        warehouse: {
          name: `${brandDoc.name} Fulfillment Hub`,
          location: 'Bengaluru / NCR Central Logistics',
          bin: `BAY-${(productCount % 20) + 1}-0${(productCount % 5) + 1}`,
        },
      });
      inventoryCount++;

      // Create 3-5 individual Serial Number tracking units per product
      const serialsToCreate = Math.min(5, productDoc.stock.quantity);
      for (let s = 1; s <= serialsToCreate; s++) {
        await SerialNumber.create({
          serialNumber: `${productDoc.SKU.replace(/-/g, '')}SN${String(s).padStart(4, '0')}`,
          imei1: p.category === 'smartphones' ? `358911100${String(productCount).padStart(3, '0')}71${s}` : '',
          imei2: p.category === 'smartphones' ? `358911100${String(productCount).padStart(3, '0')}72${s}` : '',
          product: productDoc._id,
          brand: brandDoc._id,
          status: 'Available',
          warrantyStart: null,
          warrantyEnd: null,
        });
        serialCount++;
      }
    }

    console.log('Creating Promotional Coupons...');
    await Coupon.create({
      code: 'KAIAFIRST',
      type: 'PERCENTAGE',
      value: 10,
      minOrderAmount: 10000,
      maxDiscount: 5000,
      expiryDate: new Date('2028-12-31'),
      isActive: true,
    });

    await Coupon.create({
      code: 'KAIAPOWER',
      type: 'FIXED',
      value: 1500,
      minOrderAmount: 25000,
      maxDiscount: 1500,
      expiryDate: new Date('2028-12-31'),
      isActive: true,
    });

    console.log('====================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`Brands Created:         ${Object.keys(brandMap).length}`);
    console.log(`Categories Created:     ${Object.keys(categoryMap).length}`);
    console.log(`Products Created:       ${productCount}`);
    console.log(`Inventory Rows Created: ${inventoryCount}`);
    console.log(`Serial Numbers Created: ${serialCount}`);
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seed();
