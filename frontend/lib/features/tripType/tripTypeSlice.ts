import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
    getTripTypeListPaginated,
    createTripType as createTripTypeApi,
    updateTripType as updateTripTypeApi,
    deleteTripType as deleteTripTypeApi,
    TripTypeResponse,
    CreateTripTypeRequest,
    UpdateTripTypeRequest,
    TripTypePaginatedResponse,
} from './tripTypeApi';

export interface TripTypeState {
    list: TripTypeResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: TripTypeState = {
    list: [],
    pagination: null,
    isLoading: false,
    error: null,
};

// Async Thunks
export const fetchTripTypesPaginated = createAsyncThunk(
    'tripType/fetchTripTypesPaginated',
    async (
        { page = 1, limit = 10 }: { page?: number; limit?: number },
        { rejectWithValue }
    ) => {
        try {
            const response = await getTripTypeListPaginated(page, limit);
            return response;
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to fetch trip types';
            return rejectWithValue(errorMessage);
        }
    }
);

export const createTripType = createAsyncThunk(
    'tripType/createTripType',
    async (data: CreateTripTypeRequest, { rejectWithValue }) => {
        try {
            const response = await createTripTypeApi(data);
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to create trip type';
            return rejectWithValue(errorMessage);
        }
    }
);

export const updateTripType = createAsyncThunk(
    'tripType/updateTripType',
    async (
        { id, data }: { id: string; data: UpdateTripTypeRequest },
        { rejectWithValue }
    ) => {
        try {
            const response = await updateTripTypeApi(id, data);
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to update trip type';
            return rejectWithValue(errorMessage);
        }
    }
);

export const deleteTripType = createAsyncThunk(
    'tripType/deleteTripType',
    async (id: string, { rejectWithValue }) => {
        try {
            await deleteTripTypeApi(id);
            return id;
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to delete trip type';
            return rejectWithValue(errorMessage);
        }
    }
);

const tripTypeSlice = createSlice({
    name: 'tripType',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch Trip Types Paginated
        builder
            .addCase(fetchTripTypesPaginated.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchTripTypesPaginated.fulfilled, (state, action) => {
                state.isLoading = false;
                state.list = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchTripTypesPaginated.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Create Trip Type
        builder
            .addCase(createTripType.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createTripType.fulfilled, (state, action) => {
                state.isLoading = false;
                state.list.unshift(action.payload);
                if (state.pagination) {
                    state.pagination.total += 1;
                }
            })
            .addCase(createTripType.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Update Trip Type
        builder
            .addCase(updateTripType.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateTripType.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.list.findIndex((item) => item.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            })
            .addCase(updateTripType.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Delete Trip Type
        builder
            .addCase(deleteTripType.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteTripType.fulfilled, (state, action) => {
                state.isLoading = false;
                state.list = state.list.filter((item) => item.id !== action.payload);
                if (state.pagination) {
                    state.pagination.total = Math.max(0, state.pagination.total - 1);
                }
            })
            .addCase(deleteTripType.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = tripTypeSlice.actions;
export default tripTypeSlice.reducer;
