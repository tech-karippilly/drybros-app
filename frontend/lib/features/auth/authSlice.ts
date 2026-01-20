import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, Franchise } from '../../types/auth';
import { DUMMY_FRANCHISES, STORAGE_KEYS } from '../../constants/auth';

// Function to get initial state from localStorage
const getInitialState = (): AuthState => {
    let activeTab = 'home';
    
    // Try to restore active tab from localStorage
    if (typeof window !== 'undefined') {
        const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
        if (savedTab) {
            activeTab = savedTab;
        }
    }

    return {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLogin: false,
        isLoading: false,
        activeTab,
        franchiseList: DUMMY_FRANCHISES,
        selectedFranchise: DUMMY_FRANCHISES[0],
    };
};

// Default initial state (will be hydrated from localStorage on client)
const initialState: AuthState = getInitialState();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{
                user: User;
                accessToken: string;
                refreshToken: string;
            }>
        ) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
            state.isLogin = true;

            // Save tokens to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, action.payload.accessToken);
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, action.payload.refreshToken);
            }
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.isLogin = false;
            state.selectedFranchise = DUMMY_FRANCHISES[0];
            state.activeTab = 'home';

            // Clear tokens and active tab from localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setSelectedFranchise: (state, action: PayloadAction<Franchise>) => {
            state.selectedFranchise = action.payload;
        },
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
            
            // Save active tab to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, action.payload);
            }
        },
    },
});

export const { setCredentials, logout, setLoading, setSelectedFranchise, setActiveTab } = authSlice.actions;
export default authSlice.reducer;
