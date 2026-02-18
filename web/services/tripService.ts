import api from '@/lib/axios';

export const tripService = {
  // Create & list
  createTrip: (data: any) => api.post('/trips', data),
  getTrips: (params?: any) => api.get('/trips', { params }),
  getTripById: (id: string) => api.get(`/trips/${id}`),
  
  // Driver assignment
  assignDriver: (id: string, data: any) => api.post(`/trips/${id}/assign`, data),
  reassignDriver: (id: string, data: any) => api.post(`/trips/${id}/reassign`, data),
  
  // Trip management
  rescheduleTrip: (id: string, data: any) => api.post(`/trips/${id}/reschedule`, data),
  cancelTrip: (id: string, data: any) => api.post(`/trips/${id}/cancel`, data),
  
  // Driver actions
  startTrip: (id: string, data: any) => api.post(`/trips/${id}/start`, data),
  endTrip: (id: string, data: any) => api.post(`/trips/${id}/end`, data),
  collectPayment: (id: string, data: any) => api.post(`/trips/${id}/payment`, data),
};
