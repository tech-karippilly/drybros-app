/**
 * Centralized error messages for consistency across the application
 */
export const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: "Invalid credentials",
  INVALID_TOKEN: "Invalid or expired token",
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_INVALID_TYPE: "Invalid token type",
  EMAIL_NOT_FOUND: "Email address not found in our system",
  ACCOUNT_INACTIVE: "Account is inactive. Please contact support.",
  ACCOUNT_LOCKED: "Account is temporarily locked due to multiple failed login attempts",
  
  // User errors
  USER_NOT_FOUND: "User not found",
  USER_INACTIVE: "User account is inactive",
  EMAIL_ALREADY_EXISTS: "Email already in use",
  PHONE_ALREADY_EXISTS: "Phone number already in use",
  
  // Driver errors
  DRIVER_NOT_FOUND: "Driver not found",

  // Staff errors
  STAFF_NOT_FOUND: "Staff not found",
  
  // Franchise errors
  FRANCHISE_NOT_FOUND: "Franchise not found",
  FRANCHISE_CODE_ALREADY_EXISTS: "Franchise code already exists",
  
  // Role errors
  ROLE_NOT_FOUND: "Role not found",
  ROLE_NAME_EXISTS: "Role name already exists",
  ROLE_INACTIVE: "Role is not active",
  
  // General errors
  NOT_FOUND: "Resource not found",
  BAD_REQUEST: "Bad request",
  UNAUTHORIZED: "Not authenticated",
  FORBIDDEN: "Forbidden",
  INTERNAL_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",
  
  // CORS
  CORS_BLOCKED: "Not allowed by CORS",
} as const;
