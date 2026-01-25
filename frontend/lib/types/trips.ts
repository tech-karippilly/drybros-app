/**
 * Trip-related types
 */

export enum CarType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  LUXURY = 'LUXURY',
}

export const CAR_TYPE_LABELS: Record<CarType, string> = {
  [CarType.STANDARD]: 'Standard',
  [CarType.PREMIUM]: 'Premium',
  [CarType.LUXURY]: 'Luxury',
};

export interface CreateTripStep1Input {
  customerName: string;
  phone: string;
  alternativePhone?: string;
  email: string;
  tripTypeId: number;
  pickupLocation: string;
  pickupNote?: string;
  destinationLocation: string;
  destinationNote?: string;
  carType: CarType;
  scheduledAt: Date | string | null;
  isDetailsReconfirmed: boolean;
  isFareDiscussed: boolean;
  isPriceAccepted: boolean;
}
