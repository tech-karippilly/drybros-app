// Backend-aligned Staff interface
export interface Staff {
    id: string;
    _id?: string; // Legacy support
    name: string;
    email: string;
    phone: string;
    password?: string;
    profilePic?: string | null;
    franchiseId: string;
    franchises_code?: string; // Legacy support
    monthlySalary: number;
    salary?: number; // Legacy support (maps to monthlySalary)
    address: string;
    emergencyContact: string;
    emergencyContactRelation: string;
    relationship?: string; // Legacy support (maps to emergencyContactRelation)
    govtId: boolean;
    addressProof: boolean;
    certificates: boolean;
    previousExperienceCert: boolean;
    documentsCollected?: string[]; // Legacy support
    status: 'ACTIVE' | 'FIRED' | 'SUSPENDED' | 'BLOCKED' | 'active' | 'fired' | 'block' | 'suspended'; // Support both formats
    suspendedUntil: Date | string | null;
    joinDate: Date | string;
    relieveDate: Date | string | null;
    relieveReason: 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT' | 'CONTRACT_ENDED' | 'PERFORMANCE_ISSUES' | 'MISCONDUCT' | 'OTHER' | null;
    isActive: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;

    // Performance/Stats (optional, may not come from backend)
    customersAttended?: number;
    leaveTaken?: number;
    attendanceStatus?: 'present' | 'absent' | 'on-leave';
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
        franchiseId: string;
    };
    pagination: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
    };
}
