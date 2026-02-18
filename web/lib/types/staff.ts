export enum StaffStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  FIRED = "FIRED",
  BLOCKED = "BLOCKED",
}

export enum StaffRole {
  OFFICE_STAFF = "OFFICE_STAFF",
  STAFF = "STAFF",
}

export interface Staff {
  id: string;
  franchiseId: string;
  name: string;
  phone: string;
  email: string;
  monthlySalary: number;
  address: string | null;
  emergencyContact: string | null;
  emergencyContactRelation: string | null;
  profilePic: string | null;
  role?: StaffRole;
  status: StaffStatus;
  suspendedUntil: string | null;
  warningCount?: number;
  complaintCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  Franchise?: {
    id: string;
    name: string;
    code?: string;
  };
  franchise?: {
    id: string;
    name: string;
    code?: string;
    city?: string;
    region?: string;
  };
  // Performance summary
  attendanceSummary?: {
    totalDays: number;
    presentDays: number;
    attendancePercentage: number;
  };
}

export interface StaffListResponse {
  success: boolean;
  message: string;
  data: Staff[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface StaffResponse {
  success: boolean;
  message: string;
  data: Staff;
}

export interface CreateStaffRequest {
  franchiseId?: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  monthlySalary: number;
  address?: string;
  emergencyContact?: string;
  emergencyContactRelation?: string;
  role?: StaffRole;
  profilePic?: string;
}

export interface UpdateStaffRequest {
  name?: string;
  monthlySalary?: number;
  address?: string;
  emergencyContact?: string;
  emergencyContactRelation?: string;
  profilePic?: string;
}

export interface UpdateStaffStatusRequest {
  status: StaffStatus;
  suspendedUntil?: string;
}

export interface StaffFilters {
  search?: string;
  status?: string;
  franchiseId?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface StaffHistoryItem {
  id: string;
  staffId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdBy?: string;
  createdAt: string;
}

export interface StaffHistoryResponse {
  success: boolean;
  message: string;
  data: StaffHistoryItem[];
}
