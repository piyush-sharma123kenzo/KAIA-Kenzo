import axiosInstance from '../api/axiosInstance';

const deliveryService = {
  /**
   * Public: Check delivery eligibility by PIN code or GPS coordinates
   * @param {Object} data - { pincode?: string, latitude?: number, longitude?: number }
   */
  checkDelivery: async (data) => {
    const res = await axiosInstance.post('/delivery/check', data);
    return res.data;
  },

  /**
   * Public: Fetch all active delivery centers
   */
  getActiveLocations: async () => {
    const res = await axiosInstance.get('/delivery/locations');
    return res.data;
  },

  /**
   * Admin: Fetch paginated delivery locations with filters
   * @param {Object} params - { page, limit, search, status }
   */
  getAdminLocations: async (params = {}) => {
    const res = await axiosInstance.get('/delivery/admin/locations', { params });
    return res.data;
  },

  /**
   * Admin: Fetch delivery analytics
   */
  getDeliveryAnalytics: async () => {
    const res = await axiosInstance.get('/delivery/admin/analytics');
    return res.data;
  },

  /**
   * Admin: Create a new serviceable location
   * @param {Object} data - { locationName, address, pincode, latitude, longitude, deliveryRadius, isActive, notes }
   */
  createLocation: async (data) => {
    const res = await axiosInstance.post('/delivery/admin/locations', data);
    return res.data;
  },

  /**
   * Admin: Update an existing serviceable location
   * @param {string} id
   * @param {Object} data
   */
  updateLocation: async (id, data) => {
    const res = await axiosInstance.put(`/delivery/admin/locations/${id}`, data);
    return res.data;
  },

  /**
   * Admin: Toggle active status
   * @param {string} id
   */
  toggleStatus: async (id) => {
    const res = await axiosInstance.patch(`/delivery/admin/locations/${id}/status`);
    return res.data;
  },

  /**
   * Admin: Delete a delivery location
   * @param {string} id
   */
  deleteLocation: async (id) => {
    const res = await axiosInstance.delete(`/delivery/admin/locations/${id}`);
    return res.data;
  },
};

export default deliveryService;
