import api from '@/lib/axios';

export const reportService = {
  // Reports
  getReports: (params?: any) => api.get('/reports', { params }),
  getReportById: (id: string) => api.get(`/reports/${id}`),
  generateReport: (data: any) => api.post('/reports', data),
  
  // Trip reports
  getTripReports: (params?: any) => api.get('/reports/trips', { params }),
  getDriverReports: (params?: any) => api.get('/reports/drivers', { params }),
  getEarningsReports: (params?: any) => api.get('/reports/earnings', { params }),
};
