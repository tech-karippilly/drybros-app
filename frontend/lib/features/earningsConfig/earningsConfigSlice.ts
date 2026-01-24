import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
    getEarningsConfig, 
    updateEarningsConfig as updateEarningsConfigApi,
    EarningsConfigResponse,
    UpdateEarningsConfigRequest 
} from './earningsConfigApi';

interface EarningsConfigState {
    config: EarningsConfigResponse | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: EarningsConfigState = {
    config: null,
    isLoading: false,
    error: null,
};

/**
 * Fetch earnings configuration
 */
export const fetchEarningsConfig = createAsyncThunk(
    'earningsConfig/fetchEarningsConfig',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getEarningsConfig();
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.error || error?.message || 'Failed to fetch earnings configuration'
            );
        }
    }
);

/**
 * Update earnings configuration
 */
export const updateEarningsConfig = createAsyncThunk(
    'earningsConfig/updateEarningsConfig',
    async (data: UpdateEarningsConfigRequest, { rejectWithValue }) => {
        try {
            const response = await updateEarningsConfigApi(data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.error || error?.message || 'Failed to update earnings configuration'
            );
        }
    }
);

const earningsConfigSlice = createSlice({
    name: 'earningsConfig',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch earnings config
        builder
            .addCase(fetchEarningsConfig.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchEarningsConfig.fulfilled, (state, action) => {
                state.isLoading = false;
                state.config = action.payload;
            })
            .addCase(fetchEarningsConfig.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Update earnings config
        builder
            .addCase(updateEarningsConfig.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateEarningsConfig.fulfilled, (state, action) => {
                state.isLoading = false;
                state.config = action.payload;
            })
            .addCase(updateEarningsConfig.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = earningsConfigSlice.actions;
export default earningsConfigSlice.reducer;
