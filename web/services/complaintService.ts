import api from '@/lib/axios';

export const complaintService = {
  // List & search
  getComplaints: (params?: any) => api.get('/complaints', { params }),
  
  // Complaint details
  getComplaintById: (id: string) => api.get(`/complaints/${id}`),
  
  // CRUD operations
  createComplaint: (data: any) => api.post('/complaints', data),
  updateComplaintStatus: (id: string, data: any) => api.patch(`/complaints/${id}/status`, data),
};
