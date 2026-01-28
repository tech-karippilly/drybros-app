import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, Franchise } from '../../types/auth';
import { DUMMY_FRANCHISES, STORAGE_KEYS } from '../../constants/auth';

// Initialize state from localStorage if available (for page refresh)
const getInitialState = (): AuthState => {
    if (typeof window === 'undefined') {
        // Server-side: return default state
        return {
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLogin: false,
            isLoading: false,
            activeTab: 'home',
            franchiseList: DUMMY_FRANCHISES,
            selectedFranchise: DUMMY_FRANCHISES[0],
            refreshTrigger: 0,
        };
    }

    // Client-side: check localStorage for tokens
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    // If tokens exist, mark as authenticated (user data will be fetched separately if needed)
    const hasTokens = !!accessToken && !!refreshToken;

    return {
        user: null, // User data should be fetched from API if needed
        accessToken: accessToken,
        refreshToken: refreshToken,
        isAuthenticated: hasTokens,
        isLogin: hasTokens,
        isLoading: false,
        activeTab: 'home',
        franchiseList: DUMMY_FRANCHISES,
        selectedFranchise: DUMMY_FRANCHISES[0],
        refreshTrigger: 0,
    };
};

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
        setFranchiseList: (state, action: PayloadAction<Franchise[]>) => {
            state.franchiseList = action.payload;
            // Always set the first franchise as active when franchises are fetched
            // This replaces any dummy franchise that might be selected
            if (action.payload.length > 0) {
                state.selectedFranchise = action.payload[0];
            } else {
                // Clear selected franchise if no franchises exist
                state.selectedFranchise = null;
            }
        },
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
            
            // Save active tab to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, action.payload);
            }
        },
        triggerDashboardRefresh: (state) => {
            // Update refreshTrigger timestamp to trigger dashboard data refresh
            state.refreshTrigger = Date.now();
        },
    },
});

export const { setCredentials, logout, setLoading, setSelectedFranchise, setFranchiseList, setActiveTab, triggerDashboardRefresh } = authSlice.actions;
export default authSlice.reducer;
