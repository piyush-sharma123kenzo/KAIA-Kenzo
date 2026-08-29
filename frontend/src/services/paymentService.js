// KAIA Technologies Service logic
export const paymentService = {
  get: async (params) => {
    console.log('Fetching via paymentService...', params);
    return { success: true, data: [] };
  },
  save: async (payload) => {
    console.log('Saving via paymentService...', payload);
    return { success: true };
  }
};
export default paymentService;
