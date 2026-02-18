import api from '@/lib/axios';

export const deductionService = {
  // List & search
  getDeductions: (params?: any) => api.get('/deductions', { params }),
  
  // Deduction details
  getDeductionById: (id: string) => api.get(`/deductions/${id}`),
  
  // CRUD operations
  createDeduction: (data: any) => api.post('/deductions', data),
  updateDeduction: (id: string, data: any) => api.patch(`/deductions/${id}`, data),
  deleteDeduction: (id: string) => api.delete(`/deductions/${id}`),
};
