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
      const res = await axiosInstance.get(`/products/${productId}/reviews?${query}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching product reviews:', err);
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
};

export default productService;
