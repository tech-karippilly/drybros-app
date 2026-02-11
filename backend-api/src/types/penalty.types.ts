import { PenaltyTriggerType, PenaltyCategory, PenaltySeverity, PenaltyType } from '@prisma/client';

// DTO for creating a new penalty
export interface CreatePenaltyDTO {
  name: string;
  description?: string;
  amount: number;
  type?: PenaltyType;
  isAutomatic?: boolean;
  triggerType?: PenaltyTriggerType;
  triggerConfig?: Record<string, any>;
  category?: PenaltyCategory;
  severity?: PenaltySeverity;
  notifyAdmin?: boolean;
  notifyManager?: boolean;
  notifyDriver?: boolean;
  blockDriver?: boolean;
}

// DTO for updating an existing penalty
export interface UpdatePenaltyDTO {
  name?: string;
  description?: string;
  amount?: number;
  type?: PenaltyType;
  isAutomatic?: boolean;
  triggerType?: PenaltyTriggerType;
  triggerConfig?: Record<string, any>;
  category?: PenaltyCategory;
  severity?: PenaltySeverity;
  notifyAdmin?: boolean;
  notifyManager?: boolean;
  notifyDriver?: boolean;
  blockDriver?: boolean;
  isActive?: boolean;
}

// Filters for listing penalties
export interface PenaltyFilters {
  category?: PenaltyCategory;
  severity?: PenaltySeverity;
  type?: PenaltyType;
  isActive?: boolean;
  isAutomatic?: boolean;
  triggerType?: PenaltyTriggerType;
  search?: string; // Search in name or description
}

// DTO for applying a deduction to a driver
export interface ApplyDeductionDTO {
  penaltyId: string;
  driverId: string;
  amount?: number; // Optional override of default amount
  reason?: string;
  tripId?: string; // Optional trip reference
  appliedBy: string; // User ID who is applying the deduction
}

// Response for penalty with additional info
export interface PenaltyResponse {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  type: PenaltyType;
  isActive: boolean;
  isAutomatic: boolean;
  triggerType: PenaltyTriggerType;
  triggerConfig: Record<string, any> | null;
  category: PenaltyCategory;
  severity: PenaltySeverity;
  notifyAdmin: boolean;
  notifyManager: boolean;
  notifyDriver: boolean;
  blockDriver: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Trigger config types
export interface LateReportTriggerConfig {
  delayMinutes: number; // e.g., 5
}

export interface ComplaintsTriggerConfig {
  complaintCount: number; // e.g., 3
}

// Email notification data
export interface PenaltyNotificationData {
  penalty: PenaltyResponse;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    driverCode: string;
    phone: string;
    email: string;
    franchiseId: string;
  };
  amount: number;
  reason?: string;
  timestamp: Date;
  appliedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  tripId?: string;
  complaints?: Array<{
    title: string;
    createdAt: Date;
    status: string;
  }>;
}

// Block driver request
export interface BlockDriverDTO {
  reason: string;
  blockedBy: string; // User ID
}

// Unblock driver request
export interface UnblockDriverDTO {
  reason: string;
  unblockedBy: string; // User ID
}
