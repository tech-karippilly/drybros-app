import api from '@/lib/axios';
import type { PenaltyFormData, PenaltyListResponse, PenaltyResponse } from '@/lib/types/penalty';
import type { AxiosResponse } from 'axios';

export const penaltyService = {
  // List & search
  getPenalties: (params?: any): Promise<AxiosResponse<PenaltyListResponse>> => 
    api.get('/penalties', { params }),
  
  // Penalty details
  getPenaltyById: (id: string): Promise<AxiosResponse<PenaltyResponse>> => 
    api.get(`/penalties/${id}`),
  
  // CRUD operations
  createPenalty: (data: PenaltyFormData): Promise<AxiosResponse<PenaltyResponse>> => 
    api.post('/penalties', data),
  updatePenalty: (id: string, data: Partial<PenaltyFormData>): Promise<AxiosResponse<PenaltyResponse>> => 
    api.patch(`/penalties/${id}`, data),
  deletePenalty: (id: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => 
    api.delete(`/penalties/${id}`),
};
