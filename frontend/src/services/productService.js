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
  }
};

export default productService;
