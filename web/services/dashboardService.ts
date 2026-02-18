import api from '@/lib/axios';

export const dashboardService = {
  // Get dashboard data
  getDashboard: (params?: any) => api.get('/dashboard', { params }),
  getDashboardStats: (params?: any) => api.get('/dashboard/stats', { params }),
  
  // Manager-specific endpoints
  getManagerDashboard: (params?: any) => api.get('/dashboard/manager', { params }),
  getManagerStats: (params?: any) => api.get('/dashboard/manager/stats', { params }),
  getTodayAttendance: (params?: any) => api.get('/attendance/today', { params }),
  getWeeklyBookings: (params?: any) => api.get('/reports/bookings/weekly', { params }),
  getActiveFleet: (params?: any) => api.get('/drivers', { params: { ...params, status: 'ACTIVE' } }),
  getStaffAvailability: (params?: any) => api.get('/staff', { params: { ...params, includeAttendance: true } }),
  
  // Clock in/out
  clockIn: (data: any) => api.post('/attendance/clock-in', data),
  clockOut: (data: any) => api.post('/attendance/clock-out', data),
};
