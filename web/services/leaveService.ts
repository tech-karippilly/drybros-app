import api from '@/lib/axios';

export const leaveService = {
  // List & search
  getLeaves: (params?: any) => api.get('/leaves', { params }),
  
  // Leave details
  getLeaveById: (id: string) => api.get(`/leaves/${id}`),
  
  // CRUD operations
  createLeave: (data: any) => api.post('/leaves', data),
  updateLeave: (id: string, data: any) => api.patch(`/leaves/${id}`, data),
  updateLeaveStatus: (id: string, data: any) => api.patch(`/leaves/${id}/status`, data),
  deleteLeave: (id: string) => api.delete(`/leaves/${id}`),
};
