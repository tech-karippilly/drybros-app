/**
 * Staff API Module
 * 
 * All API calls use the axios instance with interceptors configured in '../../axios'
 * The interceptors automatically:
 * - Add Authorization header with Bearer token from localStorage
 * - Handle 401 errors by refreshing the access token
 * - Retry failed requests after token refresh
 * - Redirect to login if refresh token expires
 */
import api from '../../axios';

// API Endpoints
const STAFF_ENDPOINTS = {
    BASE: '/staff',
    BY_ID: (id: string) => `/staff/${id}`,
    STATUS: (id: string) => `/staff/${id}/status`,
    HISTORY: (id: string) => `/staff/${id}/history`,
} as const;

// Request DTOs (matching backend)
export interface CreateStaffRequest {
    name: string;
    email: string;
    phone: string;
    password: string;
    franchiseId: string;
    monthlySalary: number;
    address: string;
    emergencyContact: string;
    emergencyContactRelation: string;
    govtId?: boolean;
    addressProof?: boolean;
    certificates?: boolean;
    previousExperienceCert?: boolean;
    profilePic?: string | null;
    joinDate?: Date | string;
}

export interface UpdateStaffRequest {
    name?: string;
    email?: string;
    phone?: string;
    franchiseId?: string;
    monthlySalary?: number;
    address?: string;
    emergencyContact?: string;
    emergencyContactRelation?: string;
    govtId?: boolean;
    addressProof?: boolean;
    certificates?: boolean;
    previousExperienceCert?: boolean;
    profilePic?: string | null;
    relieveDate?: Date | string | null;
    relieveReason?: 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT' | 'CONTRACT_ENDED' | 'PERFORMANCE_ISSUES' | 'MISCONDUCT' | 'OTHER' | null;
    isActive?: boolean;
}

export interface UpdateStaffStatusRequest {
    status: 'FIRED' | 'SUSPENDED' | 'BLOCKED' | 'ACTIVE';
    suspendedUntil?: Date | string | null;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
}

// Response DTOs (matching backend)
export interface StaffResponse {
    id: string;
    name: string;
    email: string;
    phone: string;
    franchiseId: string;
    monthlySalary: number;
    address: string;
    emergencyContact: string;
    emergencyContactRelation: string;
    govtId: boolean;
    addressProof: boolean;
    certificates: boolean;
    previousExperienceCert: boolean;
    profilePic: string | null;
    status: 'ACTIVE' | 'FIRED' | 'SUSPENDED' | 'BLOCKED';
    suspendedUntil: Date | null;
    joinDate: Date;
    relieveDate: Date | null;
    relieveReason: 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT' | 'CONTRACT_ENDED' | 'PERFORMANCE_ISSUES' | 'MISCONDUCT' | 'OTHER' | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateStaffResponse {
    message: string;
    data: StaffResponse;
}

export interface StaffListResponse {
    data: StaffResponse[];
}

export interface PaginatedStaffResponse {
    data: StaffResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface StaffHistoryItem {
    id: string;
    staffId: string;
    action: string;
    description: string | null;
    changedBy: string | null;
    oldValue: string | null;
    newValue: string | null;
    createdAt: Date;
}

export interface StaffHistoryResponse {
    data: StaffHistoryItem[];
}

export interface StaffStatusResponse {
    message: string;
    data: StaffResponse;
}

export interface DeleteStaffResponse {
    message: string;
}

/**
 * Get list of staff members
 * Supports pagination via query parameters
 */
export async function getStaffList(
    pagination?: PaginationQuery
): Promise<StaffResponse[] | PaginatedStaffResponse> {
    const params = pagination
        ? {
              page: pagination.page?.toString() || '1',
              limit: pagination.limit?.toString() || '10',
          }
        : {};

    const response = await api.get<StaffListResponse | PaginatedStaffResponse>(
        STAFF_ENDPOINTS.BASE,
        { params }
    );

    // Backend returns { data: [...] } for simple list or { data: [...], pagination: {...} } for paginated
    // If pagination exists in response, return paginated response
    if ('pagination' in response.data) {
        return response.data as PaginatedStaffResponse;
    }

    // Otherwise return simple list (extract data array)
    return (response.data as StaffListResponse).data;
}

/**
 * Get staff member by ID
 */
export async function getStaffById(id: string): Promise<StaffResponse> {
    const response = await api.get<{ data: StaffResponse }>(STAFF_ENDPOINTS.BY_ID(id));
    return response.data.data;
}

/**
 * Create a new staff member
 */
export async function createStaff(data: CreateStaffRequest): Promise<CreateStaffResponse> {
    const response = await api.post<CreateStaffResponse>(STAFF_ENDPOINTS.BASE, data);
    return response.data;
}

/**
 * Update staff member
 */
export async function updateStaff(
    id: string,
    data: UpdateStaffRequest
): Promise<{ message: string; data: StaffResponse }> {
    const response = await api.patch<{ message: string; data: StaffResponse }>(
        STAFF_ENDPOINTS.BY_ID(id),
        data
    );
    return response.data;
}

/**
 * Update staff status (fire, suspend, block, activate)
 */
export async function updateStaffStatus(
    id: string,
    data: UpdateStaffStatusRequest
): Promise<StaffStatusResponse> {
    const response = await api.patch<StaffStatusResponse>(STAFF_ENDPOINTS.STATUS(id), data);
    return response.data;
}

/**
 * Delete staff member
 */
export async function deleteStaff(id: string): Promise<DeleteStaffResponse> {
    const response = await api.delete<DeleteStaffResponse>(STAFF_ENDPOINTS.BY_ID(id));
    return response.data;
}

/**
 * Get staff history/audit log
 */
export async function getStaffHistory(id: string): Promise<StaffHistoryResponse> {
    const response = await api.get<StaffHistoryResponse>(STAFF_ENDPOINTS.HISTORY(id));
    return response.data;
}
