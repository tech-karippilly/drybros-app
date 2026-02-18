import api from '@/lib/axios';

export const roleService = {
  // List & search
  getRoles: (params?: any) => api.get('/roles', { params }),
  
  // Role details
  getRoleById: (id: string) => api.get(`/roles/${id}`),
  
  // CRUD operations
  createRole: (data: any) => api.post('/roles', data),
  updateRole: (id: string, data: any) => api.patch(`/roles/${id}`, data),
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
};
