// src/constants/complaint.ts

export const COMPLAINT_ERROR_MESSAGES = {
  COMPLAINT_NOT_FOUND: "Complaint not found",
  DRIVER_NOT_FOUND: "Driver not found",
  STAFF_NOT_FOUND: "Staff not found",
  INVALID_COMPLAINT_TYPE: "Either driverId or staffId must be provided, but not both",
  MISSING_COMPLAINT_DATA: "Title and description are required",
} as const;

export const COMPLAINT_SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export const COMPLAINT_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
