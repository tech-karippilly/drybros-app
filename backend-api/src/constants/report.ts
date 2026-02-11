// src/constants/report.ts

/**
 * Report generation constants
 */
export const REPORT_CONSTANTS = {
  // Pagination limits
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,
  
  // Export limits
  MAX_EXPORT_RECORDS: 10000,
  EXPORT_BATCH_SIZE: 1000,
  
  // Date range limits (in days)
  MAX_DATE_RANGE_DAYS: 365, // 1 year max
  DEFAULT_DATE_RANGE_DAYS: 30,
  
  // Cache TTL (if needed)
  CACHE_TTL_SECONDS: 300, // 5 minutes
} as const;

/**
 * Report types
 */
export const REPORT_TYPES = {
  TRIP: "TRIP",
  DRIVER_PERFORMANCE: "DRIVER_PERFORMANCE",
  EARNINGS: "EARNINGS",
  ATTENDANCE: "ATTENDANCE",
  DISPATCH: "DISPATCH",
} as const;

export type ReportType = typeof REPORT_TYPES[keyof typeof REPORT_TYPES];

/**
 * Export formats
 */
export const EXPORT_FORMATS = {
  CSV: "CSV",
  JSON: "JSON",
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];

/**
 * Report error messages
 */
export const REPORT_ERROR_MESSAGES = {
  INVALID_DATE_RANGE: "Invalid date range",
  DATE_RANGE_TOO_LARGE: "Date range exceeds maximum allowed days",
  EXPORT_LIMIT_EXCEEDED: "Export record count exceeds maximum limit",
  UNAUTHORIZED_ACCESS: "Unauthorized to access this report",
  INVALID_REPORT_TYPE: "Invalid report type",
} as const;
