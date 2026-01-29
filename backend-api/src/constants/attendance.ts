// src/constants/attendance.ts

export const ATTENDANCE_ERROR_MESSAGES = {
  ATTENDANCE_NOT_FOUND: "Attendance record not found",
  DRIVER_NOT_FOUND: "Driver not found",
  STAFF_NOT_FOUND: "Staff not found",
  USER_NOT_FOUND: "User not found",
  ALREADY_CLOCKED_IN: "Already clocked in for today",
  NOT_CLOCKED_IN: "Must clock in before clocking out",
  INVALID_ATTENDANCE_TYPE: "ID not found in drivers, staff, or managers",
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  HALF_DAY: "HALF_DAY",
  ON_LEAVE: "ON_LEAVE",
} as const;

/** Format for clock-in activity description: "{personName} clocked in" */
export const ATTENDANCE_ACTIVITY_DESCRIPTIONS = {
  CLOCK_IN_SUFFIX: " clocked in",
} as const;
