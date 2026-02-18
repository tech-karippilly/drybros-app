import api from '@/lib/axios';

export const distanceService = {
  // Calculate distance
  calculateDistance: (data: any) => api.post('/distance/calculate', data),
  
  // Get distance matrix
  getDistanceMatrix: (data: any) => api.post('/distance/matrix', data),
};
