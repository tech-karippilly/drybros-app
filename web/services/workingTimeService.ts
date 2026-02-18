import api from '@/lib/axios';

export type RoleType = 'DRIVER' | 'STAFF' | 'MANAGER';

export interface WorkingTimeConfig {
  id: string;
  franchiseId: string;
  roleType: RoleType;
  minimumWorkHours: number;
  lunchBreakMinutes: number;
  snackBreakMinutes: number;
  gracePeriodMinutes: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  Franchise?: {
    id: string;
    name: string;
    code: string;
  };
  User?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateWorkingTimeConfigInput {
  franchiseId: string;
  roleType: RoleType;
  minimumWorkHours?: number;
  lunchBreakMinutes?: number;
  snackBreakMinutes?: number;
  gracePeriodMinutes?: number;
  isActive?: boolean;
}

export interface UpdateWorkingTimeConfigInput {
  minimumWorkHours?: number;
  lunchBreakMinutes?: number;
  snackBreakMinutes?: number;
  gracePeriodMinutes?: number;
  isActive?: boolean;
}

export interface WorkingTimeConfigFilters {
  franchiseId?: string;
  roleType?: RoleType;
  isActive?: boolean;
}

export const workingTimeService = {
  // Get all working time configs
  getConfigs: (filters?: WorkingTimeConfigFilters) => 
    api.get('/working-time-config', { params: filters }),

  // Get config by ID
  getConfigById: (id: string) => 
    api.get(`/working-time-config/${id}`),

  // Get config by franchise and role
  getConfigByFranchiseAndRole: (franchiseId: string, roleType: RoleType) => 
    api.get(`/working-time-config/${franchiseId}/${roleType}`),

  // Create new config
  createConfig: (data: CreateWorkingTimeConfigInput) => 
    api.post('/working-time-config', data),

  // Update config
  updateConfig: (id: string, data: UpdateWorkingTimeConfigInput) => 
    api.put(`/working-time-config/${id}`, data),

  // Upsert config (create or update)
  upsertConfig: (data: CreateWorkingTimeConfigInput) => 
    api.post('/working-time-config/upsert', data),

  // Delete config
  deleteConfig: (id: string) => 
    api.delete(`/working-time-config/${id}`),
};
