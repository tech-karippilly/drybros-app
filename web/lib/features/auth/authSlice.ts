import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types/auth';
import { STORAGE_KEYS } from '../../constants/auth';

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
        };
    }

    // Client-side: check localStorage for tokens
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);

    let user = null;
    if (userStr) {
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            console.error('Failed to parse user from localStorage', e);
        }
    }
    
    // If tokens exist, mark as authenticated
    const hasTokens = !!accessToken && !!refreshToken;

    return {
        user: hasTokens ? user : null,
        accessToken: accessToken,
        refreshToken: refreshToken,
        isAuthenticated: hasTokens,
        isLogin: hasTokens,
        isLoading: false,
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
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload.user));
            }
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.isLogin = false;

            // Clear tokens from localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.USER);
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;

// Selector functions
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;

export default authSlice.reducer;
