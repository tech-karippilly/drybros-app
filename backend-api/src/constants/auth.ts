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
