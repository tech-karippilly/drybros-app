/**
 * User roles in the application
 * These roles match the backend UserRole enum
 */
export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    DRIVER: 'driver',
} as const;

/**
 * Backend role names (as they come from the API)
 */
export const BACKEND_ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    OFFICE_STAFF: 'OFFICE_STAFF',
    STAFF: 'STAFF',
    DRIVER: 'DRIVER',
} as const;

/**
 * Map backend role to frontend role
 */
export const mapBackendRoleToFrontend = (backendRole: string): string => {
    const role = backendRole.toUpperCase();
    if (role === BACKEND_ROLES.ADMIN) return USER_ROLES.ADMIN;
    if (role === BACKEND_ROLES.MANAGER) return USER_ROLES.MANAGER;
    if (role === BACKEND_ROLES.OFFICE_STAFF || role === BACKEND_ROLES.STAFF) return USER_ROLES.STAFF;
    if (role === BACKEND_ROLES.DRIVER) return USER_ROLES.DRIVER;
    return USER_ROLES.ADMIN; // Default fallback
};

/**
 * Type for user roles
 */
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
