import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Real Canonical Platform Departments and Hierarchies
export const CANONICAL_PARENT_CATEGORIES = [
  {
    name: 'Computers & Laptops',
    slug: 'computers',
    description: 'Gaming Laptops, Thin-and-Light Ultrabooks, Desktop Workstations, and Prebuilt Rigs.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    baseCommission: 5.0,
    isActive: true,
  },
  {
    name: 'Mobile Devices & Tablets',
    slug: 'mobile-devices',
    description: 'Flagship 5G Smartphones, High-Megapixel Mobile Handsets, and Creative Tablets.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
    baseCommission: 5.0,
    isActive: true,
  },
  {
    name: 'Audio Systems & Headphones',
    slug: 'audio-and-sound',
    description: 'Studio Reference Monitors, Active Noise Cancelling Headphones, and True Wireless Earbuds.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    baseCommission: 5.0,
    isActive: true,
  },
  {
    name: 'PC Components & Hardware',
    slug: 'pc-components',
    description: 'Multi-threaded Processors (CPUs), Dedicated GPUs, Overclocked DDR5 RAM, and Motherboards.',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
    baseCommission: 5.0,
    isActive: true,
  },
  {
    name: 'Keyboards, Mice & Peripherals',
    slug: 'keyboards-and-accessories',
    description: 'Custom Hot-Swappable Mechanical Keyboards, Ultra-light Wireless Gaming Mice, and Deskpads.',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
    baseCommission: 5.0,
    isActive: true,
  },
  {
    name: 'Monitors & Displays',
    slug: 'monitors-and-displays',
    description: '4K OLED Creator Displays, Fast-IPS High Refresh Rate Gaming Panels, and Ultrawide Screens.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    baseCommission: 5.0,
    isActive: true,
  },
  {
    name: 'Cameras & Production Gear',
    slug: 'cameras-and-imaging',
    description: 'Full-Frame Mirrorless Cameras, Cinema Prime Lenses, 4K Webcams, and Video Capture Units.',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    baseCommission: 5.0,
    isActive: true,
  },
  {
    name: 'Smart Devices & IoT',
    slug: 'smart-devices',
    description: 'Connected Smartwatches, Fitness Trackers, Smart Home Hubs, and Ambient IoT Technology.',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
    baseCommission: 5.0,
    isActive: true,
  },
];

export const CANONICAL_SUBCATEGORIES = [
  { name: 'Laptops', slug: 'laptops', parentSlug: 'computers', description: 'Productivity Ultrabooks, 2-in-1s, and Business Laptops', baseCommission: 5.0 },
  { name: 'Gaming Laptops', slug: 'gaming-laptops', parentSlug: 'computers', description: 'High-TGP RTX Graphics Laptops with High-Refresh Displays', baseCommission: 5.0 },
  { name: 'Desktop PCs', slug: 'desktop-pcs', parentSlug: 'computers', description: 'Prebuilt Performance Workstations and Gaming Rigs', baseCommission: 5.0 },
  { name: 'Smartphones', slug: 'smartphones', parentSlug: 'mobile-devices', description: 'Flagship 5G Mobile Phones with High-Resolution Sensors', baseCommission: 5.0 },
  { name: 'Tablets', slug: 'tablets', parentSlug: 'mobile-devices', description: 'Creative Drawing Tablets, iPads, and Android Slates', baseCommission: 5.0 },
  { name: 'Headphones', slug: 'headphones', parentSlug: 'audio-and-sound', description: 'Over-Ear ANC Headphones and Studio Reference Cans', baseCommission: 5.0 },
  { name: 'Wireless Earbuds', slug: 'earbuds', parentSlug: 'audio-and-sound', description: 'True Wireless Stereo Earbuds with Spatial Audio', baseCommission: 5.0 },
  { name: 'Speakers & Soundbars', slug: 'speakers', parentSlug: 'audio-and-sound', description: 'Bluetooth Audio Systems and Home Theater Soundbars', baseCommission: 5.0 },
  { name: 'Processors (CPUs)', slug: 'processors', parentSlug: 'pc-components', description: 'Intel Core & AMD Ryzen Multi-Core Desktop Processors', baseCommission: 5.0 },
  { name: 'Graphics Cards (GPUs)', slug: 'graphics-cards', parentSlug: 'pc-components', description: 'NVIDIA RTX & AMD Radeon Gaming & Creator Video Cards', baseCommission: 5.0 },
  { name: 'Motherboards', slug: 'motherboards', parentSlug: 'pc-components', description: 'ATX, Micro-ATX, and ITX Chipsets with PCIe Gen5', baseCommission: 5.0 },
  { name: 'Memory (RAM)', slug: 'memory', parentSlug: 'pc-components', description: 'DDR5 Overclocked High-Speed Gaming and Workstation RAM', baseCommission: 5.0 },
  { name: 'Storage & SSDs', slug: 'storage', parentSlug: 'pc-components', description: 'PCIe Gen4/Gen5 NVMe M.2 SSDs and High-Speed External Drives', baseCommission: 5.0 },
  { name: 'Gaming Mice', slug: 'gaming-mice', parentSlug: 'keyboards-and-accessories', description: 'Ultra-Lightweight Optical Sensor Wireless Mice', baseCommission: 5.0 },
  { name: 'Mechanical Keyboards', slug: 'mechanical-keyboards', parentSlug: 'keyboards-and-accessories', description: 'Custom Hot-Swappable Switches and Gasket Mount Keyboards', baseCommission: 5.0 },
  { name: 'Gaming Monitors', slug: 'gaming-monitors', parentSlug: 'monitors-and-displays', description: 'OLED and Fast-IPS High Refresh Rate Displays up to 360Hz', baseCommission: 5.0 },
  { name: 'Smartwatches', slug: 'smartwatches', parentSlug: 'smart-devices', description: 'AMOLED Smartwatches, Fitness Bands, and Bio-Sensors', baseCommission: 5.0 },
  { name: 'Networking & WiFi', slug: 'networking', parentSlug: 'computers', description: 'WiFi 7 Mesh Routers, Managed Switches, and Access Points', baseCommission: 5.0 },
  { name: 'Accessories & Docks', slug: 'accessories', parentSlug: 'keyboards-and-accessories', description: 'Thunderbolt Docks, GaN Fast Chargers, and Interconnects', baseCommission: 5.0 },
];

