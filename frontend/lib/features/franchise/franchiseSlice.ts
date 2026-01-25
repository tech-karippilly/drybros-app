import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Franchise, FranchiseState } from '@/lib/types/franchise';
import {
    getFranchiseList,
    getFranchiseById as getFranchiseByIdApi,
    createFranchise as createFranchiseApi,
    FranchiseResponse,
    CreateFranchiseRequest,
} from './franchiseApi';

// Helper function to map backend FranchiseResponse to frontend Franchise
const mapBackendFranchiseToFrontend = (backendFranchise: FranchiseResponse): Franchise => {
    return {
        _id: backendFranchise.id,
        code: backendFranchise.code,
        name: backendFranchise.name,
        address: backendFranchise.address || '',
        location: backendFranchise.city || backendFranchise.region || '',
        email: '', // Not in backend DTO
        phone: backendFranchise.phone || '',
        staffCount: 0, // Will need to fetch from staff API or count
        driverCount: 0, // Will need to fetch from driver API or count
        image: backendFranchise.storeImage || undefined,
        description: '', // Not in backend DTO
        inchargeName: backendFranchise.inchargeName || '',
        staff: [], // Will need to fetch from staff API
        drivers: [], // Will need to fetch from driver API
        status: backendFranchise.isActive ? 'active' : 'blocked',
    };
};

// Async Thunks
export const fetchFranchises = createAsyncThunk(
    'franchise/fetchFranchises',
    async (_, { rejectWithValue }) => {
        try {
            const franchises = await getFranchiseList();
            return franchises.map(mapBackendFranchiseToFrontend);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to fetch franchises';
            return rejectWithValue(errorMessage);
        }
    }
);

export const fetchFranchiseById = createAsyncThunk(
    'franchise/fetchFranchiseById',
    async (id: string, { rejectWithValue }) => {
        try {
            const franchise = await getFranchiseByIdApi(id);
            return mapBackendFranchiseToFrontend(franchise);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to fetch franchise';
            return rejectWithValue(errorMessage);
        }
    }
);

export const createFranchise = createAsyncThunk(
    'franchise/createFranchise',
    async (data: CreateFranchiseRequest, { rejectWithValue }) => {
        try {
            const response = await createFranchiseApi(data);
            return mapBackendFranchiseToFrontend(response.data);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to create franchise';
            return rejectWithValue(errorMessage);
        }
    }
);

const initialState: FranchiseState = {
    list: [],
    selectedFranchise: null,
    isLoading: false,
    error: null,
};

const franchiseSlice = createSlice({
    name: 'franchise',
    initialState,
    reducers: {
        setFranchises: (state, action: PayloadAction<Franchise[]>) => {
            state.list = action.payload;
        },
        setSelectedFranchise: (state, action: PayloadAction<Franchise | null>) => {
            state.selectedFranchise = action.payload;
        },
        addFranchise: (state, action: PayloadAction<Franchise>) => {
            state.list.push(action.payload);
        },
        updateFranchise: (state, action: PayloadAction<Franchise>) => {
            const index = state.list.findIndex(f => f._id === action.payload._id);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
        },
        deleteFranchise: (state, action: PayloadAction<string>) => {
            state.list = state.list.filter(f => f._id !== action.payload);
        },
        toggleFranchiseStatus: (state, action: PayloadAction<string>) => {
            const index = state.list.findIndex(f => f._id === action.payload);
            if (index !== -1) {
                state.list[index].status = state.list[index].status === 'active' ? 'blocked' : 'active';
            }
        }
    },
    extraReducers: (builder) => {
        // Fetch Franchises
        builder
            .addCase(fetchFranchises.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchFranchises.fulfilled, (state, action) => {
                state.isLoading = false;
                state.list = action.payload;
            })
            .addCase(fetchFranchises.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Fetch Franchise By ID
        builder
            .addCase(fetchFranchiseById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchFranchiseById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedFranchise = action.payload;
                // Also update in list if exists
                const index = state.list.findIndex(f => f._id === action.payload._id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                } else {
                    state.list.push(action.payload);
                }
            })
            .addCase(fetchFranchiseById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Create Franchise
        builder
            .addCase(createFranchise.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createFranchise.fulfilled, (state, action) => {
                state.isLoading = false;
                state.list.push(action.payload);
            })
            .addCase(createFranchise.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    setFranchises,
    setSelectedFranchise,
    addFranchise,
    updateFranchise,
    deleteFranchise,
    toggleFranchiseStatus
} = franchiseSlice.actions;

export default franchiseSlice.reducer;
