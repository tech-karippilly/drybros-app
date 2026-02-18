import api from '@/lib/axios';

export const tripOfferService = {
  // List & search
  getTripOffers: (params?: any) => api.get('/trip-offers', { params }),
  
  // Trip offer details
  getTripOfferById: (id: string) => api.get(`/trip-offers/${id}`),
  
  // CRUD operations
  createTripOffer: (data: any) => api.post('/trip-offers', data),
  acceptTripOffer: (id: string, data: any) => api.post(`/trip-offers/${id}/accept`, data),
  rejectTripOffer: (id: string, data: any) => api.post(`/trip-offers/${id}/reject`, data),
};
