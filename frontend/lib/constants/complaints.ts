/**
 * Complaints UI and API constants.
 * Status: OPEN = Pending, IN_PROGRESS = On Process, RESOLVED, CLOSED.
 */

export const COMPLAINT_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Pending',
  IN_PROGRESS: 'On Process',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const COMPLAINT_RESOLUTION_ACTION = {
  WARNING: 'WARNING',
  FIRE: 'FIRE',
} as const;

export const COMPLAINT_RESOLUTION_ACTION_LABELS: Record<string, string> = {
  WARNING: 'Warning',
  FIRE: 'Fire',
};

export const COMPLAINT_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
