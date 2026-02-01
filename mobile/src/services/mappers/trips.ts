import { formatDateTime } from '../../utils/formatters';
import type { TripItem, TripStatus } from '../../constants/trips';
import type { HomeUpcomingTrip } from '../../constants/home';
import type { BackendTrip } from '../api/trips';

const BACKEND_STATUS_TO_UI_STATUS: Record<string, TripStatus> = {
  // Upcoming-ish
  ASSIGNED: 'upcoming',
  REQUESTED: 'upcoming',
  NOT_ASSIGNED: 'upcoming',
  PENDING: 'upcoming',
  DRIVER_ACCEPTED: 'upcoming',

  // Ongoing
  TRIP_STARTED: 'ongoing',
  TRIP_PROGRESS: 'ongoing',
  IN_PROGRESS: 'ongoing',
  DRIVER_ON_THE_WAY: 'ongoing',

  // Completed
  COMPLETED: 'completed',
  TRIP_COMPLETED: 'completed',
};

function toUiStatus(status?: string | null): TripStatus {
  const key = (status ?? '').trim().toUpperCase();
  return BACKEND_STATUS_TO_UI_STATUS[key] ?? 'upcoming';
}

function pickNonEmpty(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim().length) return v.trim();
  }
  return 'N/A';
}

function safeFormatDateTime(iso?: string | null): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return formatDateTime(d);
}

function buildTripIdLabel(trip: BackendTrip): string {
  // Backend doesn’t provide a dedicated human-friendly trip code yet in the spec; use UUID.
  return trip.id;
}

export function mapBackendTripToTripItem(trip: BackendTrip): TripItem {
  const status = toUiStatus(trip.status);

  const scheduled = safeFormatDateTime(trip.scheduledAt);
  const created = safeFormatDateTime(trip.createdAt);

  const footerLabel =
    status === 'completed'
      ? `Completed on ${scheduled}`
      : status === 'ongoing'
        ? `Started at ${scheduled}`
        : `Scheduled for ${scheduled}`;

  return {
    id: trip.id,
    tripIdLabel: buildTripIdLabel(trip),
    status,
    customerName: pickNonEmpty(trip.customerName),
    pickup: pickNonEmpty(trip.pickupAddress, trip.pickupLocation),
    drop: pickNonEmpty(trip.dropAddress, trip.dropLocation),
    footerLabel,
    scheduledDateTimeLabel: scheduled,
    bookingTimeLabel: created,
    customerPhone: pickNonEmpty(trip.customerPhone),
    estDistanceKm: 'N/A',
    estDurationMin: 'N/A',
    vehicleNumber: 'N/A',
    transmission: 'N/A',
    vehicleModel: pickNonEmpty(trip.tripType),
    serviceType: pickNonEmpty(trip.tripType),
    specialRequests: 'N/A',
  };
}

export function mapBackendTripToHomeUpcomingTrip(trip: BackendTrip): HomeUpcomingTrip {
  const tripItem = mapBackendTripToTripItem(trip);

  return {
    id: trip.id,
    tripNumberLabel: `Trip #${trip.id.slice(0, 6).toUpperCase()}`,
    customerName: tripItem.customerName,
    statusLabel: tripItem.status.toUpperCase(),
    etaLabel: tripItem.scheduledDateTimeLabel,
    fromLabel: tripItem.pickup,
    toLabel: tripItem.drop,
    vehicleMake: tripItem.vehicleModel,
    vehicleLabel: tripItem.vehicleModel,
    transmission: tripItem.transmission,
    trip: tripItem,
  };
}

