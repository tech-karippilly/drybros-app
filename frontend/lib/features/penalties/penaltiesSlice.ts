import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Penalty, CreatePenaltyInput, UpdatePenaltyInput, ApplyPenaltyInput, DriverPenalty, StaffPenalty } from '../../types/penalties';
import { PENALTIES_STRINGS } from '../../constants/penalties';
import { RootState } from '../../store';
import { 
    getPenalties, 
    createPenalty as createPenaltyApi, 
    updatePenalty as updatePenaltyApi, 
    deletePenalty as deletePenaltyApi,
    PenaltyResponse 
} from './penaltiesApi';

interface PenaltiesState {
    penalties: Penalty[];
    driverPenalties: DriverPenalty[];
    staffPenalties: StaffPenalty[];
    selectedPenalty: Penalty | null;
    isLoading: boolean;
    error: string | { message: string; code?: string; status?: number } | null;
}

const initialState: PenaltiesState = {
    penalties: [],
    driverPenalties: [],
    staffPenalties: [],
    selectedPenalty: null,
    isLoading: false,
    error: null,
};

// Helper function to convert API response to Penalty type
const convertPenaltyResponse = (response: PenaltyResponse): Penalty => ({
    id: response.id, // Keep as string (UUID)
    name: response.name,
    amount: response.amount,
    description: response.description || undefined,
    type: response.type,
    isActive: response.isActive,
    createdAt: typeof response.createdAt === 'string' ? response.createdAt : response.createdAt.toISOString(),
    updatedAt: typeof response.updatedAt === 'string' ? response.updatedAt : response.updatedAt.toISOString(),
});

// Async thunks - Using real API
export const fetchPenalties = createAsyncThunk(
    'penalties/fetchPenalties',
    async (params?: { isActive?: boolean; type?: 'PENALTY' | 'DEDUCTION' }, { rejectWithValue }) => {
        try {
            const response = await getPenalties(params);
            const penalties = Array.isArray(response.data) ? response.data : [];
            return penalties.map(convertPenaltyResponse);
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.error || error?.message || PENALTIES_STRINGS.LOADING);
        }
    }
);

export const createPenalty = createAsyncThunk(
    'penalties/createPenalty',
    async (input: CreatePenaltyInput, { rejectWithValue }) => {
        try {
            const response = await createPenaltyApi({
                name: input.name,
                amount: input.amount,
                description: input.description,
                type: input.type,
                isActive: input.type !== undefined ? undefined : true,
            });
            return convertPenaltyResponse(response.data);
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.error || error?.message || PENALTIES_STRINGS.CREATE_ERROR,
                code: 'UNKNOWN_ERROR',
            });
        }
    }
);

export const updatePenalty = createAsyncThunk(
    'penalties/updatePenalty',
    async (input: UpdatePenaltyInput, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const existingPenalty = state.penalties.penalties.find(p => 
                p.id === input.id || p.id.toString() === input.id.toString()
            );
            
            if (!existingPenalty) {
                return rejectWithValue({
                    message: 'Penalty not found',
                    code: 'NOT_FOUND',
                });
            }
            
            const penaltyId = existingPenalty.id.toString();
            
            const response = await updatePenaltyApi(penaltyId, {
                name: input.name,
                amount: input.amount,
                description: input.description || null,
                type: input.type,
            });
            return convertPenaltyResponse(response.data);
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.error || error?.message || PENALTIES_STRINGS.UPDATE_ERROR,
                code: 'UNKNOWN_ERROR',
            });
        }
    }
);

export const deletePenalty = createAsyncThunk(
    'penalties/deletePenalty',
    async (id: number | string, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const penalty = state.penalties.penalties.find(p => 
                p.id === id || p.id.toString() === id.toString()
            );
            
            if (!penalty) {
                return rejectWithValue('Penalty not found');
            }
            
            const penaltyId = penalty.id.toString();
            await deletePenaltyApi(penaltyId);
            return penalty.id;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data?.error || error?.message || PENALTIES_STRINGS.DELETE_ERROR);
        }
    }
);

