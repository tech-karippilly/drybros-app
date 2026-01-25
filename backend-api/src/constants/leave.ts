// src/constants/leave.ts

export const LEAVE_ERROR_MESSAGES = {
  LEAVE_REQUEST_NOT_FOUND: "Leave request not found",
  DRIVER_NOT_FOUND: "Driver not found",
  STAFF_NOT_FOUND: "Staff not found",
  USER_NOT_FOUND: "User not found",
  INVALID_DATE_RANGE: "End date must be after start date",
  INVALID_LEAVE_TYPE: "Exactly one of driverId, staffId, or userId must be provided",
  LEAVE_ALREADY_APPROVED: "Leave request is already approved",
  LEAVE_ALREADY_REJECTED: "Leave request is already rejected",
  LEAVE_ALREADY_CANCELLED: "Leave request is already cancelled",
  REJECTION_REASON_REQUIRED: "Rejection reason is required when rejecting a leave request",
  INSUFFICIENT_PERMISSIONS: "You do not have permission to perform this action",
} as const;

export const LEAVE_TYPE = {
  SICK_LEAVE: "SICK_LEAVE",
  CASUAL_LEAVE: "CASUAL_LEAVE",
  EARNED_LEAVE: "EARNED_LEAVE",
  EMERGENCY_LEAVE: "EMERGENCY_LEAVE",
  OTHER: "OTHER",
} as const;

export const LEAVE_REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
