export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
} as const;

export const AUTH_ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
} as const;

export const ADMIN_DUMMY_USER = {
    _id: "user_123",
    name: "Admin User",
    email: "admin@drybros.com",
    role: "admin",
    franchise_name: "Main Branch",
    franchise_id: "fran_001"
} as const;

export const PASSWORD_VALIDATION_MESSAGES = {
    LENGTH: "Password must be at least 8 characters long.",
    UPPERCASE: "Password must contain at least one uppercase letter.",
    NUMBER: "Password must contain at least one number.",
    SPECIAL: "Password must contain at least one special character.",
} as const;
export const DUMMY_FRANCHISES = [
    {
        _id: 'fran_001',
        code: 'DB-MAIN-001',
        name: 'Main Headquarters',
        address: '123 HQ Plaza, Central City',
        location: 'Central City',
        email: 'hq@drybros.com',
        phone: '+1 111 222 3333',
        staffCount: 15,
        driverCount: 8,
        inchargeName: 'Robert Chief',
        staff: [],
        drivers: [],
        status: 'active' as const
    },
    {
        _id: 'fran_002',
        code: 'DB-DT-002',
        name: 'Downtown Branch',
        address: '456 Urban Way, Downtown',
        location: 'Downtown',
        email: 'downtown@drybros.com',
        phone: '+1 222 333 4444',
        staffCount: 8,
        driverCount: 4,
        inchargeName: 'Sarah Urban',
        staff: [],
        drivers: [],
        status: 'active' as const
    },
    {
        _id: 'fran_003',
        code: 'DB-WEST-003',
        name: 'Westside Laundry',
        address: '789 Sunset Blvd, Westside',
        location: 'Westside',
        email: 'westside@drybros.com',
        phone: '+1 333 444 5555',
        staffCount: 6,
        driverCount: 2,
        inchargeName: 'Mike West',
        staff: [],
        drivers: [],
        status: 'active' as const
    },
    {
        _id: 'fran_004',
        code: 'DB-EAST-004',
        name: 'East End Hub',
        address: '321 Sunrise St, East End',
        location: 'East End',
        email: 'eastent@drybros.com',
        phone: '+1 444 555 6666',
        staffCount: 5,
        driverCount: 3,
        inchargeName: 'Emma East',
        staff: [],
        drivers: [],
        status: 'active' as const
    },
];
