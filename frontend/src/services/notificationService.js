// KAIA Technologies Service logic
export const notificationService = {
  get: async (params) => {
    console.log('Fetching via notificationService...', params);
    return { success: true, data: [] };
  },
  save: async (payload) => {
    console.log('Saving via notificationService...', payload);
    return { success: true };
  }
};
export default notificationService;
