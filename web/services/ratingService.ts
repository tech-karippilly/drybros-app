import api from '@/lib/axios';

export const ratingService = {
  // List & search
  getRatings: (params?: any) => api.get('/ratings', { params }),
  
  // Rating details
  getRatingById: (id: string) => api.get(`/ratings/${id}`),
  
  // Driver ratings
  getDriverRatings: (driverId: string, params?: any) => 
    api.get(`/ratings/driver/${driverId}`, { params }),
  
  // CRUD operations
  createRating: (data: any) => api.post('/ratings', data),
};
