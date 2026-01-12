export interface User {
    _id: string;
    email: string;
    name: string;
    role: string;
    franchise_name?: string;
    franchise_id?: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLogin: boolean;
    isLoading: boolean;
}