/**
 * Self-healing Category Initializer
 * Re-creates and synchronizes all real platform categories in MongoDB if missing or cleared.
 */
export const ensureRealCategories = async () => {
  try {
    const parentMap = {};

    // 1. Upsert Parent Departments
    for (const pCat of CANONICAL_PARENT_CATEGORIES) {
      const doc = await Category.findOneAndUpdate(
        { slug: pCat.slug },
        {
          $set: {
            name: pCat.name,
            description: pCat.description,
            image: pCat.image,
            baseCommission: pCat.baseCommission,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
      parentMap[pCat.slug] = doc._id;
    }

    // 2. Upsert Subcategories with accurate parent relations
    for (const sub of CANONICAL_SUBCATEGORIES) {
      const parentId = parentMap[sub.parentSlug] || null;
      await Category.findOneAndUpdate(
        { slug: sub.slug },
        {
          $set: {
            name: sub.name,
            description: sub.description,
            parentCategory: parentId,
            baseCommission: sub.baseCommission,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    // 3. Auto-link any products whose category reference became broken/orphaned
    const allCategories = await Category.find({ isActive: true }).select('_id slug name').lean();
    const catBySlug = {};
    allCategories.forEach((c) => {
      catBySlug[c.slug] = c._id;
    });

    const defaultCatId = catBySlug['pc-components'] || allCategories[0]?._id;

    if (defaultCatId) {
      // Find products where category is null or doesn't match any existing category
      const existingCatIds = allCategories.map((c) => c._id);
      const orphanedProducts = await Product.find({
        $or: [
          { category: { $exists: false } },
          { category: null },
          { category: { $nin: existingCatIds } },
        ],
      });

      for (const prod of orphanedProducts) {
        const text = `${prod.name || ''} ${prod.slug || ''} ${prod.modelNumber || ''}`.toLowerCase();
        let matchedId = defaultCatId;

        if (text.includes('laptop') || text.includes('notebook') || text.includes('zenbook') || text.includes('macbook') || text.includes('thinkpad')) {
          matchedId = catBySlug['laptops'] || catBySlug['computers'] || defaultCatId;
        } else if (text.includes('phone') || text.includes('galaxy s') || text.includes('ultra') || text.includes('5g') || text.includes('cellular')) {
          matchedId = catBySlug['smartphones'] || catBySlug['mobile-devices'] || defaultCatId;
        } else if (text.includes('headphone') || text.includes('earbud') || text.includes('audio') || text.includes('sound') || text.includes('speaker')) {
          matchedId = catBySlug['audio-and-sound'] || catBySlug['headphones'] || defaultCatId;
        } else if (text.includes('keyboard') || text.includes('mouse') || text.includes('mice') || text.includes('mechanical')) {
          matchedId = catBySlug['keyboards-and-accessories'] || catBySlug['mechanical-keyboards'] || defaultCatId;
        } else if (text.includes('monitor') || text.includes('display') || text.includes('oled') || text.includes('screen')) {
          matchedId = catBySlug['monitors-and-displays'] || catBySlug['gaming-monitors'] || defaultCatId;
        } else if (text.includes('camera') || text.includes('lens') || text.includes('dslr') || text.includes('mirrorless')) {
          matchedId = catBySlug['cameras-and-imaging'] || defaultCatId;
        } else if (text.includes('tablet') || text.includes('ipad') || text.includes('slate')) {
          matchedId = catBySlug['tablets'] || catBySlug['mobile-devices'] || defaultCatId;
        } else if (text.includes('ssd') || text.includes('nvme') || text.includes('drive') || text.includes('storage')) {
          matchedId = catBySlug['storage'] || catBySlug['pc-components'] || defaultCatId;
        } else if (text.includes('processor') || text.includes('cpu') || text.includes('ryzen') || text.includes('intel') || text.includes('gpu') || text.includes('geforce') || text.includes('rtx') || text.includes('radeon')) {
          matchedId = catBySlug['pc-components'] || catBySlug['processors'] || defaultCatId;
        }

        prod.category = matchedId;
        await prod.save();
      }
    }

    console.log(`[KAIA Categories] Verified & synchronized ${allCategories.length} official categories in MongoDB.`);
  } catch (err) {
    console.error('[KAIA Categories] Error ensuring real categories:', err.message);
  }
};

// @desc    Get all categories with active product counts and subcategories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    let categories = await Category.find({ isActive: { $ne: false } }).populate('parentCategory', 'name slug').lean();

    // If database was wiped or has fewer than expected categories, self-heal immediately
    if (!categories || categories.length < 8) {
      await ensureRealCategories();
      categories = await Category.find({ isActive: { $ne: false } }).populate('parentCategory', 'name slug').lean();
    }

    // Attach dynamic product counts
    const catIds = (categories || []).map((c) => c._id);
    let countMap = {};
    try {
      const productCounts = await Product.aggregate([
        { $match: { category: { $in: catIds }, isActive: true, status: { $in: ['Approved', 'published'] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);
      productCounts.forEach((pc) => {
        countMap[pc._id.toString()] = pc.count;
      });
    } catch (aggErr) {
      console.warn('Product aggregation warning in getCategories:', aggErr.message);
    }

    // Map subcategories
    const enrichedCategories = (categories || []).map((c) => {
      const subcategories = (categories || [])
        .filter((sub) => sub.parentCategory && sub.parentCategory._id?.toString() === c._id?.toString())
        .map((sub) => sub.name);

      return {
        ...c,
        id: c._id,
        productCount: countMap[c._id?.toString()] || 0,
        subcategories: subcategories.length > 0 ? subcategories : [c.name],
      };
    });

    return res.status(200).json({ success: true, categories: enrichedCategories, data: enrichedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving categories.' });
  }
};

// @desc    Get category details by slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategoryBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    let category = await Category.findOne({ slug, isActive: true }).populate('parentCategory', 'name slug').lean();
    if (!category) {
      // Re-run category sync in case category was newly added or db was empty
      await ensureRealCategories();
      category = await Category.findOne({ slug, isActive: true }).populate('parentCategory', 'name slug').lean();
    }

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Find subcategories
    const subCategories = await Category.find({ parentCategory: category._id, isActive: true }).lean();
    const allCatIds = [category._id, ...subCategories.map((sc) => sc._id)];

    const productCount = await Product.countDocuments({
      category: { $in: allCatIds },
      isActive: true,
      status: { $in: ['Approved', 'published'] },
    });

    const enrichedCategory = {
      ...category,
      id: category._id,
      productCount,
      subcategories: subCategories.length > 0 ? subCategories.map((s) => s.name) : [category.name],
    };

    res.status(200).json({ success: true, category: enrichedCategory, data: enrichedCategory });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Server error fetching category details.' });
  }
};

export default {
  ensureRealCategories,
  getCategories,
  getCategoryBySlug,
};
