import { Franchise } from './franchise';

export type { Franchise };

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
    activeTab: string;
    franchiseList: Franchise[];
    selectedFranchise: Franchise | null;
    refreshTrigger: number; // Timestamp to trigger dashboard refresh
}
