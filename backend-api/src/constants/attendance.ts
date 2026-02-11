// src/constants/attendance.ts

export const ATTENDANCE_ERROR_MESSAGES = {
  ATTENDANCE_NOT_FOUND: "Attendance record not found",
  DRIVER_NOT_FOUND: "Driver not found",
  STAFF_NOT_FOUND: "Staff not found",
  USER_NOT_FOUND: "User not found",
  ALREADY_CLOCKED_IN: "Already clocked in for today",
  ALREADY_CLOCKED_OUT: "Already clocked out for today",
  NOT_CLOCKED_IN: "Must clock in before clocking out",
  INVALID_ATTENDANCE_TYPE: "ID not found in drivers, staff, or managers",
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  PARTIAL: "PARTIAL",
  ABSENT: "ABSENT",
  LATE: "LATE",
  HALF_DAY: "HALF_DAY",
  ON_LEAVE: "ON_LEAVE",
} as const;

/** Format for clock-in activity description: "{personName} clocked in" */
export const ATTENDANCE_ACTIVITY_DESCRIPTIONS = {
  CLOCK_IN_SUFFIX: " clocked in",
} as const;

/**
 * Attendance aggregation configuration
 */
export const ATTENDANCE_AGGREGATION_CONFIG = {
  // Minimum minutes online to be marked PRESENT
  MIN_PRESENT_MINUTES: 240, // 4 hours
  
  // Minimum minutes online to be marked PARTIAL (between PARTIAL and PRESENT)
  MIN_PARTIAL_MINUTES: 30,  // 30 minutes
  
  // How often to run the aggregation (in milliseconds)
  // Default: Every 6 hours (4 times per day)
  AGGREGATION_INTERVAL_MS: 6 * 60 * 60 * 1000,
  
  // Maximum number of days to process in a single batch
  MAX_DAYS_PER_BATCH: 7,
  
  // How many days back to check (for catching up missed days)
  LOOKBACK_DAYS: 3,
} as const;
