import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';

const ATLAS_URI = 'mongodb+srv://piyushsharma_db_user:9B4OgEWACnirmgjI@cluster0.rrinoas.mongodb.net/kaia-tech?retryWrites=true&w=majority';

const INITIAL_CATEGORIES = [
  { name: 'Computers', slug: 'computers', description: 'Laptops, Desktops, and Workstations' },
  { name: 'Laptops', slug: 'laptops', description: 'Premium ultra-thin and performance laptops' },
  { name: 'Gaming Laptops', slug: 'gaming-laptops', description: 'High-TGP RTX graphics gaming machines' },
  { name: 'Desktop PCs', slug: 'desktop-pcs', description: 'Prebuilt workstations and gaming rigs' },
  { name: 'Mobile Devices', slug: 'mobile-devices', description: 'Flagship smartphones, 5G cellular, and tablets' },
  { name: 'Smartphones', slug: 'smartphones', description: 'Flagship 5G smartphones with high-megapixel cameras' },
  { name: 'Tablets', slug: 'tablets', description: 'Productivity drawing tablets, iPads, and Android slates' },
  { name: 'Audio Systems', slug: 'audio-and-sound', description: 'Noise cancelling headphones, wireless earbuds, and studio monitors' },
  { name: 'Headphones', slug: 'headphones', description: 'Over-ear studio monitors and active noise cancellation headsets' },
  { name: 'Wireless Earbuds', slug: 'wireless-earbuds', description: 'True wireless stereo earbuds with spatial audio' },
  { name: 'Speakers', slug: 'speakers', description: 'Bluetooth portable sound systems and smart desktop monitors' },
  { name: 'PC Components', slug: 'pc-components', description: 'CPUs, Graphics Cards, Motherboards, RAM, and Power Supplies' },
  { name: 'Processors', slug: 'processors', description: 'Multi-threaded desktop and server microprocessors' },
  { name: 'Graphics Cards', slug: 'graphics-cards', description: 'Dedicated gaming and AI acceleration GPUs' },
  { name: 'Motherboards', slug: 'motherboards', description: 'High-end chipset motherboards with PCIe 5.0' },
  { name: 'RAM & Memory', slug: 'ram-memory', description: 'High-frequency DDR5 & DDR4 desktop/laptop memory kits' },
  { name: 'Storage & SSDs', slug: 'storage-ssds', description: 'NVMe Gen 4/5 M.2 SSDs and high-capacity hard drives' },
  { name: 'Power Supplies', slug: 'power-supplies', description: '80+ Gold and Platinum modular ATX power supplies' },
  { name: 'Keyboards & Mice', slug: 'keyboards-and-accessories', description: 'Custom mechanical keyboards, wireless mice, and deskpads' },
  { name: 'Keyboards', slug: 'keyboards', description: 'Hot-swappable mechanical keyboards with custom switches' },
  { name: 'Gaming Mice', slug: 'gaming-mice', description: 'Ultra-lightweight high-polling rate optical sensor mice' },
  { name: 'Monitors & Displays', slug: 'monitors-and-displays', description: 'OLED, 4K UHD, Ultrawide, and high-refresh rate gaming panels' },
  { name: 'Gaming Monitors', slug: 'gaming-monitors', description: '240Hz+ fast IPS and OLED competitive gaming displays' },
  { name: 'Cameras & Imaging', slug: 'cameras-and-imaging', description: 'Full-frame mirrorless cameras, cinema lenses, and drones' },
  { name: 'Smart Devices', slug: 'smart-devices', description: 'Smartwatches, IoT hubs, and connected home technology' },
];

const INITIAL_BRANDS = [
  { name: 'Samsung', slug: 'samsung', status: 'Approved', verified: true },
  { name: 'ASUS', slug: 'asus', status: 'Approved', verified: true },
  { name: 'Dell', slug: 'dell', status: 'Approved', verified: true },
  { name: 'HP', slug: 'hp', status: 'Approved', verified: true },
  { name: 'Lenovo', slug: 'lenovo', status: 'Approved', verified: true },
  { name: 'LG', slug: 'lg', status: 'Approved', verified: true },
  { name: 'Logitech', slug: 'logitech', status: 'Approved', verified: true },
  { name: 'Razer', slug: 'razer', status: 'Approved', verified: true },
  { name: 'Corsair', slug: 'corsair', status: 'Approved', verified: true },
  { name: 'MSI', slug: 'msi', status: 'Approved', verified: true },
  { name: 'Intel', slug: 'intel', status: 'Approved', verified: true },
  { name: 'AMD', slug: 'amd', status: 'Approved', verified: true },
  { name: 'Canon', slug: 'canon', status: 'Approved', verified: true },
  { name: 'Kingston', slug: 'kingston', status: 'Approved', verified: true },
];

const seedAtlasTaxonomy = async () => {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('Connected to Atlas for Taxonomy Seeding...');

    for (const cat of INITIAL_CATEGORIES) {
      await Category.updateOne({ slug: cat.slug }, { $set: cat }, { upsert: true });
    }
    console.log(`✓ Seeded ${INITIAL_CATEGORIES.length} verified categories in Atlas.`);

    for (const brand of INITIAL_BRANDS) {
      await Brand.updateOne({ slug: brand.slug }, { $set: brand }, { upsert: true });
    }
    console.log(`✓ Seeded ${INITIAL_BRANDS.length} authorized partner brands in Atlas.`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding taxonomy:', err);
    process.exit(1);
  }
};

seedAtlasTaxonomy();
