import api from '@/lib/axios';

export const notificationService = {
  // Get notifications
  getNotifications: (params?: any) => api.get('/notifications', { params }),
  
  // Mark as read
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};
