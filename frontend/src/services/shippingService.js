// KAIA Technologies Service logic
export const shippingService = {
  get: async (params) => {
    console.log('Fetching via shippingService...', params);
    return { success: true, data: [] };
  },
  save: async (payload) => {
    console.log('Saving via shippingService...', payload);
    return { success: true };
  }
};
export default shippingService;
