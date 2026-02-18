import api from '@/lib/axios';

export const authService = {
  // Register admin
  registerAdmin: (data: any) => api.post('/auth/register-admin', data),
  
  // Login
  login: (data: any) => api.post('/auth/login', data),
  loginDriver: (data: any) => api.post('/auth/login/driver', data),
  loginStaff: (data: any) => api.post('/auth/login/staff', data),
  
  // Password reset flow
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  verifyOTP: (data: any) => api.post('/auth/verify-otp', data),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  
  // Token management
  refreshToken: (data: any) => api.post('/auth/refresh-token', data),
  
  // Authenticated routes
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data: any) => api.post('/auth/change-password', data),
};
