import api from '@/lib/axios';

export const versionService = {
  // Get app version
  getVersion: () => api.get('/version'),
};
