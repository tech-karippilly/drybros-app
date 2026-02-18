import api from '@/lib/axios';

export const staffService = {
  // List & search
  getStaffList: (params?: any) => api.get('/staff', { params }),
  
  // Staff details
  getStaffById: (id: string) => api.get(`/staff/${id}`),
  getStaffHistory: (id: string) => api.get(`/staff/${id}/history`),
  
  // CRUD operations
  createStaff: (data: any) => api.post('/staff', data),
  updateStaff: (id: string, data: any) => api.patch(`/staff/${id}`, data),
  updateStaffStatus: (id: string, data: any) => api.patch(`/staff/${id}/status`, data),
  deleteStaff: (id: string) => api.delete(`/staff/${id}`),
};
