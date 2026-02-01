/**
 * Attendance UI + query constants (Admin dashboard).
 *
 * Keep reusable labels/values centralized (no inline magic strings).
 */

export const ATTENDANCE_DATE_FILTERS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  ALL: 'all',
} as const;

export type AttendanceDateFilter =
  (typeof ATTENDANCE_DATE_FILTERS)[keyof typeof ATTENDANCE_DATE_FILTERS];

export const ATTENDANCE_UI_LABELS = {
  DATE_FILTER: 'Date filter',
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  ALL: 'All',
} as const;

export const ATTENDANCE_SEARCH_PLACEHOLDER =
  'Search by name, ID, status...';

// Attendance list fetch sizing (kept consistent with existing dashboard patterns)
export const ATTENDANCE_LIST_LIMIT = 100 as const;

// Trip lookup for the selected day (to show per-driver latest trip status)
export const ATTENDANCE_TRIP_LOOKUP_LIMIT = 500 as const;

