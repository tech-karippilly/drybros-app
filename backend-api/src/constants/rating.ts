// src/constants/rating.ts

export const RATING_ERROR_MESSAGES = {
  RATING_NOT_FOUND: "Rating not found",
  DRIVER_NOT_FOUND: "Driver not found",
  TRIP_NOT_FOUND: "Trip not found",
  INVALID_RATING_VALUE: "Rating must be between 1 and 5",
  RATING_ALREADY_EXISTS: "Rating already exists for this trip",
} as const;

export const RATING_MIN = 1;
export const RATING_MAX = 5;
