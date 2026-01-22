/**
 * Driver performance category constants
 */
export const DRIVER_PERFORMANCE_CATEGORIES = {
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED",
} as const;

export type DriverPerformanceCategory = typeof DRIVER_PERFORMANCE_CATEGORIES[keyof typeof DRIVER_PERFORMANCE_CATEGORIES];

export const PERFORMANCE_CATEGORY_CONFIG = {
  GREEN: {
    label: "Excellent",
    color: "#10b981", // green-500
    bgColor: "#d1fae5", // green-100
    minScore: 70,
  },
  YELLOW: {
    label: "Good",
    color: "#f59e0b", // amber-500
    bgColor: "#fef3c7", // amber-100
    minScore: 40,
    maxScore: 69,
  },
  RED: {
    label: "Needs Improvement",
    color: "#ef4444", // red-500
    bgColor: "#fee2e2", // red-100
    maxScore: 39,
  },
} as const;

export const PERFORMANCE_CALCULATION_CONFIG = {
  // Time window for performance calculation (in days)
  PERFORMANCE_WINDOW_DAYS: 90,
  
  // Score weights
  RATING_WEIGHT: 40, // Max 40 points
  COMPLETION_RATE_WEIGHT: 30, // Max 30 points
  COMPLAINT_WEIGHT: 20, // Max 20 points
  REJECTION_RATE_WEIGHT: 10, // Max 10 points
  
  // Category thresholds
  GREEN_MIN_SCORE: 70,
  YELLOW_MIN_SCORE: 40,
  
  // Override rules
  RED_RATING_THRESHOLD: 2.0,
  RED_COMPLAINT_THRESHOLD: 5,
  RED_REJECTION_RATE_THRESHOLD: 50, // percentage
  
  GREEN_RATING_THRESHOLD: 4.5,
  GREEN_REJECTION_RATE_THRESHOLD: 5, // percentage
  GREEN_MIN_TRIPS: 5,
} as const;
