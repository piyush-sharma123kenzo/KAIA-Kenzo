import Category from '../models/Category.js';
import Product from '../models/Product.js';

// @desc    Get all categories with active product counts and subcategories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).populate('parentCategory', 'name slug').lean();

    // Attach dynamic product counts
    const catIds = categories.map((c) => c._id);
    const productCounts = await Product.aggregate([
      { $match: { category: { $in: catIds }, isActive: true, status: { $in: ['Approved', 'published'] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    productCounts.forEach((pc) => {
      countMap[pc._id.toString()] = pc.count;
    });

    // Map subcategories
    const enrichedCategories = categories.map((c) => {
      const subcategories = categories
        .filter((sub) => sub.parentCategory && sub.parentCategory._id.toString() === c._id.toString())
        .map((sub) => sub.name);

      return {
        ...c,
        id: c._id,
        productCount: countMap[c._id.toString()] || 0,
        subcategories: subcategories.length > 0 ? subcategories : [c.name],
      };
    });

    res.status(200).json({ success: true, categories: enrichedCategories, data: enrichedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error fetching categories.' });
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
