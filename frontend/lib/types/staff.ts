export interface Staff {
    _id: string;
    name: string;
    email: string;
    phone: string;
    franchises_code: string;
    salary: number;
    status: 'active' | 'fired' | 'block' | 'suspended';
}

export interface StaffState {
    list: Staff[];
    selectedStaff: Staff | null;
    isLoading: boolean;
    error: string | null;
    filters: {
        name: string;
        salary: string; // Range or exact? User said "salary" filter, usually implies range or comparison
        status: string;
        email: string;
        phone: string;
    };
    pagination: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
    };
}
