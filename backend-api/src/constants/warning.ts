// src/constants/warning.ts

export const WARNING_ERROR_MESSAGES = {
  WARNING_NOT_FOUND: "Warning not found",
  DRIVER_NOT_FOUND: "Driver not found",
  STAFF_NOT_FOUND: "Staff not found",
  INVALID_WARNING_TYPE: "Either driverId or staffId must be provided, but not both",
  MISSING_WARNING_DATA: "Reason is required",
} as const;

export const WARNING_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

/** Warnings before auto-fire */
export const WARNING_THRESHOLD = 3;
