import api from '@/lib/axios';

export const driverTransactionService = {
  // List & search
  getTransactions: (params?: any) => api.get('/driver-transactions', { params }),
  
  // Transaction details
  getTransactionById: (id: string) => api.get(`/driver-transactions/${id}`),
  
  // Driver transactions by driver ID
  getDriverTransactions: (driverId: string, params?: any) => 
    api.get(`/driver-transactions/driver/${driverId}`, { params }),
  
  // CRUD operations
  createTransaction: (data: any) => api.post('/driver-transactions', data),
  updateTransaction: (id: string, data: any) => api.patch(`/driver-transactions/${id}`, data),
  deleteTransaction: (id: string) => api.delete(`/driver-transactions/${id}`),
};
