import api from '@/lib/axios';

export const profileService = {
  // Get profile
  getProfile: () => api.get('/profile'),
  
  // Update profile
  updateProfile: (data: any) => api.patch('/profile', data),
  
  // Update avatar
  updateAvatar: (data: any) => api.patch('/profile/avatar', data),
};
