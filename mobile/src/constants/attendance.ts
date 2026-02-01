/**
 * Attendance-related constants.
 * Keep backend enum-like strings centralized here (no magic strings in code).
 */

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  HALF_DAY: 'HALF_DAY',
  LEAVE: 'LEAVE',
} as const;

export type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ATTENDANCE_ERRORS = {
  MISSING_CLOCK_PERSON_ID:
    'Missing person id for attendance request. Please login again.',
  INVALID_CLOCK_PERSON_ID:
    'Invalid attendance request. Provide exactly one of id/driverId/staffId/userId.',
} as const;

