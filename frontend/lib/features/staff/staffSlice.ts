import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Staff, StaffState } from '@/lib/types/staff';
import * as staffApi from './staffApi';

const initialState: StaffState = {
    list: [],
    selectedStaff: null,
    isLoading: false,
    error: null,
    filters: {
        name: '',
        salary: '',
        status: 'all',
        email: '',
        phone: '',
        franchiseId: 'all'
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0
    }
};

// Helper function to map backend StaffResponse to frontend Staff
const mapBackendStaffToFrontend = (backendStaff: staffApi.StaffResponse): Staff => {
    const statistics = backendStaff.statistics;

    return {
        id: backendStaff.id,
        _id: backendStaff.id, // Legacy support
        name: backendStaff.name,
        email: backendStaff.email,
        phone: backendStaff.phone,
        profilePic: backendStaff.profilePic,
        franchiseId: backendStaff.franchiseId,
        monthlySalary: backendStaff.monthlySalary,
        salary: backendStaff.monthlySalary, // Legacy support
        address: backendStaff.address,
        emergencyContact: backendStaff.emergencyContact,
        emergencyContactRelation: backendStaff.emergencyContactRelation,
        relationship: backendStaff.emergencyContactRelation, // Legacy support
        govtId: backendStaff.govtId,
        addressProof: backendStaff.addressProof,
        certificates: backendStaff.certificates,
        previousExperienceCert: backendStaff.previousExperienceCert,
        documentsCollected: [
            backendStaff.govtId ? 'Identity' : '',
            backendStaff.certificates ? 'Certificate' : '',
            backendStaff.previousExperienceCert ? 'Experience' : '',
            backendStaff.addressProof ? 'Address' : '',
        ].filter(Boolean),
        status: backendStaff.status,
        suspendedUntil: backendStaff.suspendedUntil,
        joinDate: backendStaff.joinDate,
        relieveDate: backendStaff.relieveDate,
        relieveReason: backendStaff.relieveReason,
        isActive: backendStaff.isActive,
        createdAt: backendStaff.createdAt,
        updatedAt: backendStaff.updatedAt,
        franchise: backendStaff.franchise
            ? {
                  id: backendStaff.franchise.id,
                  code: backendStaff.franchise.code,
                  name: backendStaff.franchise.name,
              }
            : undefined,
        statistics: statistics
            ? {
                  totalCustomers: statistics.totalCustomers,
                  totalTripsAssigned: statistics.totalTripsAssigned,
                  totalWorkingDays: statistics.totalWorkingDays,
                  totalLeaves: statistics.totalLeaves,
                  totalComplaints: statistics.totalComplaints,
                  totalWarnings: statistics.totalWarnings,
              }
            : undefined,
        // Backward compatible synthetic stats for older UI pieces
        customersAttended: statistics?.totalCustomers,
        leaveTaken: statistics?.totalLeaves,
    };
};

// Async thunks for API calls
export const fetchStaffList = createAsyncThunk(
    'staff/fetchList',
    async (pagination?: { page?: number; limit?: number }) => {
        const response = await staffApi.getStaffList(pagination);
        if ('pagination' in response) {
            // Paginated response
            return {
                staff: response.data.map(mapBackendStaffToFrontend),
                pagination: response.pagination,
            };
        } else {
            // Simple list response
            return {
                staff: response.map(mapBackendStaffToFrontend),
                pagination: null,
            };
        }
    }
);

export const fetchStaffById = createAsyncThunk(
    'staff/fetchById',
    async (id: string) => {
        const response = await staffApi.getStaffById(id);
        return mapBackendStaffToFrontend(response);
    }
);

export const createStaffMember = createAsyncThunk(
    'staff/create',
    async (data: staffApi.CreateStaffRequest) => {
        const response = await staffApi.createStaff(data);
        return mapBackendStaffToFrontend(response.data);
    }
);

export const updateStaffMember = createAsyncThunk(
    'staff/update',
    async ({ id, data }: { id: string; data: staffApi.UpdateStaffRequest }) => {
        const response = await staffApi.updateStaff(id, data);
        return mapBackendStaffToFrontend(response.data);
    }
);

