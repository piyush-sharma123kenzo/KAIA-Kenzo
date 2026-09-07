import axiosInstance from '../api/axiosInstance';

export const wishlistService = {
  // Fetch user wishlist
  getWishlist: async () => {
    try {
      const res = await axiosInstance.get('/wishlist');
      return res.data;
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      throw err;
    }
  },

  // Add product to wishlist
  addToWishlist: async (productId) => {
    try {
      const res = await axiosInstance.post('/wishlist/add', { productId });
      return res.data;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      throw err;
    }
  },

  // Toggle product in wishlist
  toggleWishlist: async (productId) => {
    try {
      const res = await axiosInstance.post('/wishlist/toggle', { productId });
      return res.data;
    } catch (err) {
      console.error('Error toggling wishlist item:', err);
      throw err;
    }
  },

  // Remove product from wishlist
  removeFromWishlist: async (productId) => {
    try {
      const res = await axiosInstance.delete(`/wishlist/${productId}`);
      return res.data;
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      throw err;
    }
  },

  // Move product to cart
  moveToCart: async (productId, quantity = 1, selectedSpecs = {}) => {
    try {
      const res = await axiosInstance.post(`/wishlist/${productId}/move-to-cart`, {
        quantity,
        selectedSpecs,
      });
      return res.data;
    } catch (err) {
      console.error('Error moving item to cart:', err);
      throw err;
    }
  },

  // Clear entire wishlist
  clearWishlist: async () => {
    try {
      const res = await axiosInstance.delete('/wishlist/clear');
      return res.data;
    } catch (err) {
      console.error('Error clearing wishlist:', err);
      throw err;
    }
  },
};

export default wishlistService;
