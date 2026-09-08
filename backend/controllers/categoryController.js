import Category from '../models/Category.js';
import Product from '../models/Product.js';

// @desc    Get all categories with active product counts and subcategories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    let categories = await Category.find({ isActive: { $ne: false } }).populate('parentCategory', 'name slug').lean();

    if (!categories || categories.length === 0) {
      // Auto-initialize standard platform electronics categories
      const defaultCategories = [
        { name: 'Laptops', slug: 'laptops', description: 'Gaming, Ultrabooks & Productivity Laptops', baseCommission: 5.0, isActive: true },
        { name: 'Smartphones', slug: 'smartphones', description: 'Flagship 5G Smartphones & Cellular Hardware', baseCommission: 5.0, isActive: true },
        { name: 'Audio & Headphones', slug: 'audio-and-sound', description: 'ANC Headphones, Wireless Earbuds & Studio Monitors', baseCommission: 5.0, isActive: true },
        { name: 'PC Components', slug: 'pc-components', description: 'Processors, Graphics Cards, RAM & Motherboards', baseCommission: 5.0, isActive: true },
        { name: 'Monitors & Displays', slug: 'monitors-and-displays', description: '4K OLED & High Refresh Rate Gaming Panels', baseCommission: 5.0, isActive: true },
        { name: 'Keyboards & Mice', slug: 'keyboards-and-accessories', description: 'Custom Mechanical Keyboards & Wireless Mice', baseCommission: 5.0, isActive: true },
        { name: 'Cameras & Imaging', slug: 'cameras-and-imaging', description: 'Mirrorless Cameras, Lenses & Production Gear', baseCommission: 5.0, isActive: true },
        { name: 'Smart Devices', slug: 'smart-devices', description: 'Smartwatches, IoT Hubs & Connected Tech', baseCommission: 5.0, isActive: true },
        { name: 'Tablets', slug: 'tablets', description: 'Productivity Tablets, iPads & Drawing Slates', baseCommission: 5.0, isActive: true },
        { name: 'Storage & Drives', slug: 'storage', description: 'PCIe NVMe SSDs, External Drives & High-Speed Media', baseCommission: 5.0, isActive: true },
        { name: 'Networking & Smart Home', slug: 'networking', description: 'WiFi 7 Routers, Mesh Systems & Smart Switches', baseCommission: 5.0, isActive: true },
        { name: 'Gaming Consoles & VR', slug: 'gaming-consoles', description: 'Next-Gen Consoles, VR Headsets & Accessories', baseCommission: 5.0, isActive: true },
        { name: 'Accessories & Cables', slug: 'accessories', description: 'High-Speed Cables, Docks, Chargers & Adapters', baseCommission: 5.0, isActive: true },
      ];
      try {
        await Category.insertMany(defaultCategories, { ordered: false });
      } catch (insertErr) {
        console.warn('Auto-seed default categories partial note:', insertErr.message);
      }
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
    const fallbackList = [
      { id: 'laptops', name: 'Laptops', slug: 'laptops', productCount: 0 },
      { id: 'smartphones', name: 'Smartphones', slug: 'smartphones', productCount: 0 },
      { id: 'audio-and-sound', name: 'Audio & Headphones', slug: 'audio-and-sound', productCount: 0 },
      { id: 'pc-components', name: 'PC Components', slug: 'pc-components', productCount: 0 },
      { id: 'monitors-and-displays', name: 'Monitors & Displays', slug: 'monitors-and-displays', productCount: 0 },
      { id: 'keyboards-and-accessories', name: 'Keyboards & Mice', slug: 'keyboards-and-accessories', productCount: 0 },
      { id: 'cameras-and-imaging', name: 'Cameras & Imaging', slug: 'cameras-and-imaging', productCount: 0 },
      { id: 'smart-devices', name: 'Smart Devices', slug: 'smart-devices', productCount: 0 },
      { id: 'tablets', name: 'Tablets', slug: 'tablets', productCount: 0 },
      { id: 'storage', name: 'Storage & Drives', slug: 'storage', productCount: 0 },
      { id: 'networking', name: 'Networking & Smart Home', slug: 'networking', productCount: 0 },
      { id: 'gaming-consoles', name: 'Gaming Consoles & VR', slug: 'gaming-consoles', productCount: 0 },
      { id: 'accessories', name: 'Accessories & Cables', slug: 'accessories', productCount: 0 },
    ];
    return res.status(200).json({ success: true, categories: fallbackList, data: fallbackList });
  }
};

// @desc    Get category details by slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategoryBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const category = await Category.findOne({ slug, isActive: true }).populate('parentCategory', 'name slug').lean();
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
