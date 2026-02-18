export type PenaltyCategory = 'OPERATIONAL' | 'BEHAVIORAL' | 'FINANCIAL' | 'SAFETY';
export type PenaltySeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type PenaltyType = 'PENALTY' | 'DEDUCTION';

export interface Penalty {
  id: string;
  name: string;
  description?: string;
  amount: number;
  type: PenaltyType;
  category: PenaltyCategory;
  severity: PenaltySeverity;
  isActive: boolean;
  triggerType?: string;
  blockDriver?: boolean;
  notifyAdmin?: boolean;
  notifyManager?: boolean;
  notifyDriver?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PenaltyFormData {
  name: string;
  description?: string;
  amount: number;
  type?: PenaltyType;
  category: PenaltyCategory;
  severity: PenaltySeverity;
  isActive?: boolean;
}

export interface PenaltyResponse {
  success: boolean;
  message: string;
  data: Penalty;
}

export interface PenaltyListResponse {
  success: boolean;
  message: string;
  data: Penalty[];
}
