export interface Staff {
    _id: string;
    name: string;
    email: string;
    phone: string;
    password?: string;
    profilePic?: string;
    franchiseId: string;
    franchises_code: string;
    salary: number;
    address: string;
    emergencyContact: string;
    relationship: string;
    documentsCollected: string[]; // e.g., ["Identity", "Certificate"]
    status: 'active' | 'fired' | 'block' | 'suspended';

    // Performance/Stats
    customersAttended: number;
    leaveTaken: number;
    attendanceStatus: 'present' | 'absent' | 'on-leave';
    suspensionDuration?: string;
}

export interface StaffState {
    list: Staff[];
    selectedStaff: Staff | null;
    isLoading: boolean;
    error: string | null;
    filters: {
        name: string;
        salary: string;
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
