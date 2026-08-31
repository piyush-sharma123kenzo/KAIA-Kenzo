import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// @desc    Get user's complete wishlist
// @route   GET /api/wishlist & GET /api/account/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const wishlistDocs = await Wishlist.find({ user: req.user._id })
      .populate({
        path: 'product',
        populate: [
          { path: 'brand', select: 'name slug logo' },
          { path: 'category', select: 'name slug' },
        ],
      })
      .sort({ createdAt: -1 });

    // Filter out any deleted products
    const validItems = wishlistDocs.filter((w) => w.product !== null);

    res.status(200).json({
      success: true,
      count: validItems.length,
      wishlist: validItems,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Server error retrieving wishlist.' });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist & POST /api/account/wishlist
// @access  Private
export const addToWishlist = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required.' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Check if already in wishlist
    let item = await Wishlist.findOne({ user: req.user._id, product: productId });
    if (!item) {
      item = await Wishlist.create({
        user: req.user._id,
        product: productId,
      });
    }

    const populated = await Wishlist.findById(item._id).populate({
      path: 'product',
      populate: [
        { path: 'brand', select: 'name slug logo' },
        { path: 'category', select: 'name slug' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Product added to your wishlist.',
      item: populated,
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Server error saving to wishlist.' });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId & DELETE /api/account/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  try {
    await Wishlist.findOneAndDelete({
      user: req.user._id,
      product: productId,
    });

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.',
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Server error removing item.' });
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/wishlist/toggle
// @access  Private
export const toggleWishlist = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required.' });
  }

  try {
    const existing = await Wishlist.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return res.status(200).json({
        success: true,
        isWishlisted: false,
        message: 'Removed from wishlist.',
      });
    } else {
      await Wishlist.create({
        user: req.user._id,
        product: productId,
      });
      return res.status(200).json({
        success: true,
        isWishlisted: true,
        message: 'Added to wishlist.',
      });
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ message: 'Server error toggling wishlist.' });
  }
};
