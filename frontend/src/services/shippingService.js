import axiosInstance from '../api/axiosInstance';

export const shippingService = {
  // 1. Brand Seller Shipping APIs
  getBrandShipments: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, v);
      });
      const res = await axiosInstance.get(`/brand/shipments?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand shipments:', err);
      throw err;
    }
  },

  getBrandShipmentById: async (id) => {
    try {
      const res = await axiosInstance.get(`/brand/shipments/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching brand shipment by ID:', err);
      throw err;
    }
  },

  createBrandShipment: async (payload) => {
    try {
      const res = await axiosInstance.post('/brand/shipments', payload);
      return res.data;
    } catch (err) {
      console.error('Error creating brand shipment:', err);
      throw err;
    }
  },

  generateBrandLabel: async (id) => {
    try {
      const res = await axiosInstance.post(`/brand/shipments/${id}/label`);
      return res.data;
    } catch (err) {
      console.error('Error generating shipping label:', err);
      throw err;
    }
  },

  scheduleBrandPickup: async (id, pickupDate) => {
    try {
      const res = await axiosInstance.post(`/brand/shipments/${id}/pickup`, { pickupDate });
      return res.data;
    } catch (err) {
      console.error('Error scheduling courier pickup:', err);
      throw err;
    }
  },

  updateBrandShipmentStatus: async (id, payload) => {
    try {
      const res = await axiosInstance.patch(`/brand/shipments/${id}/status`, payload);
      return res.data;
    } catch (err) {
      console.error('Error updating shipment status:', err);
      throw err;
    }
  },

  // 2. Admin Central Shipping APIs
  getAdminShipments: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, v);
      });
      const res = await axiosInstance.get(`/admin/shipments?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin shipments:', err);
      throw err;
    }
  },

  getAdminShipmentById: async (id) => {
    try {
      const res = await axiosInstance.get(`/admin/shipments/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching admin shipment detail:', err);
      throw err;
    }
  },

  // 3. Customer Tracking APIs
  getCustomerOrderShipments: async (orderId) => {
    try {
      const res = await axiosInstance.get(`/orders/${orderId}/shipments`);
      return res.data;
    } catch (err) {
      console.error('Error fetching customer order shipments:', err);
      throw err;
    }
  },

  getShipmentTracking: async (shipmentId) => {
    try {
      const res = await axiosInstance.get(`/shipping/${shipmentId}/tracking`);
      return res.data;
    } catch (err) {
      console.error('Error fetching tracking events:', err);
      throw err;
    }
  },

  // 4. Rate Calculation
  getShippingRates: async (payload) => {
    try {
      const res = await axiosInstance.post('/shipping/rates', payload);
      return res.data;
    } catch (err) {
      console.error('Error calculating shipping rates:', err);
      throw err;
    }
  },
};

export default shippingService;
