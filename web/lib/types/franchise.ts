export interface Franchise {
  id: string;
  name: string;
  code?: string;
  city?: string;
  region: string;
  address: string;
  phone: string;
  email: string; // Maps to franchiseEmail in forms
  inchargeName: string;
  managerEmail: string;
  managerPhone: string;
  storeImage?: string;
  legalDocumentsCollected: boolean;
  status: 'ACTIVE' | 'BLOCKED' | 'TEMPORARILY_CLOSED';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Computed fields from API
  driverCount?: number;
  staffCount?: number;
  monthlyRevenue?: number;
}

export interface FranchiseListResponse {
  success: boolean;
  message: string;
  data: Franchise[]; // Array directly, not nested in 'franchises'
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface FranchiseResponse {
  success: boolean;
  message: string;
  data: Franchise;
}

export interface CreateFranchiseRequest {
  code: string;
  name: string;
  city: string;
  region?: string;
  address?: string;
  phone?: string;
  email?: string;
  inchargeName?: string;
  managerEmail?: string;
  managerPhone?: string;
  storeImage?: string;
  legalDocumentsCollected?: boolean;
}

export interface UpdateFranchiseRequest {
  name?: string;
  city?: string;
  region?: string;
  address?: string;
  phone?: string;
  email?: string;
  inchargeName?: string;
  managerEmail?: string;
  managerPhone?: string;
  storeImage?: string;
  legalDocumentsCollected?: boolean;
  isActive?: boolean;
}

export interface UpdateFranchiseStatusRequest {
  status: 'ACTIVE' | 'BLOCKED' | 'TEMPORARILY_CLOSED';
}

export interface FranchiseFilters {
  search?: string;
  status?: string;
  region?: string;
  page?: number;
  limit?: number;
}
