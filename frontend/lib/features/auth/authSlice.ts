import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, Franchise } from '../../types/auth';
import { DUMMY_FRANCHISES } from '../../constants/auth';

const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLogin: false,
    isLoading: false,
    activeTab: 'home',
    franchiseList: DUMMY_FRANCHISES,
    selectedFranchise: DUMMY_FRANCHISES[0],
};

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
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.isLogin = false;
            state.selectedFranchise = DUMMY_FRANCHISES[0];
            state.activeTab = 'home';
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setSelectedFranchise: (state, action: PayloadAction<Franchise>) => {
            state.selectedFranchise = action.payload;
        },
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
        },
    },
});

export const { setCredentials, logout, setLoading, setSelectedFranchise, setActiveTab } = authSlice.actions;
export default authSlice.reducer;
