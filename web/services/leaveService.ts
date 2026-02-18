import api from '@/lib/axios';

export const leaveService = {
  // List & search
  getLeaveRequests: (params?: any) => api.get('/leave-requests', { params }),
  
  // Leave details
  getLeaveRequestById: (id: string) => api.get(`/leave-requests/${id}`),
  
  // CRUD operations
  createLeaveRequest: (data: any) => api.post('/leave-requests', data),
  updateLeaveRequest: (id: string, data: any) => api.patch(`/leave-requests/${id}`, data),
  updateLeaveRequestStatus: (id: string, data: any) => api.patch(`/leave-requests/${id}/status`, data),
  deleteLeaveRequest: (id: string) => api.delete(`/leave-requests/${id}`),
};
