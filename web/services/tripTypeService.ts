import api from '@/lib/axios';

export const tripTypeService = {
  // List & search
  getTripTypes: (params?: any) => api.get('/trip-types', { params }),
  
  // Trip type details
  getTripTypeById: (id: string) => api.get(`/trip-types/${id}`),
  
  // CRUD operations
  createTripType: (data: any) => api.post('/trip-types', data),
  updateTripType: (id: string, data: any) => api.patch(`/trip-types/${id}`, data),
  deleteTripType: (id: string) => api.delete(`/trip-types/${id}`),
};
