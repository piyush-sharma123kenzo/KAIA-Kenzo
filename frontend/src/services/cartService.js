import axiosInstance from '../api/axiosInstance';

export const cartService = {
  // Fetch user cart
  getCart: async () => {
    try {
      const res = await axiosInstance.get('/cart');
      return res.data;
    } catch (err) {
      console.error('Error fetching cart:', err);
      throw err;
    }
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1, selectedSpecs = {}) => {
    try {
      const res = await axiosInstance.post('/cart/add', {
        productId,
        quantity,
        selectedSpecs,
      });
      return res.data;
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw err;
    }
  },

  // Update item quantity
  updateQuantity: async (productId, quantity, selectedSpecs = {}) => {
    try {
      const res = await axiosInstance.patch(`/cart/item/${productId}`, {
        quantity,
        selectedSpecs,
      });
      return res.data;
    } catch (err) {
      console.error('Error updating cart item quantity:', err);
      throw err;
    }
  },

  // Remove item from cart
  removeFromCart: async (productId, selectedSpecs = {}) => {
    try {
      const res = await axiosInstance.delete(`/cart/item/${productId}`, {
        data: { selectedSpecs },
      });
      return res.data;
    } catch (err) {
      console.error('Error removing cart item:', err);
      throw err;
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const res = await axiosInstance.delete('/cart/clear');
      return res.data;
    } catch (err) {
      console.error('Error clearing cart:', err);
      throw err;
    }
  },

  // Merge guest cart items into authenticated user cart
  mergeCart: async (items = []) => {
    try {
      const res = await axiosInstance.post('/cart/merge', { items });
      return res.data;
    } catch (err) {
      console.error('Error merging guest cart:', err);
      throw err;
    }
  },
};

export default cartService;
