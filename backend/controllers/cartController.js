import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import { isProhibitedBrand } from '../utils/brandValidation.js';

/**
 * Helper: Determine if a product is active, approved, and eligible for customer purchase.
 * Supports Admin-created and Vendor-created products uniformly across all valid status aliases.
 */
export const isPurchasableProduct = (p) => {
  if (!p) return false;
  if (p.isDeleted === true) return false;
  if (p.isActive === false) return false;

  const validStatuses = ['Approved', 'approved', 'published', 'Active', 'active', 'Live', 'live'];
  const statusStr = String(p.status || 'Approved').trim();
  if (!validStatuses.includes(statusStr)) return false;

  const brandName = p.brand?.name || (typeof p.brand === 'string' ? p.brand : '');
  if (isProhibitedBrand(p.name) || isProhibitedBrand(brandName)) {
    return false;
  }

  return true;
};

/**
 * Helper: Compute live available stock for any product schema structure.
 */
export const getProductAvailableStock = (p) => {
  if (!p) return 0;
  const rawQty = typeof p.stock === 'number'
    ? p.stock
    : (p.stock?.quantity ?? p.stockQuantity ?? p.stock?.availableQuantity ?? 0);
  const reserved = Number(p.stock?.reservedQuantity ?? 0);
  return Math.max(0, Number(rawQty) - reserved);
};

/**
 * Helper: Fetch user cart populated with authoritative live product info,
 * recalculate financial totals and clean up any stale/deleted products.
 */
