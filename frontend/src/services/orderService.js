// KAIA Technologies Service logic
export const orderService = {
  get: async (params) => {
    console.log('Fetching via orderService...', params);
    return { success: true, data: [] };
  },
  save: async (payload) => {
    console.log('Saving via orderService...', payload);
    return { success: true };
  }
};
export default orderService;
