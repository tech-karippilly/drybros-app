/**
 * Pricing-related constants
 * These are default values that can be overridden by TripTypeConfig in the database
 */

export const DEFAULT_PRICING_RULES = {
  CITY_ROUND: {
    BASE_PRICE: 400,
    BASE_DURATION_HOURS: 3,
    EXTRA_PER_HOUR: 100,
  },
  CITY_DROPOFF: {
    BASE_PRICE: 500,
    BASE_DISTANCE_KM: 20,
    BASE_DURATION_HOURS: 2,
    EXTRA_PER_HOUR: 100,
    EXTRA_PER_HALF_HOUR: 50,
  },
  LONG_ROUND: {
    BASE_PRICE: 450,
    BASE_DURATION_HOURS: 3,
    EXTRA_PER_HOUR: 100,
  },
  LONG_DROPOFF: {
    // Slab-based - will be dynamic from database
    DEFAULT_SLABS: [
      { from: 0, to: 50, price: 1000 },
      { from: 50, to: 100, price: 2000 },
      { from: 100, to: 200, price: 3500 },
      { from: 200, to: 500, price: 5000 },
    ],
  },
  PREMIUM_CAR_MULTIPLIER: 1.5, // Default multiplier for premium cars
} as const;

export const PRICING_ERROR_MESSAGES = {
  TRIP_TYPE_CONFIG_NOT_FOUND: "Pricing configuration not found for this trip type",
  INVALID_TRIP_TYPE: "Invalid trip type",
  INVALID_DISTANCE: "Distance must be a positive number",
  INVALID_DURATION: "Duration must be a positive number",
  MISSING_DISTANCE_FOR_DROPOFF: "Distance is required for dropoff trips",
  MISSING_DURATION_FOR_ROUND: "Duration is required for round trips",
  PRICING_CALCULATION_FAILED: "Failed to calculate trip price",
} as const;

export type CarTypeCategory = "PREMIUM" | "LUXURY" | "NORMAL";

export interface DistanceSlab {
  from: number;
  to: number;
  price: number;
}
