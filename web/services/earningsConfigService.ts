import api from '@/lib/axios';
import type {
  DriverEarningsConfig,
  EarningsConfigResponse,
  EarningsConfigFormData,
} from '@/lib/types/earningsConfig';

export const earningsConfigService = {
  // Get global earnings config
  getGlobalConfig: () => api.get<EarningsConfigResponse>('/config/driver-earnings'),

  // Get franchise-specific earnings config
  getFranchiseConfig: (franchiseId: string) =>
    api.get<EarningsConfigResponse>(`/config/driver-earnings/franchise/${franchiseId}`),

  // Get all franchise configs
  getAllFranchiseConfigs: () =>
    api.get<EarningsConfigResponse>('/config/driver-earnings/franchises'),

  // Update global earnings config
  updateGlobalConfig: (data: Partial<DriverEarningsConfig>) =>
    api.post<EarningsConfigResponse>('/config/driver-earnings', data),

  // Update franchise-specific earnings config
  updateFranchiseConfig: (franchiseId: string, data: Partial<DriverEarningsConfig>) =>
    api.post<EarningsConfigResponse>(`/config/driver-earnings/franchise/${franchiseId}`, data),

  // Get driver-specific earnings config
  getDriverConfig: (driverId: string) =>
    api.get<EarningsConfigResponse>(`/config/driver-earnings/driver/${driverId}`),

  // Update driver-specific earnings config
  updateDriverConfig: (driverId: string, data: Partial<DriverEarningsConfig>) =>
    api.post<EarningsConfigResponse>('/config/driver-earnings/drivers', {
      driverIds: [driverId],
      ...data,
    }),
};
