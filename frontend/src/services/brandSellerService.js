import axiosInstance from '../api/axiosInstance';

export const brandSellerService = {
  // 1. Dashboard Overview
  getDashboard: async () => {
    try {
      const res = await axiosInstance.get('/brand/dashboard');
      return res.data;
    } catch (err) {
      console.error('Error fetching seller dashboard metrics:', err);
      throw err;
    }
  },

  // 2. Product Management
  getProducts: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/brand/products?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand products:', err);
      throw err;
    }
  },

  getProductById: async (id) => {
    try {
      const res = await axiosInstance.get(`/brand/products/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand product by ID:', err);
      throw err;
    }
  },

  createProduct: async (productData) => {
    try {
      const res = await axiosInstance.post('/brand/products', productData);
      return res.data;
    } catch (err) {
      console.error('Error creating brand product:', err);
      throw err;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const res = await axiosInstance.patch(`/brand/products/${id}`, productData);
      return res.data;
    } catch (err) {
      console.error('Error updating brand product:', err);
      throw err;
    }
  },

  deleteProduct: async (id) => {
    try {
      const res = await axiosInstance.delete(`/brand/products/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error deleting brand product:', err);
      throw err;
    }
  },

  // 3. Real Database Inventory & Warehouse Depots
  getInventory: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/brand/inventory?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand inventory:', err);
      throw err;
    }
  },

  stockIn: async (data) => {
    try {
      const res = await axiosInstance.post('/brand/inventory/stock-in', data);
      return res.data;
    } catch (err) {
      console.error('Error in stock-in:', err);
      throw err;
    }
  },

  adjustStock: async (data) => {
    try {
      const res = await axiosInstance.post('/brand/inventory/adjust', data);
      return res.data;
    } catch (err) {
      console.error('Error in stock adjustment:', err);
      throw err;
    }
  },

  transferStock: async (data) => {
    try {
      const res = await axiosInstance.post('/brand/inventory/transfer', data);
      return res.data;
    } catch (err) {
      console.error('Error in stock transfer:', err);
      throw err;
    }
  },

  updateStock: async (productId, payload) => {
    try {
      const res = await axiosInstance.patch(`/brand/inventory/${productId}`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating stock:', err);
      throw err;
    }
  },

  addSerials: async (productId, serialNumbers) => {
    try {
      const res = await axiosInstance.post(`/brand/inventory/${productId}/serials`, { serialNumbers });
      return res.data;
    } catch (err) {
      console.error('Error adding serials:', err);
      throw err;
    }
  },

  // 4. Warehouse Depots Management
  getWarehouses: async () => {
    try {
      const res = await axiosInstance.get('/brand/warehouses');
      return res.data;
    } catch (err) {
      console.error('Error fetching brand warehouses:', err);
      throw err;
    }
  },

  createWarehouse: async (data) => {
    try {
      const res = await axiosInstance.post('/brand/warehouses', data);
      return res.data;
    } catch (err) {
      console.error('Error creating warehouse:', err);
      throw err;
    }
  },

  updateWarehouse: async (id, data) => {
    try {
      const res = await axiosInstance.patch(`/brand/warehouses/${id}`, data);
      return res.data;
    } catch (err) {
      console.error('Error updating warehouse:', err);
      throw err;
    }
  },

  // 5. Serial / IMEI Registry
  getSerials: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/brand/serials?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand serials:', err);
      throw err;
    }
  },

  createSerial: async (data) => {
    try {
      const res = await axiosInstance.post('/brand/serials', data);
      return res.data;
    } catch (err) {
      console.error('Error registering serial:', err);
      throw err;
    }
  },

  importSerials: async (rows) => {
    try {
      const res = await axiosInstance.post('/brand/serials/import', { rows });
      return res.data;
    } catch (err) {
      console.error('Error importing serials in bulk:', err);
      throw err;
    }
  },

  // 6. Fulfillment & Packing Station
  getFulfillmentQueue: async (status = 'all') => {
    try {
      const res = await axiosInstance.get(`/brand/fulfillment?status=${status}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching fulfillment queue:', err);
      throw err;
    }
  },

  assignOrderSerial: async (orderId, data) => {
    try {
      const res = await axiosInstance.post(`/brand/orders/${orderId}/assign-serial`, data);
      return res.data;
    } catch (err) {
      console.error('Error assigning serial to order:', err);
      throw err;
    }
  },

  packOrder: async (orderId, checklist) => {
    try {
      const res = await axiosInstance.post(`/brand/orders/${orderId}/pack`, { checklist });
      return res.data;
    } catch (err) {
      console.error('Error marking order packed:', err);
      throw err;
    }
  },

  // 7. Admin Central Inventory APIs
  getAdminInventory: async (params = {}) => {
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

  getAdminWarehouses: async () => {
    try {
      const res = await axiosInstance.get('/admin/warehouses');
      return res.data;
    } catch (err) {
      console.error('Error fetching admin warehouses:', err);
      throw err;
    }
  },

  getAdminSerials: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/serials?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin serials:', err);
      throw err;
    }
  },

  // 4. Order Management
  getOrders: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/brand/orders?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand orders:', err);
      throw err;
    }
  },

  getOrderById: async (id) => {
    try {
      const res = await axiosInstance.get(`/brand/orders/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand order by ID:', err);
      throw err;
    }
  },

  updateOrderStatus: async (id, payload) => {
    try {
      const res = await axiosInstance.patch(`/brand/orders/${id}/status`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  },

  // 5. Sales Analytics
  getSales: async (range = '30d') => {
    try {
      const res = await axiosInstance.get(`/brand/sales?range=${range}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching sales analytics:', err);
      throw err;
    }
  },

  // 6. Brand Profile
  getProfile: async () => {
    try {
      const res = await axiosInstance.get('/brand/profile');
      return res.data;
    } catch (err) {
      console.error('Error fetching brand profile:', err);
      throw err;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const res = await axiosInstance.patch('/brand/profile', profileData);
      return res.data;
    } catch (err) {
      console.error('Error updating brand profile:', err);
      throw err;
    }
  },

  // 8. Brand Invoices & Tax Documents
  getBrandInvoices: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/brand/invoices?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand invoices:', err);
      throw err;
    }
  },

  // 9. Admin Marketplace Invoices
  getAdminInvoices: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/invoices?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin invoices:', err);
      throw err;
    }
  },

  // 10. Returns, Replacements & RMA Inspections
  getReturns: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/brand/returns?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand returns:', err);
      throw err;
    }
  },

  getReturnById: async (id) => {
    try {
      const res = await axiosInstance.get(`/brand/returns/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching return by ID:', err);
      throw err;
    }
  },

  approveReturn: async (id, data = {}) => {
    try {
      const res = await axiosInstance.post(`/brand/returns/${id}/approve`, data);
      return res.data;
    } catch (err) {
      console.error('Error approving return:', err);
      throw err;
    }
  },

  rejectReturn: async (id, rejectionReason) => {
    try {
      const res = await axiosInstance.post(`/brand/returns/${id}/reject`, { rejectionReason });
      return res.data;
    } catch (err) {
      console.error('Error rejecting return:', err);
      throw err;
    }
  },

  markReturnReceived: async (id, warehouseId = null) => {
    try {
      const res = await axiosInstance.post(`/brand/returns/${id}/received`, { warehouseId });
      return res.data;
    } catch (err) {
      console.error('Error marking return received:', err);
      throw err;
    }
  },

  inspectReturn: async (id, payload) => {
    try {
      const res = await axiosInstance.post(`/brand/returns/${id}/inspect`, payload);
      return res.data;
    } catch (err) {
      console.error('Error submitting return inspection:', err);
      throw err;
    }
  },

  // 11. Admin Marketplace Returns
  getAdminReturns: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/returns?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin returns:', err);
      throw err;
    }
  },

  // 12. Financials: Earnings, Ledger & Settlements
  getEarnings: async () => {
    try {
      const res = await axiosInstance.get('/brand/earnings');
      return res.data;
    } catch (err) {
      console.error('Error fetching brand earnings:', err);
      throw err;
    }
  },

  getLedger: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/brand/ledger?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand ledger:', err);
      throw err;
    }
  },

  getSettlements: async () => {
    try {
      const res = await axiosInstance.get('/brand/settlements');
      return res.data;
    } catch (err) {
      console.error('Error fetching brand settlements:', err);
      throw err;
    }
  },

  getSettlementById: async (id) => {
    try {
      const res = await axiosInstance.get(`/brand/settlements/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching settlement details:', err);
      throw err;
    }
  },

  // 13. Admin Revenue & Commission Management
  getAdminRevenue: async () => {
    try {
      const res = await axiosInstance.get('/admin/revenue');
      return res.data;
    } catch (err) {
      console.error('Error fetching admin revenue:', err);
      throw err;
    }
  },

  getCommissionRules: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/commissions?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching commission rules:', err);
      throw err;
    }
  },

  createCommissionRule: async (data) => {
    try {
      const res = await axiosInstance.post('/admin/commissions', data);
      return res.data;
    } catch (err) {
      console.error('Error creating commission rule:', err);
      throw err;
    }
  },

  updateCommissionRule: async (id, data) => {
    try {
      const res = await axiosInstance.patch(`/admin/commissions/${id}`, data);
      return res.data;
    } catch (err) {
      console.error('Error updating commission rule:', err);
      throw err;
    }
  },

  getAdminSettlements: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/admin/settlements?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin settlements:', err);
      throw err;
    }
  },

  generateSettlements: async (brandId) => {
    try {
      const res = await axiosInstance.post('/admin/settlements/generate', { brandId });
      return res.data;
    } catch (err) {
      console.error('Error generating settlement:', err);
      throw err;
    }
  },

  approveSettlement: async (id) => {
    try {
      const res = await axiosInstance.post(`/admin/settlements/${id}/approve`);
      return res.data;
    } catch (err) {
      console.error('Error approving settlement:', err);
      throw err;
    }
  },

  processSettlement: async (id, paymentProvider = 'mock') => {
    try {
      const res = await axiosInstance.post(`/admin/settlements/${id}/process`, { paymentProvider });
      return res.data;
    } catch (err) {
      console.error('Error processing settlement:', err);
      throw err;
    }
  },

  createAdjustment: async (data) => {
    try {
      const res = await axiosInstance.post('/admin/adjustments', data);
      return res.data;
    } catch (err) {
      console.error('Error creating adjustment:', err);
      throw err;
    }
  },

  // 14. Admin Command Center Analytics & Management
  getAdminDashboard: async (timeRange = '30days') => {
    try {
      const res = await axiosInstance.get(`/admin/dashboard?timeRange=${timeRange}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      throw err;
    }
  },

  getAdminPayments: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, v);
      });
      const res = await axiosInstance.get(`/admin/payments?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin payments:', err);
      throw err;
    }
  },

  getAdminReviews: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, v);
      });
      const res = await axiosInstance.get(`/admin/reviews?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
      throw err;
    }
  },

  moderateReview: async (id, payload) => {
    try {
      const res = await axiosInstance.patch(`/admin/reviews/${id}/moderate`, payload);
      return res.data;
    } catch (err) {
      console.error('Error moderating review:', err);
      throw err;
    }
  },

  getAdminCoupons: async () => {
    try {
      const res = await axiosInstance.get('/admin/coupons');
      return res.data;
    } catch (err) {
      console.error('Error fetching coupons:', err);
      throw err;
    }
  },

  createAdminCoupon: async (payload) => {
    try {
      const res = await axiosInstance.post('/admin/coupons', payload);
      return res.data;
    } catch (err) {
      console.error('Error creating coupon:', err);
      throw err;
    }
  },

  updateAdminCoupon: async (id, payload) => {
    try {
      const res = await axiosInstance.patch(`/admin/coupons/${id}`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating coupon:', err);
      throw err;
    }
  },

  getAdminPromotions: async () => {
    try {
      const res = await axiosInstance.get('/admin/promotions');
      return res.data;
    } catch (err) {
      console.error('Error fetching promotions:', err);
      throw err;
    }
  },

  createAdminPromotion: async (payload) => {
    try {
      const res = await axiosInstance.post('/admin/promotions', payload);
      return res.data;
    } catch (err) {
      console.error('Error creating promotion:', err);
      throw err;
    }
  },

  updateAdminPromotion: async (id, payload) => {
    try {
      const res = await axiosInstance.patch(`/admin/promotions/${id}`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating promotion:', err);
      throw err;
    }
  },

  getAdminWebhooks: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, v);
      });
      const res = await axiosInstance.get(`/admin/webhooks?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching webhooks:', err);
      throw err;
    }
  },

  getSystemHealth: async () => {
    try {
      const res = await axiosInstance.get('/admin/system-health');
      return res.data;
    } catch (err) {
      console.error('Error fetching system health:', err);
      throw err;
    }
  },

  exportCsv: async (entity) => {
    try {
      const res = await axiosInstance.get(`/admin/export/${entity}`, { responseType: 'blob' });
      return res.data;
    } catch (err) {
      console.error('Error downloading CSV export:', err);
      throw err;
    }
  },
};

export default brandSellerService;
