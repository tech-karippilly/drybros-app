/**
 * Penalty deduction constants for drivers
 * These values must match the backend constants
 */

export const DRIVER_PENALTY_DEDUCTIONS = {
  LATE_REPORT: {
    name: "Late report",
    amount: 100,
    description: "Penalty for reporting late to work",
  },
  TRIP_CANCELLED: {
    name: "Trip cancelled",
    amount: 200,
    description: "Penalty for cancelling an assigned trip",
  },
  PHONE_NOT_ANSWERED: {
    name: "Phone not answered",
    amount: 50,
    description: "Penalty for not answering phone calls",
  },
  MONEY_NOT_SUBMITTED: {
    name: "Money not submitted before 10 PM",
    amount: 50,
    description: "Penalty for not submitting money before 10 PM",
  },
  UNINFORMED_LEAVE: {
    name: "Uninformed leave",
    amount: 720,
    description: "Penalty for taking leave without prior notice",
  },
  NOT_REPORTING_OFFICE: {
    name: "Not reporting office",
    amount: 50,
    description: "Penalty for not reporting to office when required",
  },
  CUSTOMER_COMPLAINT: {
    name: "Customer complaint",
    amount: 250,
    description: "Penalty for receiving a customer complaint",
  },
} as const;

export type PenaltyDeductionKey = keyof typeof DRIVER_PENALTY_DEDUCTIONS;

/**
 * Get all penalty deduction types as an array
 */
export const PENALTY_DEDUCTION_LIST = Object.values(DRIVER_PENALTY_DEDUCTIONS);

/**
 * Format currency amount in INR
 */
export const formatPenaltyAmount = (amount: number): string => {
  return `₹${amount}`;
};
