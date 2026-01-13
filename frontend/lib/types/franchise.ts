export interface FranchiseStaff {
    _id: string;
    name: string;
    role: string;
}

export interface FranchiseDriver {
    _id: string;
    name: string;
}

export interface Franchise {
    _id: string;
    code: string;
    name: string;
    address: string;
    location: string;
    email: string;
    phone: string;
    staffCount: number;
    driverCount: number;
    image?: string;
    description?: string;
    inchargeName: string;
    staff: FranchiseStaff[];
    drivers: FranchiseDriver[];
    status: 'active' | 'blocked';
}

export interface FranchiseState {
    list: Franchise[];
    selectedFranchise: Franchise | null;
    isLoading: boolean;
    error: string | null;
}
