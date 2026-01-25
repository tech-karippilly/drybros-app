/**
 * KPI-related constants (trip counts, status groups)
 */

export const KPI_ACTIVE_TRIP_STATUSES = [
  'ASSIGNED',
  'DRIVER_ACCEPTED',
  'TRIP_STARTED',
  'TRIP_PROGRESS',
  'IN_PROGRESS',
  'DRIVER_ON_THE_WAY',
] as const;

export const KPI_CANCELED_TRIP_STATUSES = [
  'CANCELLED_BY_OFFICE',
  'CANCELLED_BY_CUSTOMER',
  'REJECTED_BY_DRIVER',
] as const;

export function getTodayYYYYMMDD(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
