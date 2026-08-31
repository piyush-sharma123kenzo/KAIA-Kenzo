import axiosInstance from '../api/axiosInstance';

export const adminService = {
  // 1. Products Management (Full Admin CRUD)
  getProducts: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/products?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin products:', err);
      throw err;
    }
  },

  getProductById: async (id) => {
    try {
      const res = await axiosInstance.get(`/admin/products/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      throw err;
    }
  },

  createProduct: async (payload) => {
    try {
      const res = await axiosInstance.post('/admin/products', payload);
      return res.data;
    } catch (err) {
      console.error('Error creating admin product:', err);
      throw err;
    }
  },

  updateProduct: async (id, payload) => {
    try {
      const res = await axiosInstance.put(`/admin/products/${id}`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating admin product:', err);
      throw err;
    }
  },

  deleteProduct: async (id) => {
    try {
      const res = await axiosInstance.delete(`/admin/products/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  },

  // Image Upload helper (supports single or multi-file FormData)
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axiosInstance.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  },

  uploadMultipleImages: async (files) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });
      const res = await axiosInstance.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      console.error('Error uploading multiple images:', err);
      throw err;
    }
  },

  // 2. Orders Management (Master + Seller Orders tree)
  getOrders: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/orders?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      throw err;
    }
  },

  getOrderById: async (id) => {
    try {
      const res = await axiosInstance.get(`/admin/orders/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin order by ID:', err);
      throw err;
    }
  },

  // 3. Users & Accounts
  getUsers: async () => {
    try {
      const res = await axiosInstance.get('/admin/users');
      return res.data;
    } catch (err) {
      console.error('Error fetching admin users:', err);
      throw err;
    }
  },

  toggleUserStatus: async (id, status) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${id}/status`, { status });
      return res.data;
    } catch (err) {
      console.error('Error updating user status:', err);
      throw err;
    }
  },

  // 4. Brands Oversight
  getBrands: async () => {
    try {
      const res = await axiosInstance.get('/admin/brands');
      return res.data;
    } catch (err) {
      console.error('Error fetching admin brands:', err);
      throw err;
    }
  },

  verifyBrand: async (id, payload) => {
    try {
      const res = await axiosInstance.put(`/admin/brands/${id}/approve`, payload);
      return res.data;
    } catch (err) {
      console.error('Error approving brand:', err);
      throw err;
    }
  },

  // 5. Products Verification
  getPendingProducts: async () => {
    try {
      const res = await axiosInstance.get('/admin/products/pending');
      return res.data;
    } catch (err) {
      console.error('Error fetching pending products:', err);
      throw err;
    }
  },

  verifyProduct: async (id, payload) => {
    try {
      const res = await axiosInstance.put(`/admin/products/${id}/verify`, payload);
      return res.data;
    } catch (err) {
      console.error('Error verifying product:', err);
      throw err;
    }
  },

  // 6. Commissions Ledger & Audit Logs
  getCommissions: async () => {
    try {
      const res = await axiosInstance.get('/admin/commissions');
      return res.data;
    } catch (err) {
      console.error('Error fetching commissions:', err);
      throw err;
    }
  },

  getAuditLogs: async () => {
    try {
      const res = await axiosInstance.get('/admin/audit-logs');
      return res.data;
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      throw err;
    }
  },
};

export default adminService;
