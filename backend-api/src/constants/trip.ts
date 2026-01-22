/**
 * Trip-related constants
 */

export const CAR_GEAR_TYPES = {
  MANUAL: "MANUAL",
  AUTOMATIC: "AUTOMATIC",
} as const;

export type CarGearType = typeof CAR_GEAR_TYPES[keyof typeof CAR_GEAR_TYPES];

export const CAR_TYPE_CATEGORIES = {
  PREMIUM: "PREMIUM",
  LUXURY: "LUXURY",
  NORMAL: "NORMAL",
} as const;

export type CarTypeCategory = typeof CAR_TYPE_CATEGORIES[keyof typeof CAR_TYPE_CATEGORIES];

export const TRIP_ERROR_MESSAGES = {
  CUSTOMER_NOT_FOUND: "Customer not found",
  CUSTOMER_CREATION_FAILED: "Failed to create customer",
  TRIP_CREATION_FAILED: "Failed to create trip",
  INVALID_FRANCHISE: "Invalid franchise ID",
  INVALID_TRIP_TYPE: "Invalid trip type",
  INVALID_CAR_GEAR_TYPE: "Invalid car gear type",
  INVALID_CAR_TYPE: "Invalid car type category",
  MISSING_PICKUP_LOCATION: "Pickup location is required",
  MISSING_DESTINATION_LOCATION: "Destination location is required",
  MISSING_CUSTOMER_PHONE: "Customer phone number is required",
  MISSING_CUSTOMER_NAME: "Customer name is required",
} as const;
