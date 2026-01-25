import { UserRole } from "@prisma/client";

/**
 * User roles that receive franchiseId in login response.
 * MANAGER: from User.franchiseId; STAFF/OFFICE_STAFF: from Staff; DRIVER: from Driver.
 */
export const ROLES_WITH_FRANCHISE: UserRole[] = [
  UserRole.MANAGER,
  UserRole.STAFF,
  UserRole.OFFICE_STAFF,
  UserRole.DRIVER,
];

/**
 * User roles allowed to use forgot/reset password (User table).
 * Manager, staff, driver, admin.
 */
export const ROLES_ALLOWED_FOR_PASSWORD_RESET: UserRole[] = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
  UserRole.OFFICE_STAFF,
  UserRole.DRIVER,
];

/** Entity types for password reset (user = User, staff = Staff, driver = Driver) */
export const PASSWORD_RESET_ENTITY = {
  USER: "user",
  STAFF: "staff",
  DRIVER: "driver",
} as const;

export type PasswordResetEntityType =
  (typeof PASSWORD_RESET_ENTITY)[keyof typeof PASSWORD_RESET_ENTITY];

/**
 * Authentication rate limiting constants
 * Implements escalating lockout periods for failed login attempts
 */
export const AUTH_RATE_LIMIT = {
  // First threshold: 5 incorrect attempts → 5 minutes lockout
  FIRST_THRESHOLD: 5,
  FIRST_LOCKOUT_MINUTES: 5,
  
  // Subsequent thresholds: 2 more incorrect attempts → 10 minutes lockout
  SUBSEQUENT_THRESHOLD_INCREMENT: 2,
  SUBSEQUENT_LOCKOUT_MINUTES: 10,
  
  // Maximum lockout time (in minutes) - can be increased if needed
  MAX_LOCKOUT_MINUTES: 30,
} as const;