export const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name slug brand mrp sellingPrice price images stock stockQuantity status isActive isDeleted gstRate SKU modelNumber description',
    populate: { path: 'brand', select: 'name slug logo' },
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name slug brand mrp sellingPrice price images stock stockQuantity status isActive isDeleted gstRate SKU modelNumber description',
      populate: { path: 'brand', select: 'name slug logo' },
    });
  }

  // Filter out products that have been hard-deleted or fail purchasability rules
  let itemsChanged = false;
  const validItems = [];

  for (const item of (cart.items || [])) {
    const p = item.product;
    if (!isPurchasableProduct(p)) {
      itemsChanged = true;
      continue;
    }
    validItems.push(item);
  }

  if (itemsChanged) {
    cart.items = validItems;
    await cart.save();
  }

  // Calculate live item-level and cart-level financial totals
  let subtotal = 0;
  let tax = 0;
  let quantityCount = 0;

  const formattedItems = (cart.items || []).map((item) => {
    const p = item.product;
    const unitPrice = Number(p.sellingPrice ?? p.price ?? 0);
    const qty = Math.max(1, Number(item.quantity || 1));
    const gstRate = Number(p.gstRate ?? 18.0);

    const availableStock = getProductAvailableStock(p);
    const isOutOfStock = availableStock <= 0;
    const isQuantityExceeded = qty > availableStock;

    const itemTotal = unitPrice * qty;
    const itemGst = Math.round(itemTotal * (gstRate / (100 + gstRate)));
    const itemSubtotal = itemTotal - itemGst;

    subtotal += itemSubtotal;
    tax += itemGst;
    quantityCount += qty;

    return {
      _id: item._id,
      product: p,
      quantity: qty,
      selectedSpecs: item.selectedSpecs || {},
      priceAtAdd: item.priceAtAdd || unitPrice,
      unitPrice,
      itemTotal,
      itemSubtotal,
      itemGst,
      availableStock,
      isOutOfStock,
      isQuantityExceeded,
      maxAvailable: availableStock,
    };
  });

  const totalBeforeShipping = subtotal + tax;
  const shipping = totalBeforeShipping > 0 && totalBeforeShipping < 5000 ? 150 : 0;
  const grandTotal = totalBeforeShipping + shipping;

  const totals = {
    subtotal: Math.round(subtotal),
    tax: Math.round(tax),
    shipping,
    total: Math.round(grandTotal),
    quantityCount,
  };

  return {
    _id: cart._id,
    user: cart.user,
    items: formattedItems,
    totals,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getUserCart = async (req, res) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully.',
      cart,
    });
  } catch (error) {
    console.error('Get user cart error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching cart.' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart, POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  const targetProductId = req.body.productId || req.body.product || req.body.id || req.body._id;
  const { quantity = 1, selectedSpecs = {} } = req.body;

  try {
    if (!targetProductId || !mongoose.Types.ObjectId.isValid(targetProductId)) {
      return res.status(400).json({ success: false, message: 'A valid Product ID is required.' });
    }

    const requestedQty = parseInt(quantity, 10);
    if (isNaN(requestedQty) || requestedQty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    }

    const product = await Product.findById(targetProductId).populate('brand', 'name slug');
    if (!product || !isPurchasableProduct(product)) {
      return res.status(404).json({
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

    if (requestedQty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} ${availableStock === 1 ? 'unit is' : 'units are'} available in stock.`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart with identical specifications
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === targetProductId.toString() &&
        JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(selectedSpecs || {})
    );

    const unitPrice = Number(product.sellingPrice ?? product.price ?? 0);

    if (existingIndex > -1) {
      const combinedQty = cart.items[existingIndex].quantity + requestedQty;
      if (combinedQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than available stock (${availableStock} available, ${cart.items[existingIndex].quantity} already in cart).`,
        });
      }
      cart.items[existingIndex].quantity = combinedQty;
    } else {
      cart.items.push({
        product: targetProductId,
        quantity: requestedQty,
        selectedSpecs: selectedSpecs || {},
        priceAtAdd: unitPrice,
      });
    }

    await cart.save();
    const populated = await getPopulatedCart(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully.',
      cart: populated,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Server error adding product to cart.' });
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/update, PATCH /api/cart/update, PATCH /api/cart/item/:productId
// @access  Private
export const updateCartItem = async (req, res) => {
  const targetProductId = req.params.productId || req.body.productId || req.body.product;
  const { quantity, selectedSpecs } = req.body;

  try {
    if (!targetProductId || !mongoose.Types.ObjectId.isValid(targetProductId)) {
      return res.status(400).json({ success: false, message: 'A valid Product ID is required.' });
    }

    const requestedQty = parseInt(quantity, 10);
    if (isNaN(requestedQty)) {
      return res.status(400).json({ success: false, message: 'A valid quantity number is required.' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === targetProductId.toString() &&
        (selectedSpecs === undefined ||
          JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(selectedSpecs || {}))
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }

    // If quantity is 0 or negative, remove the item
    if (requestedQty <= 0) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
      const populated = await getPopulatedCart(req.user._id);
      return res.status(200).json({
        success: true,
        message: 'Item removed from cart.',
        cart: populated,
      });
    }

    // Check available stock from live database
    const product = await Product.findById(targetProductId).populate('brand', 'name');
    if (!product || !isPurchasableProduct(product)) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
      const populated = await getPopulatedCart(req.user._id);
      return res.status(400).json({
        success: false,
        message: 'Product is no longer available and has been removed from your cart.',
        cart: populated,
      });
    }

    const availableStock = getProductAvailableStock(product);
    if (requestedQty > availableStock) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} ${availableStock === 1 ? 'unit is' : 'units are'} available.`,
      });
    }

    cart.items[itemIndex].quantity = requestedQty;
    await cart.save();

    const populated = await getPopulatedCart(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Cart quantity updated successfully.',
      cart: populated,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ success: false, message: 'Server error updating cart quantity.' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:productId, DELETE /api/cart/remove, POST /api/cart/remove
// @access  Private
export const removeCartItem = async (req, res) => {
  const targetProductId = req.params.productId || req.body.productId || req.body.product;
  const { selectedSpecs } = req.body || {};

  try {
    if (!targetProductId || !mongoose.Types.ObjectId.isValid(targetProductId)) {
      return res.status(400).json({ success: false, message: 'A valid Product ID is required.' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === targetProductId.toString() &&
          (selectedSpecs === undefined ||
            JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(selectedSpecs || {}))
        )
    );

    await cart.save();
    const populated = await getPopulatedCart(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully.',
      cart: populated,
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ success: false, message: 'Server error removing item from cart.' });
  }
};

// @desc    Clear all items in user's cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    const populated = await getPopulatedCart(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully.',
      cart: populated,
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: 'Server error clearing cart.' });
  }
};

// @desc    Merge guest cart items into user's MongoDB cart upon login
// @route   POST /api/cart/merge, POST /api/cart/sync
// @access  Private
export const syncCart = async (req, res) => {
  const { items } = req.body;

  try {
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid cart items array.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    for (const guestItem of items) {
      const prodId = guestItem.product?._id || guestItem.product || guestItem.productId;
      if (!prodId || !mongoose.Types.ObjectId.isValid(prodId)) continue;

      const product = await Product.findById(prodId).populate('brand', 'name');
      if (!product || !isPurchasableProduct(product)) {
        continue;
      }

      const availableStock = getProductAvailableStock(product);
      if (availableStock <= 0) continue;

      const guestQty = Math.max(1, parseInt(guestItem.quantity, 10) || 1);
      const specs = guestItem.selectedSpecs || {};

      const existingIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === prodId.toString() &&
          JSON.stringify(item.selectedSpecs || {}) === JSON.stringify(specs)
      );

      const unitPrice = Number(product.sellingPrice ?? product.price ?? 0);

      if (existingIndex > -1) {
        // Merge quantities safely capped at available stock
        const mergedQty = Math.min(availableStock, cart.items[existingIndex].quantity + guestQty);
        cart.items[existingIndex].quantity = mergedQty;
      } else {
        const initialQty = Math.min(availableStock, guestQty);
        cart.items.push({
          product: product._id,
          quantity: initialQty,
          selectedSpecs: specs,
          priceAtAdd: unitPrice,
        });
      }
    }

    await cart.save();
    const populated = await getPopulatedCart(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Guest cart merged successfully.',
      cart: populated,
    });
  } catch (error) {
    console.error('Sync/Merge cart error:', error);
    res.status(500).json({ success: false, message: 'Server error merging cart.' });
  }
};
