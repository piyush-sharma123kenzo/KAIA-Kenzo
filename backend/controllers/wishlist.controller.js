import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { getPopulatedCart } from './cartController.js';

// Helper: Prohibited brand filter (Apple & Sony)
const isProhibitedBrand = (str) => {
  if (!str) return false;
  const s = String(str).toLowerCase();
  return (
    s.includes('apple') ||
    s.includes('iphone') ||
    s.includes('ipad') ||
    s.includes('macbook') ||
    s.includes('sony') ||
    s.includes('playstation') ||
    s.includes('bravia')
  );
};

/**
 * Helper: Retrieve user wishlist populated with live MongoDB product details,
 * dynamically compute availability, price, discount, and cleanup deleted/prohibited items.
 */
export const getPopulatedWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'products.product',
    select: 'name slug brand category mrp sellingPrice price images stock status isActive isDeleted gstRate SKU modelNumber description',
    populate: [
      { path: 'brand', select: 'name slug logo' },
      { path: 'category', select: 'name slug' },
    ],
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
    wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: 'products.product',
      select: 'name slug brand category mrp sellingPrice price images stock status isActive isDeleted gstRate SKU modelNumber description',
      populate: [
        { path: 'brand', select: 'name slug logo' },
        { path: 'category', select: 'name slug' },
      ],
    });
  }

  // Filter out products that have been hard-deleted or belong to prohibited brands
  let itemsChanged = false;
  const validProducts = [];

  for (const item of wishlist.products) {
    const p = item.product;
    if (
      !p ||
      p.isDeleted === true ||
      isProhibitedBrand(p.name) ||
      isProhibitedBrand(p.brand?.name) ||
      isProhibitedBrand(p.slug)
    ) {
      itemsChanged = true;
      continue;
    }
    validProducts.push(item);
  }

  if (itemsChanged) {
    wishlist.products = validProducts;
    await wishlist.save();
  }

  // Format products with dynamic stock and price attributes
  const formattedItems = wishlist.products.map((item) => {
    const p = item.product;
    const unitPrice = Number(p.sellingPrice ?? p.price ?? 0);
    const mrp = Number(p.mrp ?? unitPrice);
    const discount = mrp > unitPrice ? Math.round(((mrp - unitPrice) / mrp) * 100) : 0;

    const availableStock = Math.max(0, (p.stock?.quantity ?? 0) - (p.stock?.reservedQuantity ?? 0));
    const isOutOfStock = availableStock <= 0;
    const isLiveActive = p.isActive !== false && p.status === 'Approved' && p.isDeleted !== true;

    return {
      _id: item._id,
      product: p,
      addedAt: item.addedAt,
      unitPrice,
      mrp,
      discount,
      availableStock,
      isOutOfStock,
      isAvailable: isLiveActive && !isOutOfStock,
      statusText: !isLiveActive
        ? 'Currently unavailable'
        : isOutOfStock
        ? 'Out of Stock'
        : 'In Stock',
    };
  });

  return {
    _id: wishlist._id,
    user: wishlist.user,
    count: formattedItems.length,
    items: formattedItems,
    products: formattedItems,
  };
};

