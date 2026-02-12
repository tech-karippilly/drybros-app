/**
 * Driver Performance Category
 */
export type DriverPerformanceCategory = "GREEN" | "YELLOW" | "RED";

/**
 * Driver Performance Metrics
 */
export interface DriverPerformanceMetrics {
  category: DriverPerformanceCategory;
  score: number; // 0-100
  rating: number | null;
  complaintCount: number;
  totalTrips: number;
  completedTrips: number;
  rejectedTrips: number;
  completionRate: number; // percentage
  rejectionRate: number; // percentage
}

/**
 * Driver interface with optional performance metrics
 */
export interface Driver {
  id: string;
  franchiseId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  driverCode: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED" | "TERMINATED";
  currentRating: number | null;
  complaintCount: number;
  isActive: boolean;
  bannedGlobally: boolean;
  licenseExpDate: string;
  carTypes: string[]; // Array of car types
  performance?: DriverPerformanceMetrics; // Optional performance metrics
}

/**
 * Available driver for trip assignment (includes match score)
 */
export interface AvailableDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  driverCode: string;
  status: string;
  currentRating: number | null;
  performance: DriverPerformanceMetrics;
  matchScore: number; // Car type match score
  remainingDailyLimit: number | null;
  checkedIn?: boolean; // Whether driver has checked in today
  attendanceStatus?: string | null; // Today's attendance status (PRESENT, PARTIAL, ABSENT)
  // Distance from pickup location
  distanceKm?: number | null;
  driverLocation?: {
    lat: number | null;
    lng: number | null;
  } | null;
  pickupLocation?: {
    lat: number | null;
    lng: number | null;
  } | null;
}

/**
 * Performance category configuration for UI
 */
export const PERFORMANCE_CATEGORY_CONFIG = {
  GREEN: {
    label: "Excellent",
    color: "#10b981",
    bgColor: "#d1fae5",
    textColor: "#065f46",
  },
  YELLOW: {
    label: "Good",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    textColor: "#92400e",
  },
  RED: {
    label: "Needs Improvement",
    color: "#ef4444",
    bgColor: "#fee2e2",
    textColor: "#991b1b",
  },
} as const;
