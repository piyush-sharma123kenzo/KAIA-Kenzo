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

  deleteProduct: async (id, hard = false) => {
    try {
      const res = await axiosInstance.delete(`/admin/products/${id}${hard ? '?hard=true' : ''}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  },

  updateProductStock: async (id, stockData) => {
    try {
      const payload = typeof stockData === 'object' ? stockData : { quantity: stockData };
      const res = await axiosInstance.patch(`/admin/products/${id}/stock`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating admin product stock:', err);
      throw err;
    }
  },

  toggleProductStatus: async (id, statusData) => {
    try {
      const payload = typeof statusData === 'object' ? statusData : { isActive: statusData };
      const res = await axiosInstance.patch(`/admin/products/${id}/status`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating admin product status:', err);
      throw err;
    }
  },

  approveProduct: async (id) => {
    try {
      const res = await axiosInstance.patch(`/admin/products/${id}/status`, {
        status: 'Approved',
        isActive: true,
      });
      return res.data;
    } catch (err) {
      console.error('Error approving product:', err);
      throw err;
    }
  },

  rejectProduct: async (id, reason = '') => {
    try {
      const res = await axiosInstance.patch(`/admin/products/${id}/status`, {
        status: 'Rejected',
        isActive: false,
        rejectionReason: reason,
      });
      return res.data;
    } catch (err) {
      console.error('Error rejecting product:', err);
      throw err;
    }
  },

  addProductImages: async (id, images) => {
    try {
      const payload = Array.isArray(images) ? { images } : { url: images };
      const res = await axiosInstance.post(`/admin/products/${id}/images`, payload);
      return res.data;
    } catch (err) {
      console.error('Error adding product images:', err);
      throw err;
    }
  },

  deleteProductImage: async (id, imageId) => {
    try {
      const res = await axiosInstance.delete(`/admin/products/${id}/images/${imageId}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting product image:', err);
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

  // 3. Users & Accounts Directory
  getUsers: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/users?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin users:', err);
      throw err;
    }
  },

  getUserStats: async () => {
    try {
      const res = await axiosInstance.get('/admin/users/stats');
      return res.data;
    } catch (err) {
      console.error('Error fetching admin user statistics:', err);
      throw err;
    }
  },

  getUserById: async (id) => {
    try {
      const res = await axiosInstance.get(`/admin/users/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching user details by ID:', err);
      throw err;
    }
  },

  updateUser: async (id, payload) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${id}`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating user by admin:', err);
      throw err;
    }
  },

  toggleUserStatus: async (id, statusOrIsActive) => {
    try {
      const payload = typeof statusOrIsActive === 'object'
        ? statusOrIsActive
        : typeof statusOrIsActive === 'boolean'
          ? { isActive: statusOrIsActive }
          : { status: statusOrIsActive };
      const res = await axiosInstance.patch(`/admin/users/${id}/status`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating user status:', err);
      throw err;
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const res = await axiosInstance.patch(`/admin/users/${id}/role`, { role });
      return res.data;
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err;
    }
  },

  deleteUser: async (id) => {
    try {
      const res = await axiosInstance.delete(`/admin/users/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting user account:', err);
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

  updateOrderStatus: async (id, statusOrPayload) => {
    try {
      const payload = typeof statusOrPayload === 'object' ? statusOrPayload : { orderStatus: statusOrPayload };
      const res = await axiosInstance.patch(`/admin/orders/${id}/status`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating admin order status:', err);
      throw err;
    }
  },

  // 3. System Dashboard & Operations
  getDashboardSummary: async (timeRange = '30days') => {
    try {
      const res = await axiosInstance.get(`/admin/dashboard?timeRange=${timeRange}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      throw err;
    }
  },

  getSettings: async () => {
    try {
      const res = await axiosInstance.get('/admin/settings');
      return res.data;
    } catch (err) {
      console.error('Error fetching admin settings:', err);
      throw err;
    }
  },

  updateSettings: async (payload) => {
    try {
      const res = await axiosInstance.put('/admin/settings', payload);
      return res.data;
    } catch (err) {
      console.error('Error updating admin settings:', err);
      throw err;
    }
  },

  // 4. Categories Management
  getCategories: async () => {
    try {
      const res = await axiosInstance.get('/admin/categories');
      return res.data;
    } catch (err) {
      console.error('Error fetching categories:', err);
      throw err;
    }
  },

  createCategory: async (payload) => {
    try {
      const res = await axiosInstance.post('/admin/categories', payload);
      return res.data;
    } catch (err) {
      console.error('Error creating category:', err);
      throw err;
    }
  },

  updateCategory: async (id, payload) => {
    try {
      const res = await axiosInstance.patch(`/admin/categories/${id}`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  },

  deleteCategory: async (id) => {
    try {
      const res = await axiosInstance.delete(`/admin/categories/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  },

  // 5. Brands Management
  createBrand: async (payload) => {
    try {
      const res = await axiosInstance.post('/admin/brands', payload);
      return res.data;
    } catch (err) {
      console.error('Error creating brand:', err);
      throw err;
    }
  },

  deleteBrand: async (id) => {
    try {
      const res = await axiosInstance.delete(`/admin/brands/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting brand:', err);
      throw err;
    }
  },

  // 6. Inventory & Payments
  getInventory: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/inventory?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin inventory:', err);
      throw err;
    }
  },

  getPayments: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/payments?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin payments:', err);
      throw err;
    }
  },

  // 7. Commissions Ledger & Audit Logs
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
