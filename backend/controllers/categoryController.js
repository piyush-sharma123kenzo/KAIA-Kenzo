import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).populate('parentCategory', 'name slug');
    res.status(200).json({ success: true, categories });
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
    const category = await Category.findOne({ slug }).populate('parentCategory', 'name slug');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Server error fetching category details.' });
  }
};