// @desc    Get user's complete wishlist
// @route   GET /api/wishlist & GET /api/account/wishlist
// @access  Private (Authenticated User)
export const getWishlist = async (req, res) => {
  try {
    const populated = await getPopulatedWishlist(req.user._id);
    res.status(200).json({
      success: true,
      count: populated.count,
      wishlist: populated,
      items: populated.products,
      data: { wishlist: populated.products, count: populated.count },
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving wishlist.' });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/add, POST /api/wishlist, POST /api/account/wishlist
// @access  Private (Authenticated User)
export const addToWishlist = async (req, res) => {
  const { productId } = req.body;

  try {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Valid Product ID is required.' });
    }

    const product = await Product.findById(productId).populate('brand', 'name slug');
    if (!product || product.isDeleted === true) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Prohibited brand check (Apple & Sony)
    if (
      isProhibitedBrand(product.name) ||
      isProhibitedBrand(product.slug) ||
      isProhibitedBrand(product.brand?.name)
    ) {
      return res.status(400).json({
        success: false,
        message: 'This product brand is not permitted on KAIA Technologies.',
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const exists = wishlist.products.some((it) => it.product.toString() === productId.toString());
    if (exists) {
      const populated = await getPopulatedWishlist(req.user._id);
      return res.status(200).json({
        success: true,
        message: 'Product already exists in your wishlist.',
        wishlist: populated,
        items: populated.products,
        data: { wishlist: populated.products, count: populated.count },
      });
    }

    wishlist.products.unshift({
      product: productId,
      addedAt: new Date(),
    });

    await wishlist.save();
    const populated = await getPopulatedWishlist(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Product added to your wishlist successfully.',
      wishlist: populated,
      items: populated.products,
      data: { wishlist: populated.products, count: populated.count },
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error saving to wishlist.' });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId, DELETE /api/account/wishlist/:productId
// @access  Private (Authenticated User)
export const removeFromWishlist = async (req, res) => {
  const targetProductId = req.params.productId || req.body.productId;

  try {
    if (!targetProductId || !mongoose.Types.ObjectId.isValid(targetProductId)) {
      return res.status(400).json({ success: false, message: 'Valid Product ID is required.' });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: 'Wishlist is empty.',
        wishlist: { count: 0, products: [], items: [] },
        items: [],
        data: { wishlist: [], count: 0 },
      });
    }

    wishlist.products = wishlist.products.filter(
      (it) => it.product.toString() !== targetProductId.toString()
    );

    await wishlist.save();
    const populated = await getPopulatedWishlist(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully.',
      wishlist: populated,
      items: populated.products,
      data: { wishlist: populated.products, count: populated.count },
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error removing item from wishlist.' });
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/wishlist/toggle
// @access  Private (Authenticated User)
export const toggleWishlist = async (req, res) => {
  const { productId } = req.body;

  try {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Valid Product ID is required.' });
    }

    const product = await Product.findById(productId).populate('brand', 'name slug');
    if (!product || product.isDeleted === true) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (
      isProhibitedBrand(product.name) ||
      isProhibitedBrand(product.slug) ||
      isProhibitedBrand(product.brand?.name)
    ) {
      return res.status(400).json({
        success: false,
        message: 'This product brand is not permitted on KAIA Technologies.',
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const existingIndex = wishlist.products.findIndex(
      (it) => it.product.toString() === productId.toString()
    );

    let isWishlisted = false;
    let message = '';

    if (existingIndex > -1) {
      wishlist.products.splice(existingIndex, 1);
      isWishlisted = false;
      message = 'Removed from wishlist.';
    } else {
      wishlist.products.unshift({
        product: productId,
        addedAt: new Date(),
      });
      isWishlisted = true;
      message = 'Added to your wishlist.';
    }

    await wishlist.save();
    const populated = await getPopulatedWishlist(req.user._id);

    res.status(200).json({
      success: true,
      isWishlisted,
      message,
      count: populated.count,
      wishlist: populated,
      items: populated.products,
      data: { wishlist: populated.products, isWishlisted, count: populated.count },
    });
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error toggling wishlist.' });
  }
};

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private (Authenticated User)
export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully.',
      count: 0,
      wishlist: { count: 0, products: [], items: [] },
      items: [],
      data: { wishlist: [], count: 0 },
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error clearing wishlist.' });
  }
};

// @desc    Move item from wishlist to cart
// @route   POST /api/wishlist/:productId/move-to-cart
// @access  Private (Authenticated User)
export const moveToCart = async (req, res) => {
  const targetProductId = req.params.productId || req.body.productId;
  const { quantity = 1, selectedSpecs = {} } = req.body;

  try {
    if (!targetProductId || !mongoose.Types.ObjectId.isValid(targetProductId)) {
      return res.status(400).json({ success: false, message: 'Valid Product ID is required.' });
    }

    const product = await Product.findById(targetProductId);
    if (!product || product.isDeleted || !product.isActive || product.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Product is currently unavailable or inactive.',
      });
    }

    const availableStock = Math.max(0, (product.stock?.quantity ?? 0) - (product.stock?.reservedQuantity ?? 0));
    if (availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: `Product "${product.name}" is currently out of stock.`,
      });
    }

    const requestedQty = Math.max(1, parseInt(quantity, 10) || 1);
    if (requestedQty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} items are available in stock.`,
      });
    }

    // 1. Add to User's Cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === targetProductId.toString() &&
        JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(selectedSpecs || {})
    );

    if (existingIndex > -1) {
      const combinedQty = Math.min(availableStock, cart.items[existingIndex].quantity + requestedQty);
      cart.items[existingIndex].quantity = combinedQty;
    } else {
      cart.items.push({
        product: targetProductId,
        quantity: requestedQty,
        selectedSpecs: selectedSpecs || {},
        priceAtAdd: product.sellingPrice,
      });
    }
    await cart.save();

    // 2. Remove from Wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (it) => it.product.toString() !== targetProductId.toString()
      );
      await wishlist.save();
    }

    const [populatedCart, populatedWishlist] = await Promise.all([
      getPopulatedCart(req.user._id),
      getPopulatedWishlist(req.user._id),
    ]);

    res.status(200).json({
      success: true,
      message: `Moved "${product.name}" to your shopping cart.`,
      cart: populatedCart,
      wishlist: populatedWishlist,
      items: populatedWishlist.products,
    });
  } catch (error) {
    console.error('Error moving wishlist item to cart:', error);
    res.status(500).json({ success: false, message: 'Server error moving item to cart.' });
  }
};

