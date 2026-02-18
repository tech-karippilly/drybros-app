import api from '@/lib/axios';

export const alertService = {
  // List & search
  getAlerts: (params?: any) => api.get('/alerts', { params }),
  
  // Alert details
  getAlertById: (id: string) => api.get(`/alerts/${id}`),
  
  // Mark as resolved
  resolveAlert: (id: string, data: any) => api.patch(`/alerts/${id}/resolve`, data),
};
