/**
 * Complaints UI and API constants.
 * Status: RECEIVED = Complaint received, IN_PROCESS = Being investigated, RESOLVED = Resolved with action.
 * Priority: LOW, MEDIUM, HIGH
 */

export const COMPLAINT_STATUS = {
  RECEIVED: 'RECEIVED',
  IN_PROCESS: 'IN_PROCESS',
  RESOLVED: 'RESOLVED',
} as const;

export const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Received',
  IN_PROCESS: 'In Process',
  RESOLVED: 'Resolved',
};

export const COMPLAINT_RESOLUTION_ACTION = {
  WARNING: 'WARNING',
  FIRE: 'FIRE',
} as const;

export const COMPLAINT_RESOLUTION_ACTION_LABELS: Record<string, string> = {
  WARNING: 'Warning',
  FIRE: 'Fire',
};

export const COMPLAINT_PRIORITY = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const COMPLAINT_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};
