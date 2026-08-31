import axiosInstance from '../api/axiosInstance';

export const categoryService = {
  getCategories: async () => {
    try {
      const res = await axiosInstance.get('/categories');
      return res.data;
    } catch (err) {
      console.error('Error fetching categories via service:', err);
      throw err;
    }
  },

  getCategoryBySlug: async (slug) => {
    try {
      const res = await axiosInstance.get(`/categories/${slug}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching category details via service:', err);
      throw err;
    }
  },
};

export default categoryService;
