import api from '@/lib/axios';

export const customerService = {
  // List & search
  getCustomers: (params?: any) => api.get('/customers', { params }),
  
  // Customer details
  getCustomerById: (id: string) => api.get(`/customers/${id}`),
  
  // CRUD operations
  createCustomer: (data: any) => api.post('/customers', data),
  updateCustomer: (id: string, data: any) => api.patch(`/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/customers/${id}`),
};
