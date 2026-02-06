// src/constants/complaint.ts

export const COMPLAINT_ERROR_MESSAGES = {
  COMPLAINT_NOT_FOUND: "Complaint not found",
  DRIVER_NOT_FOUND: "Driver not found",
  STAFF_NOT_FOUND: "Staff not found",
  CUSTOMER_NOT_FOUND: "Customer name not found in the system",
  INVALID_COMPLAINT_TYPE: "Either driverId or staffId must be provided, but not both",
  MISSING_COMPLAINT_DATA: "Title and description are required",
  RESOLVE_REQUIRES_ACTION: "Resolving a complaint requires action (WARNING or FIRE) and reason",
  RESOLVE_REQUIRES_REASON: "Resolution reason is required when resolving a complaint",
  STAFF_COMPLAINT_PERMISSION_DENIED: "Only admin and manager can create complaints for staff",
} as const;

export const COMPLAINT_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

/** Complaint status: RECEIVED | IN_PROCESS | RESOLVED */
export const COMPLAINT_STATUS = {
  RECEIVED: "RECEIVED",
  IN_PROCESS: "IN_PROCESS",
  RESOLVED: "RESOLVED",
} as const;

/** Action taken when resolving a complaint. 3+ WARNING → auto FIRE. */
export const COMPLAINT_RESOLUTION_ACTION = {
  WARNING: "WARNING",
  FIRE: "FIRE",
} as const;

/** Warnings before auto-fire */
export const COMPLAINT_WARNING_THRESHOLD = 3;

