import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { getPopulatedCart, isPurchasableProduct, getProductAvailableStock } from './cartController.js';
import { isProhibitedBrand } from '../utils/brandValidation.js';
import { formatIST } from '../utils/dateFormat.js';

/**
 * Helper: Retrieve user wishlist populated with live MongoDB product details,
 * dynamically compute availability, price, discount, and cleanup deleted/prohibited items.
 */
export const getPopulatedWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'products.product',
    select: 'name slug brand category mrp sellingPrice price images stock stockQuantity status isActive isDeleted gstRate SKU modelNumber description',
    populate: [
      { path: 'brand', select: 'name slug logo' },
      { path: 'category', select: 'name slug' },
    ],
  });

  if (!wishlist) {
    return {
      _id: null,
      user: userId,
      count: 0,
      items: [],
      products: [],
      createdAt: null,
      updatedAt: null,
      createdAtIST: '',
      updatedAtIST: '',
    };
  }

  // Filter out products that have been hard-deleted or belong to prohibited brands
  let itemsChanged = false;
  const validProducts = [];

  for (const item of (wishlist.products || [])) {
    const p = item.product;
    if (!p || p.isDeleted === true) {
      itemsChanged = true;
      continue;
    }
    const brandName = p.brand?.name || (typeof p.brand === 'string' ? p.brand : '');
    if (isProhibitedBrand(p.name) || isProhibitedBrand(brandName)) {
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
  const formattedItems = (wishlist.products || []).map((item) => {
    const p = item.product;
    const unitPrice = Number(p.sellingPrice ?? p.price ?? 0);
    const mrp = Number(p.mrp ?? unitPrice);
    const discount = mrp > unitPrice ? Math.round(((mrp - unitPrice) / mrp) * 100) : 0;

    const availableStock = getProductAvailableStock(p);
    const isOutOfStock = availableStock <= 0;
    const isLiveActive = isPurchasableProduct(p);

    return {
      _id: item._id,
      product: p,
      addedAt: item.addedAt,
      addedAtIST: item.addedAtIST || formatIST(item.addedAt),
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
    createdAt: wishlist.createdAt,
    updatedAt: wishlist.updatedAt,
    createdAtIST: formatIST(wishlist.createdAt),
    updatedAtIST: formatIST(wishlist.updatedAt),
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
  const targetProductId = req.body.productId || req.body.product || req.body.id || req.body._id;

  try {
    if (!targetProductId || !mongoose.Types.ObjectId.isValid(targetProductId)) {
      return res.status(400).json({ success: false, message: 'A valid Product ID is required.' });
    }

    const product = await Product.findById(targetProductId).populate('brand', 'name slug');
    if (!product || product.isDeleted === true) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const brandName = product.brand?.name || (typeof product.brand === 'string' ? product.brand : '');
    if (isProhibitedBrand(product.name) || isProhibitedBrand(brandName)) {
      return res.status(400).json({
        success: false,
        message: 'This product brand is not permitted on KAIA Technologies.',
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const exists = wishlist.products.some((it) => it.product.toString() === targetProductId.toString());
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
      product: targetProductId,
      addedAt: new Date(),
      addedAtIST: formatIST(new Date()),
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
// @route   DELETE /api/wishlist/:productId, DELETE /api/account/wishlist/:productId, DELETE /api/wishlist/item/:productId
// @access  Private (Authenticated User)
export const removeFromWishlist = async (req, res) => {
  const rawTargetId = req.params.productId || req.body.productId || req.body.product || req.body.id || req.body._id;

  try {
    if (!rawTargetId || !mongoose.Types.ObjectId.isValid(rawTargetId)) {
      return res.status(400).json({ success: false, message: 'A valid Product ID is required.' });
    }

    const targetIdStr = String(rawTargetId).trim();
    const objId = new mongoose.Types.ObjectId(targetIdStr);

    // Atomic MongoDB removal targeting product ObjectId, product string, or subdocument _id
    await Wishlist.updateOne(
      { user: req.user._id },
      {
        $pull: {
          products: {
            $or: [
              { product: objId },
              { product: targetIdStr },
              { _id: objId },
            ],
          },
        },
      }
    );

    // Clean up empty wishlist document from MongoDB
    const checkWishlist = await Wishlist.findOne({ user: req.user._id });
    if (checkWishlist && checkWishlist.products.length === 0) {
      await Wishlist.findByIdAndDelete(checkWishlist._id);
    }

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
  const rawTargetId = req.body.productId || req.body.product || req.body.id || req.body._id || req.params.productId;

  try {
    if (!rawTargetId || !mongoose.Types.ObjectId.isValid(rawTargetId)) {
      return res.status(400).json({ success: false, message: 'A valid Product ID is required.' });
    }

    const targetIdStr = String(rawTargetId).trim();
    const product = await Product.findById(targetIdStr).populate('brand', 'name slug');
    if (!product || product.isDeleted === true) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const brandName = product.brand?.name || (typeof product.brand === 'string' ? product.brand : '');
    if (isProhibitedBrand(product.name) || isProhibitedBrand(brandName)) {
      return res.status(400).json({
        success: false,
        message: 'This product brand is not permitted on KAIA Technologies.',
      });
    }

    const objId = new mongoose.Types.ObjectId(targetIdStr);
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    const exists = wishlist?.products?.some((it) => {
      const pId = it.product ? (it.product._id ? it.product._id.toString() : it.product.toString()) : '';
      const subId = it._id ? it._id.toString() : '';
      return pId === targetIdStr || subId === targetIdStr;
    });

    let isWishlisted = false;
    let message = '';

    if (exists) {
      // Remove via atomic MongoDB $pull
      await Wishlist.updateOne(
        { user: req.user._id },
        {
          $pull: {
            products: {
              $or: [
                { product: objId },
                { product: targetIdStr },
                { _id: objId },
              ],
            },
          },
        }
      );
      isWishlisted = false;
      message = 'Removed from wishlist.';

      const checkWishlist = await Wishlist.findOne({ user: req.user._id });
      if (checkWishlist && checkWishlist.products.length === 0) {
        await Wishlist.findByIdAndDelete(checkWishlist._id);
      }
    } else {
      if (!wishlist) {
        wishlist = await Wishlist.create({
          user: req.user._id,
          products: [
            {
              product: objId,
              addedAt: new Date(),
              addedAtIST: formatIST(new Date()),
            },
          ],
        });
      } else {
        wishlist.products.unshift({
          product: objId,
          addedAt: new Date(),
          addedAtIST: formatIST(new Date()),
        });
        wishlist.markModified('products');
        await wishlist.save();
      }
      isWishlisted = true;
      message = 'Added to your wishlist.';
    }

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
// @route   DELETE /api/wishlist/clear, DELETE /api/wishlist
// @access  Private (Authenticated User)
export const clearWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.user._id });

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
// @route   POST /api/wishlist/:productId/move-to-cart, POST /api/wishlist/move-to-cart
// @access  Private (Authenticated User)
export const moveToCart = async (req, res) => {
  const rawTargetId = req.params.productId || req.body.productId || req.body.product || req.body.id || req.body._id;
  const { quantity = 1, selectedSpecs = {} } = req.body;

  try {
    if (!rawTargetId || !mongoose.Types.ObjectId.isValid(rawTargetId)) {
      return res.status(400).json({ success: false, message: 'A valid Product ID is required.' });
    }

    const targetIdStr = String(rawTargetId).trim();
    const product = await Product.findById(targetIdStr).populate('brand', 'name');
    if (!product || !isPurchasableProduct(product)) {
      return res.status(400).json({
        success: false,
        message: 'This product is currently unavailable or pending approval.',
      });
    }

    const availableStock = getProductAvailableStock(product);
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

    const objId = new mongoose.Types.ObjectId(targetIdStr);

    // 1. Add to User's Cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === targetIdStr &&
        JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(selectedSpecs || {})
    );

    const unitPrice = Number(product.sellingPrice ?? product.price ?? 0);

    if (existingIndex > -1) {
      const combinedQty = Math.min(availableStock, cart.items[existingIndex].quantity + requestedQty);
      cart.items[existingIndex].quantity = combinedQty;
    } else {
      cart.items.push({
        product: objId,
        quantity: requestedQty,
        selectedSpecs: selectedSpecs || {},
        priceAtAdd: unitPrice,
      });
    }
    cart.markModified('items');
    await cart.save();

    // 2. Remove from Wishlist atomically
    await Wishlist.updateOne(
      { user: req.user._id },
      {
        $pull: {
          products: {
            $or: [
              { product: objId },
              { product: targetIdStr },
              { _id: objId },
            ],
          },
        },
      }
    );

    const checkWishlist = await Wishlist.findOne({ user: req.user._id });
    if (checkWishlist && checkWishlist.products.length === 0) {
      await Wishlist.findByIdAndDelete(checkWishlist._id);
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
