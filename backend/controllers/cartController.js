import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Helper to fetch user cart populated with product info
const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name slug brand mrp sellingPrice images stock status',
    populate: { path: 'brand', select: 'name slug' },
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Filter out any deleted products or drafts that became unapproved
  const activeItems = cart.items.filter(
    (item) => item.product && item.product.status === 'Approved'
  );

  if (activeItems.length !== cart.items.length) {
    cart.items = activeItems;
    await cart.save();
  }

  return cart;
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getUserCart = async (req, res) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Get user cart error:', error);
    res.status(500).json({ message: 'Server error fetching cart.' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  const { productId, quantity, selectedSpecs } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product || product.status !== 'Approved') {
      return res.status(404).json({ message: 'Product not found or unavailable.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart with same specifications
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        JSON.stringify(item.selectedSpecs) === JSON.stringify(selectedSpecs || {})
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity || 1);
    } else {
      cart.items.push({
        product: productId,
        quantity: Number(quantity || 1),
        selectedSpecs: selectedSpecs || {},
      });
    }

    await cart.save();
    const populated = await getPopulatedCart(req.user._id);

    res.status(200).json({ success: true, cart: populated });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error adding to cart.' });
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res) => {
  const { productId, quantity, selectedSpecs } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        JSON.stringify(item.selectedSpecs) === JSON.stringify(selectedSpecs || {})
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = Number(quantity);
      await cart.save();
    } else {
      return res.status(404).json({ message: 'Item not found in cart.' });
    }

    const populated = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, cart: populated });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error updating quantity.' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Private
export const removeCartItem = async (req, res) => {
  const { productId, selectedSpecs } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          JSON.stringify(item.selectedSpecs) === JSON.stringify(selectedSpecs || {})
        )
    );

    await cart.save();
    const populated = await getPopulatedCart(req.user._id);

    res.status(200).json({ success: true, cart: populated });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ message: 'Server error removing item.' });
  }
};

// @desc    Sync guest cart with backend cart
// @route   POST /api/cart/sync
// @access  Private
export const syncCart = async (req, res) => {
  const { items } = req.body; // Array of guest cart items: [{ product: id, quantity, selectedSpecs }]

  try {
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid cart data.' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    for (let guestItem of items) {
      const product = await Product.findById(guestItem.product);
      if (!product || product.status !== 'Approved') continue;

      const existingIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === guestItem.product &&
          JSON.stringify(item.selectedSpecs) === JSON.stringify(guestItem.selectedSpecs || {})
      );

      if (existingIndex > -1) {
        // If guest cart quantity is greater or equal, update it or sum it up. Let's take the max of the two.
        cart.items[existingIndex].quantity = Math.max(cart.items[existingIndex].quantity, guestItem.quantity);
      } else {
        cart.items.push({
          product: guestItem.product,
          quantity: guestItem.quantity,
          selectedSpecs: guestItem.selectedSpecs || {},
        });
      }
    }

    await cart.save();
    const populated = await getPopulatedCart(req.user._id);

    res.status(200).json({ success: true, cart: populated });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({ message: 'Server error syncing cart.' });
  }
};
