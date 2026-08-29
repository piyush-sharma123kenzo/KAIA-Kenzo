// KAIA Technologies Service logic
export const adminService = {
  get: async (params) => {
    console.log('Fetching via adminService...', params);
    return { success: true, data: [] };
  },
  save: async (payload) => {
    console.log('Saving via adminService...', payload);
    return { success: true };
  }
};
export default adminService;
