// KAIA Technologies Service logic
export const brandService = {
  get: async (params) => {
    console.log('Fetching via brandService...', params);
    return { success: true, data: [] };
  },
  save: async (payload) => {
    console.log('Saving via brandService...', payload);
    return { success: true };
  }
};
export default brandService;
