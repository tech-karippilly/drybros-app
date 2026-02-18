import api from '@/lib/axios';
import type {
  DriverListResponse,
  DriverResponse,
  CreateDriverRequest,
  UpdateDriverRequest,
  UpdateDriverStatusRequest,
  DriverFilters,
} from '@/lib/types/driver';

export const driverService = {
  // Public
  login: (data: { driverCode: string; password: string }) => api.post('/drivers/login', data),

  // Driver profile & location
  getMyProfile: (params?: { year?: string; month?: string }) => api.get('/drivers/me/profile', { params }),
  updateMyLocation: (data: { lat: number; lng: number }) => api.post('/drivers/me/location', data),
  getLiveLocation: (params?: { franchiseId?: string }) => api.get('/drivers/live-location', { params }),

  // List & search
  getDrivers: (params?: DriverFilters) => api.get<DriverListResponse>('/drivers', { params }),
  getAvailableGreenDrivers: (params?: { franchiseId?: string }) => api.get('/drivers/available/green', { params }),
  getAvailableDrivers: (params?: { franchiseId?: string }) => api.get('/drivers/available', { params }),
  getDriversByFranchises: (params?: { franchiseIds?: string[]; franchiseId?: string }) =>
    api.get('/drivers/by-franchises', { params }),

  // Driver details
  getDriverById: (id: string) => api.get<DriverResponse>(`/drivers/${id}`),
  getDriverWithPerformance: (id: string) => api.get(`/drivers/${id}/with-performance`),
  getDriverPerformance: (id: string) => api.get(`/drivers/${id}/performance`),
  getDriverDailyStats: (id: string) => api.get(`/drivers/${id}/daily-stats`),
  getDriverMonthlyStats: (id: string) => api.get(`/drivers/${id}/monthly-stats`),
  getDriverSettlement: (id: string) => api.get(`/drivers/${id}/settlement`),
  getDriverDailyLimit: (id: string) => api.get(`/drivers/${id}/daily-limit`),

  // CRUD operations
  createDriver: (data: CreateDriverRequest) => api.post<DriverResponse>('/drivers', data),
  updateDriver: (id: string, data: UpdateDriverRequest) => api.patch<DriverResponse>(`/drivers/${id}`, data),
  updateDriverStatus: (id: string, data: UpdateDriverStatusRequest) =>
    api.patch<DriverResponse>(`/drivers/${id}/status`, data),
  deleteDriver: (id: string) => api.delete(`/drivers/${id}`),

  // Cash management
  submitCash: (id: string) => api.post(`/drivers/${id}/submit-cash`),
  submitCashForSettlement: (data: { driverId: string; settlementAmount: number }) =>
    api.post('/drivers/submit-cash-settlement', data),

  // Attendance - Clock in/out for drivers
  clockIn: (driverId: string) => api.post('/attendance/clock-in', { id: driverId }),
  clockOut: (driverId: string) => api.post('/attendance/clock-out', { id: driverId }),
  getAttendanceStatus: (driverId: string) => api.get(`/attendance/status/${driverId}`),
};
