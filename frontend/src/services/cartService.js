// KAIA Technologies Service logic
export const cartService = {
  get: async (params) => {
    console.log('Fetching via cartService...', params);
    return { success: true, data: [] };
  },
  save: async (payload) => {
    console.log('Saving via cartService...', payload);
    return { success: true };
  }
};
export default cartService;
