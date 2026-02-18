import api from '@/lib/axios';

export const reviewService = {
  // List & search
  getReviews: (params?: any) => api.get('/reviews', { params }),
  
  // Review details
  getReviewById: (id: string) => api.get(`/reviews/${id}`),
  
  // CRUD operations
  createReview: (data: any) => api.post('/reviews', data),
};
