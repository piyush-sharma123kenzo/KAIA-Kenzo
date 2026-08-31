import axiosInstance from '../api/axiosInstance';

export const orderService = {
  // 1. Get customer's orders with multi-brand split breakdown & pagination
  getMyOrders: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const res = await axiosInstance.get(`/orders?${query.toString()}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      throw err;
    }
  },

  // 2. Get single master order details by ID
  getOrderById: async (orderId) => {
    try {
      const res = await axiosInstance.get(`/orders/${orderId}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching order details:', err);
      throw err;
    }
  },

  // 3. Initiate checkout & create master order + seller orders
  initiateCheckout: async (payload) => {
    try {
      const res = await axiosInstance.post('/orders/checkout', payload);
      return res.data;
    } catch (err) {
      console.error('Error initiating checkout:', err);
      throw err;
    }
  },

  // 4. Cancel order before shipment
  cancelOrder: async (orderId, reason) => {
    try {
      const res = await axiosInstance.put(`/orders/${orderId}/cancel`, { reason });
      return res.data;
    } catch (err) {
      console.error('Error cancelling order:', err);
      throw err;
    }
  },

  // 5. Download Invoice URL helper
  getInvoiceUrl: (childOrderId) => {
    const baseUrl = axiosInstance.defaults.baseURL || 'http://localhost:5000/api';
    return `${baseUrl}/orders/${childOrderId}/invoice`;
  },

  // 6. Get all official brand invoices for a Master Order
  getOrderInvoices: async (orderId) => {
    try {
      const res = await axiosInstance.get(`/orders/${orderId}/invoices`);
      return res.data;
    } catch (err) {
      console.error('Error fetching order invoices:', err);
      throw err;
    }
  },

  // 7. Download Invoice PDF blob directly
  downloadInvoicePdf: async (invoiceId) => {
    try {
      const res = await axiosInstance.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });
      return res.data;
    } catch (err) {
      console.error('Error downloading invoice PDF:', err);
      throw err;
    }
  },

  // 8. Returns, Replacements & Reverse Logistics
  createReturn: async (payload) => {
    try {
      const res = await axiosInstance.post('/returns', payload);
      return res.data;
    } catch (err) {
      console.error('Error creating return request:', err);
      throw err;
    }
  },

  getMyReturns: async () => {
    try {
      const res = await axiosInstance.get('/returns/my-returns');
      return res.data;
    } catch (err) {
      console.error('Error fetching my returns:', err);
      throw err;
    }
  },

  getReturnById: async (id) => {
    try {
      const res = await axiosInstance.get(`/returns/${id}`);
      return res.data;
    } catch (err) {
      console.error('Error fetching return details:', err);
      throw err;
    }
  },

  cancelReturn: async (id) => {
    try {
      const res = await axiosInstance.put(`/returns/${id}/cancel`);
      return res.data;
    } catch (err) {
      console.error('Error cancelling return request:', err);
      throw err;
    }
  },
};

export default orderService;
