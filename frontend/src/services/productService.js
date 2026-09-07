import axiosInstance from '../api/axiosInstance';

export const productService = {
  getProducts: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/products?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching products via service:', err);
      throw err;
    }
  },

  getProductBySlug: async (slug) => {
    try {
      const res = await axiosInstance.get(`/products/${slug}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching product details via service:', err);
      throw err;
    }
  },

  getSearchSuggestions: async (query) => {
    try {
      const res = await axiosInstance.get(`/products/suggestions?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching autocomplete suggestions:', err);
      throw err;
    }
  },

  getFeaturedProducts: async (limit = 4) => {
    try {
      const res = await axiosInstance.get(`/products?featured=true&limit=${limit}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching featured products:', err);
      throw err;
    }
  },

  getNewArrivals: async (limit = 8) => {
    try {
      const res = await axiosInstance.get(`/products/collections/new-arrivals?limit=${limit}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching new arrivals:', err);
      throw err;
    }
  },

  getBestSellers: async (limit = 8) => {
    try {
      const res = await axiosInstance.get(`/products/collections/best-sellers?limit=${limit}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching best sellers:', err);
      throw err;
    }
  },

  getDeals: async (limit = 8) => {
    try {
      const res = await axiosInstance.get(`/products/collections/deals?limit=${limit}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching deals:', err);
      throw err;
    }
  },

  getRelatedProducts: async (slug) => {
    try {
      const res = await axiosInstance.get(`/products/${slug}/related`);
      return res.data;
    } catch (err) {
      console.error('Error fetching related products:', err);
      throw err;
    }
  },

  getProductReviews: async (productId, params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await axiosInstance.get(`/reviews/product/${productId}?${query}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching product reviews:', err);
      throw err;
    }
  },

  getReviewEligibility: async (productId) => {
    try {
      const res = await axiosInstance.get(`/reviews/product/${productId}/eligibility`);
      return res.data;
    } catch (err) {
      console.error('Error fetching review eligibility:', err);
      return { success: false, canReview: false, message: err.response?.data?.message || 'Error checking eligibility' };
    }
  },

  submitReview: async (reviewData) => {
    try {
      const res = await axiosInstance.post('/reviews', reviewData);
      return res.data;
    } catch (err) {
      console.error('Error submitting review:', err);
      throw err;
    }
  },

  deleteReview: async (reviewId) => {
    try {
      const res = await axiosInstance.delete(`/reviews/${reviewId}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting review:', err);
      throw err;
    }
  },

  checkPincodeServiceability: async (pincode) => {
    try {
      const res = await axiosInstance.post('/shipping/check-pincode', { pincode });
      return res.data;
    } catch (err) {
      return {
        success: false,
        serviceable: false,
        message: err.response?.data?.message || 'Error checking PIN code.',
      };
    }
  },

  updateStock: async (id, stockData) => {
    try {
      const payload = typeof stockData === 'object' ? stockData : { quantity: stockData };
      const res = await axiosInstance.patch(`/products/${id}/stock`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating stock via productService:', err);
      throw err;
    }
  },

  toggleStatus: async (id, statusData) => {
    try {
      const payload = typeof statusData === 'object' ? statusData : { isActive: statusData };
      const res = await axiosInstance.patch(`/products/${id}/status`, payload);
      return res.data;
    } catch (err) {
      console.error('Error toggling status via productService:', err);
      throw err;
    }
  },

  addImages: async (id, images) => {
    try {
      const payload = Array.isArray(images) ? { images } : { url: images };
      const res = await axiosInstance.post(`/products/${id}/images`, payload);
      return res.data;
    } catch (err) {
      console.error('Error adding images via productService:', err);
      throw err;
    }
  },

  deleteImage: async (id, imageId) => {
    try {
      const res = await axiosInstance.delete(`/products/${id}/images/${imageId}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting image via productService:', err);
      throw err;
    }
  },
};

export default productService;
