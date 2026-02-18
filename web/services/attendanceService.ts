import api from '@/lib/axios';

export const attendanceService = {
  // Clock in/out
  clockIn: (data: any) => api.post('/attendance/clock-in', data),
  clockOut: (data: any) => api.post('/attendance/clock-out', data),
  
  // Monitor & status
  getMonitorData: () => api.get('/attendance/monitor'),
  getAttendanceStatus: (id: string) => api.get(`/attendance/status/${id}`),
  
  // List by role
  getAllAttendances: (params?: any) => api.get('/attendance/all', { params }),
  getAdminAttendances: (params?: any) => api.get('/attendance/admins', { params }),
  getManagerAttendances: (params?: any) => api.get('/attendance/managers', { params }),
  getStaffAttendances: (params?: any) => api.get('/attendance/staff', { params }),
  getDriverAttendances: (params?: any) => api.get('/attendance/drivers', { params }),
  
  // List & search
  getAttendances: (params?: any) => api.get('/attendance', { params }),
  getAttendanceById: (id: string) => api.get(`/attendance/${id}`),
  
  // CRUD operations
  createAttendance: (data: any) => api.post('/attendance', data),
  updateAttendance: (id: string, data: any) => api.put(`/attendance/${id}`, data),
  deleteAttendance: (id: string) => api.delete(`/attendance/${id}`),
  updateAttendanceStatus: (id: string, data: any) => api.patch(`/attendance/${id}/status`, data),
};