export const updateStaffMemberStatus = createAsyncThunk(
    'staff/updateStatus',
    async ({ id, data }: { id: string; data: staffApi.UpdateStaffStatusRequest }) => {
        const response = await staffApi.updateStaffStatus(id, data);
        return mapBackendStaffToFrontend(response.data);
    }
);

export const deleteStaffMember = createAsyncThunk(
    'staff/delete',
    async (id: string) => {
        await staffApi.deleteStaff(id);
        return id;
    }
);

export const fetchStaffHistory = createAsyncThunk(
    'staff/fetchHistory',
    async (id: string) => {
        const response = await staffApi.getStaffHistory(id);
        return response.data;
    }
);

const staffSlice = createSlice({
    name: 'staff',
    initialState,
    reducers: {
        setStaffList: (state, action: PayloadAction<Staff[]>) => {
            state.list = action.payload;
            state.pagination.totalItems = action.payload.length;
        },
        setSelectedStaff: (state, action: PayloadAction<Staff | null>) => {
            state.selectedStaff = action.payload;
        },
        setStaffFilters: (state, action: PayloadAction<Partial<StaffState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
            state.pagination.currentPage = 1;
        },
        setStaffPage: (state, action: PayloadAction<number>) => {
            state.pagination.currentPage = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch staff list
        builder
            .addCase(fetchStaffList.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchStaffList.fulfilled, (state, action) => {
                state.isLoading = false;
                state.list = action.payload.staff;
                if (action.payload.pagination) {
                    state.pagination = {
                        currentPage: action.payload.pagination.page,
                        itemsPerPage: action.payload.pagination.limit,
                        totalItems: action.payload.pagination.total,
                    };
                } else {
                    state.pagination.totalItems = action.payload.staff.length;
                }
            })
            .addCase(fetchStaffList.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch staff list';
            });

        // Fetch staff by ID
        builder
            .addCase(fetchStaffById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchStaffById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedStaff = action.payload;
                // Update in list if exists
                const index = state.list.findIndex((s) => s.id === action.payload.id || s._id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            })
            .addCase(fetchStaffById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch staff member';
            });

        // Create staff
        builder
            .addCase(createStaffMember.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createStaffMember.fulfilled, (state, action) => {
                state.isLoading = false;
                state.list.push(action.payload);
                state.pagination.totalItems += 1;
            })
            .addCase(createStaffMember.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to create staff member';
            });

        // Update staff
        builder
            .addCase(updateStaffMember.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateStaffMember.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.list.findIndex((s) => s.id === action.payload.id || s._id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
                if (state.selectedStaff?.id === action.payload.id || state.selectedStaff?._id === action.payload.id) {
                    state.selectedStaff = action.payload;
                }
            })
            .addCase(updateStaffMember.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to update staff member';
            });

        // Update staff status
        builder
            .addCase(updateStaffMemberStatus.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateStaffMemberStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.list.findIndex((s) => s.id === action.payload.id || s._id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
                if (state.selectedStaff?.id === action.payload.id || state.selectedStaff?._id === action.payload.id) {
                    state.selectedStaff = action.payload;
                }
            })
            .addCase(updateStaffMemberStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to update staff status';
            });

        // Delete staff
        builder
            .addCase(deleteStaffMember.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteStaffMember.fulfilled, (state, action) => {
                state.isLoading = false;
                state.list = state.list.filter((s) => s.id !== action.payload && s._id !== action.payload);
                state.pagination.totalItems -= 1;
                if (state.selectedStaff?.id === action.payload || state.selectedStaff?._id === action.payload) {
                    state.selectedStaff = null;
                }
            })
            .addCase(deleteStaffMember.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to delete staff member';
            });
    },
});

export const {
    setStaffList,
    setSelectedStaff,
    setStaffFilters,
    setStaffPage,
    clearError,
} = staffSlice.actions;

export default staffSlice.reducer;
