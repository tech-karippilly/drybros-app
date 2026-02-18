import api from '@/lib/axios';

export const warningService = {
  // List & search
  getWarnings: (params?: any) => api.get('/warnings', { params }),
  
  // Warning details
  getWarningById: (id: string) => api.get(`/warnings/${id}`),
  
  // CRUD operations
  createWarning: (data: any) => api.post('/warnings', data),
  updateWarning: (id: string, data: any) => api.patch(`/warnings/${id}`, data),
  deleteWarning: (id: string) => api.delete(`/warnings/${id}`),
};