export const applyPenaltyToDriver = createAsyncThunk(
    'penalties/applyPenalty',
    async (input: ApplyPenaltyInput, { getState, rejectWithValue }) => {
        try {
            await delay(500); // Simulate API delay
            
            const state = getState() as RootState;
            const penalty = state.penalties.penalties.find(p => p.id === input.penaltyId);
            
            if (!penalty) {
                return rejectWithValue({
                    message: 'Penalty not found',
                    code: 'NOT_FOUND',
                });
            }
            
            if (input.targetType === 'DRIVER') {
                if (!input.driverId) {
                    return rejectWithValue({
                        message: 'Driver ID is required',
                        code: 'VALIDATION_ERROR',
                    });
                }
                
                // Create dummy driver penalty record
                const driverPenalty: DriverPenalty = {
                    id: Date.now(),
                    penaltyId: input.penaltyId,
                    penalty: penalty,
                    driverId: input.driverId,
                    driver: {
                        id: input.driverId,
                        firstName: 'Driver',
                        lastName: `#${input.driverId}`,
                        phone: '0000000000',
                    },
                    reason: input.reason,
                    amount: input.amount || penalty.amount,
                    appliedAt: new Date().toISOString(),
                    appliedBy: 1, // Dummy user ID
                };
                
                return { type: 'DRIVER', data: driverPenalty };
            } else {
                if (!input.staffId) {
                    return rejectWithValue({
                        message: 'Staff ID is required',
                        code: 'VALIDATION_ERROR',
                    });
                }
                
                // Get staff from Redux store
                const staff = state.staff?.list?.find((s) => s._id === input.staffId);
                
                if (!staff) {
                    return rejectWithValue({
                        message: 'Staff not found',
                        code: 'NOT_FOUND',
                    });
                }
                
                // Create dummy staff penalty record
                const staffPenalty: StaffPenalty = {
                    id: Date.now(),
                    penaltyId: input.penaltyId,
                    penalty: penalty,
                    staffId: input.staffId,
                    staff: {
                        _id: staff._id,
                        name: staff.name,
                        email: staff.email,
                        phone: staff.phone,
                    },
                    reason: input.reason,
                    amount: input.amount || penalty.amount,
                    appliedAt: new Date().toISOString(),
                    appliedBy: 1, // Dummy user ID
                };
                
                return { type: 'STAFF', data: staffPenalty };
            }
        } catch (error: any) {
            return rejectWithValue({
                message: error?.message || PENALTIES_STRINGS.APPLY_ERROR,
                code: 'UNKNOWN_ERROR',
            });
        }
    }
);

export const fetchDriverPenalties = createAsyncThunk(
    'penalties/fetchDriverPenalties',
    async (driverId: number, { rejectWithValue }) => {
        try {
            await delay(500); // Simulate API delay
            // Return empty array for now (no driver penalties in dummy data)
            return [];
        } catch (error: any) {
            return rejectWithValue(error?.message || 'Failed to fetch driver penalties');
        }
    }
);

const penaltiesSlice = createSlice({
    name: 'penalties',
    initialState,
    reducers: {
        setSelectedPenalty: (state, action: PayloadAction<Penalty | null>) => {
            state.selectedPenalty = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch penalties
        builder
            .addCase(fetchPenalties.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchPenalties.fulfilled, (state, action) => {
                state.isLoading = false;
                state.penalties = action.payload;
            })
            .addCase(fetchPenalties.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Create penalty
        builder
            .addCase(createPenalty.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createPenalty.fulfilled, (state, action) => {
                state.isLoading = false;
                state.penalties.push(action.payload);
            })
            .addCase(createPenalty.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as any;
            });

        // Update penalty
        builder
            .addCase(updatePenalty.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updatePenalty.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.penalties.findIndex((p) => 
                    p.id === action.payload.id || p.id.toString() === action.payload.id.toString()
                );
                if (index !== -1) {
                    state.penalties[index] = action.payload;
                }
                if (state.selectedPenalty && (
                    state.selectedPenalty.id === action.payload.id || 
                    state.selectedPenalty.id.toString() === action.payload.id.toString()
                )) {
                    state.selectedPenalty = action.payload;
                }
            })
            .addCase(updatePenalty.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as any;
            });

        // Delete penalty
        builder
            .addCase(deletePenalty.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deletePenalty.fulfilled, (state, action) => {
                state.isLoading = false;
                state.penalties = state.penalties.filter((p) => 
                    p.id !== action.payload && p.id.toString() !== action.payload.toString()
                );
                if (state.selectedPenalty && (
                    state.selectedPenalty.id === action.payload || 
                    state.selectedPenalty.id.toString() === action.payload.toString()
                )) {
                    state.selectedPenalty = null;
                }
            })
            .addCase(deletePenalty.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Apply penalty to driver or staff
        builder
            .addCase(applyPenaltyToDriver.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(applyPenaltyToDriver.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload.type === 'DRIVER') {
                    state.driverPenalties.push(action.payload.data as DriverPenalty);
                } else {
                    state.staffPenalties.push(action.payload.data as StaffPenalty);
                }
            })
            .addCase(applyPenaltyToDriver.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as any;
            });

        // Fetch driver penalties
        builder
            .addCase(fetchDriverPenalties.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDriverPenalties.fulfilled, (state, action) => {
                state.isLoading = false;
                state.driverPenalties = action.payload;
            })
            .addCase(fetchDriverPenalties.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSelectedPenalty, clearError } = penaltiesSlice.actions;
export default penaltiesSlice.reducer;
