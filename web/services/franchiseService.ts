import api from '@/lib/axios';

export const franchiseService = {
  // List & search
  getFranchises: (params?: any) => api.get('/franchises', { params }),
  
  // Franchise details
  getFranchiseById: (id: string) => api.get(`/franchises/${id}`),
  getMyFranchise: () => api.get('/franchises/my'),
  
  // CRUD operations
  createFranchise: (data: any) => api.post('/franchises', data),
  updateFranchise: (id: string, data: any) => api.patch(`/franchises/${id}`, data),
  updateFranchiseStatus: (id: string, data: any) => api.patch(`/franchises/${id}/status`, data),
  deleteFranchise: (id: string) => api.delete(`/franchises/${id}`),
};
