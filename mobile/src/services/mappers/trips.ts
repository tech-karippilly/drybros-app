import { formatDateTime } from '../../utils/formatters';
import type { TripItem, TripStatus } from '../../constants/trips';
import type { HomeUpcomingTrip } from '../../constants/home';
import { BACKEND_TRIP_STATUSES } from '../../constants/tripBackendStatus';
import { TRIPS_STRINGS } from '../../constants/trips';
import type { BackendTrip } from '../api/trips';

const BACKEND_STATUS_TO_UI_STATUS: Record<string, TripStatus> = {
  // Upcoming-ish
  [BACKEND_TRIP_STATUSES.ASSIGNED]: 'upcoming',
  [BACKEND_TRIP_STATUSES.REQUESTED]: 'upcoming',
  [BACKEND_TRIP_STATUSES.NOT_ASSIGNED]: 'upcoming',
  [BACKEND_TRIP_STATUSES.PENDING]: 'upcoming',
  [BACKEND_TRIP_STATUSES.DRIVER_ACCEPTED]: 'upcoming',

  // Ongoing
  [BACKEND_TRIP_STATUSES.TRIP_STARTED]: 'ongoing',
  [BACKEND_TRIP_STATUSES.TRIP_PROGRESS]: 'ongoing',
  [BACKEND_TRIP_STATUSES.IN_PROGRESS]: 'ongoing',
  [BACKEND_TRIP_STATUSES.DRIVER_ON_THE_WAY]: 'ongoing',

  // Completed
  [BACKEND_TRIP_STATUSES.COMPLETED]: 'completed',
  [BACKEND_TRIP_STATUSES.TRIP_COMPLETED]: 'completed',
  [BACKEND_TRIP_STATUSES.TRIP_ENDED]: 'completed',
  [BACKEND_TRIP_STATUSES.PAYMENT_DONE]: 'completed',
  [BACKEND_TRIP_STATUSES.CANCELLED_BY_CUSTOMER]: 'completed',
  [BACKEND_TRIP_STATUSES.CANCELLED_BY_OFFICE]: 'completed',
  [BACKEND_TRIP_STATUSES.REJECTED_BY_DRIVER]: 'completed',
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
  const started = safeFormatDateTime(trip.startedAt);
  const ended = safeFormatDateTime(trip.endedAt);
  const created = safeFormatDateTime(trip.createdAt);

  const footerLabel =
    status === 'completed'
      ? `${TRIPS_STRINGS.COMPLETED_ON_PREFIX} ${ended !== 'N/A' ? ended : scheduled}`
      : status === 'ongoing'
        ? `${TRIPS_STRINGS.STARTED_AT_PREFIX} ${started !== 'N/A' ? started : scheduled}`
        : `${TRIPS_STRINGS.SCHEDULED_FOR_PREFIX} ${scheduled}`;

  return {
    id: trip.id,
    tripIdLabel: buildTripIdLabel(trip),
    status,
    backendStatus: trip.status ?? null,
    customerName: pickNonEmpty(trip.customerName),
    pickup: pickNonEmpty(trip.pickupAddress, trip.pickupLocation),
    drop: pickNonEmpty(trip.dropAddress, trip.dropLocation),
    footerLabel,
    scheduledDateTimeLabel: scheduled,
    bookingTimeLabel: created,
    customerPhone: pickNonEmpty(trip.customerPhone),
    startedAtISO: trip.startedAt ?? null,
    endedAtISO: trip.endedAt ?? null,
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

