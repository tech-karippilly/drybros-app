import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Penalty, CreatePenaltyInput, UpdatePenaltyInput, ApplyPenaltyInput, DriverPenalty, StaffPenalty } from '../../types/penalties';
import { PENALTIES_STRINGS } from '../../constants/penalties';
import { RootState } from '../../store';

// Dummy data
const DUMMY_PENALTIES: Penalty[] = [
    {
        id: 1,
        name: 'Late Arrival',
        amount: 500,
        description: 'Penalty for arriving late to pickup location',
        type: 'PENALTY',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 2,
        name: 'Customer Complaint',
        amount: 1000,
        description: 'Penalty for customer complaints about service quality',
        type: 'PENALTY',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 3,
        name: 'Vehicle Maintenance',
        amount: 300,
        description: 'Deduction for vehicle maintenance costs',
        type: 'DEDUCTION',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 4,
        name: 'No Show',
        amount: 750,
        description: 'Penalty for not showing up for assigned trip',
        type: 'PENALTY',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 5,
        name: 'Fuel Deduction',
        amount: 200,
        description: 'Standard fuel cost deduction',
        type: 'DEDUCTION',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface PenaltiesState {
    penalties: Penalty[];
    driverPenalties: DriverPenalty[];
    staffPenalties: StaffPenalty[];
    selectedPenalty: Penalty | null;
    isLoading: boolean;
    error: string | { message: string; code?: string; status?: number } | null;
}

const initialState: PenaltiesState = {
    penalties: DUMMY_PENALTIES,
    driverPenalties: [],
    staffPenalties: [],
    selectedPenalty: null,
    isLoading: false,
    error: null,
};

// Async thunks - Using dummy data for now
export const fetchPenalties = createAsyncThunk(
    'penalties/fetchPenalties',
    async (_, { rejectWithValue }) => {
        try {
            await delay(500); // Simulate API delay
            // Return dummy data
            return DUMMY_PENALTIES;
        } catch (error: any) {
            return rejectWithValue(error?.message || PENALTIES_STRINGS.LOADING);
        }
    }
);

export const createPenalty = createAsyncThunk(
    'penalties/createPenalty',
    async (input: CreatePenaltyInput, { rejectWithValue }) => {
        try {
            await delay(500); // Simulate API delay
            
            // Create new penalty with dummy data
            const newPenalty: Penalty = {
                id: Date.now(), // Use timestamp as ID
                name: input.name,
                amount: input.amount,
                description: input.description,
                type: input.type,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            return newPenalty;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.message || PENALTIES_STRINGS.CREATE_ERROR,
                code: 'UNKNOWN_ERROR',
            });
        }
    }
);

export const updatePenalty = createAsyncThunk(
    'penalties/updatePenalty',
    async (input: UpdatePenaltyInput, { rejectWithValue }) => {
        try {
            await delay(500); // Simulate API delay
            
            // Update penalty with dummy data
            const updatedPenalty: Penalty = {
                id: input.id,
                name: input.name,
                amount: input.amount,
                description: input.description,
                type: input.type,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            return updatedPenalty;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.message || PENALTIES_STRINGS.UPDATE_ERROR,
                code: 'UNKNOWN_ERROR',
            });
        }
    }
);

export const deletePenalty = createAsyncThunk(
    'penalties/deletePenalty',
    async (id: number, { rejectWithValue }) => {
        try {
            await delay(300); // Simulate API delay
            return id;
        } catch (error: any) {
            return rejectWithValue(error?.message || PENALTIES_STRINGS.DELETE_ERROR);
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
                const index = state.penalties.findIndex((p) => p.id === action.payload.id);
                if (index !== -1) {
                    state.penalties[index] = action.payload;
                }
                if (state.selectedPenalty?.id === action.payload.id) {
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
                state.penalties = state.penalties.filter((p) => p.id !== action.payload);
                if (state.selectedPenalty?.id === action.payload) {
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
