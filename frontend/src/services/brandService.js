import axiosInstance from '../api/axiosInstance';

export const brandService = {
  getBrands: async () => {
    try {
      const res = await axiosInstance.get('/brands');
      return res.data;
    } catch (err) {
      console.error('Error fetching brands via service:', err);
      throw err;
    }
  },

  getBrandBySlug: async (slug) => {
    try {
      const res = await axiosInstance.get(`/brands/${slug}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand details via service:', err);
      throw err;
    }
  },

  getMyBrand: async () => {
    try {
      const res = await axiosInstance.get('/brands/my-brand');
      return res.data;
    } catch (err) {
      console.error('Error fetching my brand via service:', err);
      throw err;
    }
  },

  registerBrand: async (payload) => {
    try {
      const res = await axiosInstance.post('/brands/register', payload);
      return res.data;
    } catch (err) {
      console.error('Error registering brand profile:', err);
      throw err;
    }
  },
};

export default brandService;
