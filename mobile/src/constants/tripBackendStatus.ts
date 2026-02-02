/**
 * Backend trip status constants + helpers
 * Keep these centralized to avoid magic strings in UI logic.
 */

export const BACKEND_TRIP_STATUSES = {
  // Upcoming-ish
  ASSIGNED: 'ASSIGNED',
  REQUESTED: 'REQUESTED',
  NOT_ASSIGNED: 'NOT_ASSIGNED',
  PENDING: 'PENDING',
  DRIVER_ACCEPTED: 'DRIVER_ACCEPTED',

  // Ongoing-ish
  TRIP_STARTED: 'TRIP_STARTED',
  TRIP_PROGRESS: 'TRIP_PROGRESS',
  IN_PROGRESS: 'IN_PROGRESS',
  DRIVER_ON_THE_WAY: 'DRIVER_ON_THE_WAY',

  // Completed-ish
  COMPLETED: 'COMPLETED',
  TRIP_COMPLETED: 'TRIP_COMPLETED',
  TRIP_ENDED: 'TRIP_ENDED',
  PAYMENT_DONE: 'PAYMENT_DONE',

  // Cancelled / rejected
  CANCELLED_BY_CUSTOMER: 'CANCELLED_BY_CUSTOMER',
  CANCELLED_BY_OFFICE: 'CANCELLED_BY_OFFICE',
  REJECTED_BY_DRIVER: 'REJECTED_BY_DRIVER',
} as const;

export const BACKEND_ONGOING_TRIP_STATUSES = [
  BACKEND_TRIP_STATUSES.TRIP_STARTED,
  BACKEND_TRIP_STATUSES.TRIP_PROGRESS,
  BACKEND_TRIP_STATUSES.IN_PROGRESS,
  BACKEND_TRIP_STATUSES.DRIVER_ON_THE_WAY,
] as const;

const ONGOING_SET = new Set<string>(BACKEND_ONGOING_TRIP_STATUSES);

export function isBackendTripOngoing(status?: string | null): boolean {
  const key = (status ?? '').trim().toUpperCase();
  return ONGOING_SET.has(key);
}

