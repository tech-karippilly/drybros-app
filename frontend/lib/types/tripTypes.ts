/**
 * Trip type related types
 */

export const TripTypeStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type TripTypeStatus = (typeof TripTypeStatus)[keyof typeof TripTypeStatus];
