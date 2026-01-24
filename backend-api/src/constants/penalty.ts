// src/constants/penalty.ts

export const PENALTY_ERROR_MESSAGES = {
  PENALTY_NOT_FOUND: "Penalty not found",
  DRIVER_PENALTY_NOT_FOUND: "Driver penalty not found",
  DRIVER_NOT_FOUND: "Driver not found",
  INVALID_AMOUNT: "Amount must be greater than 0",
  INVALID_DAILY_LIMIT: "Daily limit must be greater than 0",
  FRANCHISE_REQUIRED: "Franchise ID is required for manager",
} as const;
