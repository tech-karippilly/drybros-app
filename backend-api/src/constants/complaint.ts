// src/constants/complaint.ts

export const COMPLAINT_ERROR_MESSAGES = {
  COMPLAINT_NOT_FOUND: "Complaint not found",
  DRIVER_NOT_FOUND: "Driver not found",
  STAFF_NOT_FOUND: "Staff not found",
  INVALID_COMPLAINT_TYPE: "Either driverId or staffId must be provided, but not both",
  MISSING_COMPLAINT_DATA: "Title and description are required",
  RESOLVE_REQUIRES_ACTION: "Resolving a complaint requires action (WARNING or FIRE) and reason",
  RESOLVE_REQUIRES_REASON: "Resolution reason is required when resolving a complaint",
} as const;

export const COMPLAINT_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

/** Complaint status: PENDING | ON_PROCESS | RESOLVED (display); stored as OPEN | IN_PROGRESS | RESOLVED | CLOSED */
export const COMPLAINT_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

/** Action taken when resolving a complaint. 2+ WARNING → auto FIRE. */
export const COMPLAINT_RESOLUTION_ACTION = {
  WARNING: "WARNING",
  FIRE: "FIRE",
} as const;

/** Warnings before auto-fire */
export const COMPLAINT_WARNING_THRESHOLD = 2;
