import api from '@/lib/axios';

export const healthService = {
  // Health check
  getHealth: () => api.get('/health'),
  
  // Database health
  getDatabaseHealth: () => api.get('/health/database'),
};
