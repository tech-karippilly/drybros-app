export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'DRIVER' | 'CUSTOMER';

export interface User {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    franchiseName?: string;
    franchiseId?: string;
    /** Staff ID for staff members (when logging in via email, id = User.id, staffId = Staff.id) */
    staffId?: string;
    /** Driver ID for drivers (when applicable) */
    driverId?: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLogin: boolean;
    isLoading: boolean;
}
