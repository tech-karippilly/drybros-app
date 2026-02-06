import { io, type Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { SOCKET_EVENTS, SOCKET_TIMINGS_MS } from '../../constants/socket';
import type { BackendTrip } from '../api/trips';

/* =======================
   Event payload types
======================= */

export type TripOfferEventPayload = {
  offerId: string;
  trip: {
    id: string;
    pickupAddress?: string;
    dropAddress?: string;
    pickupLat?: number;
    pickupLng?: number;
    scheduledAt?: string | null;
  };
  expiresAt: string;
};

export type TripAssignedEventPayload = {
  tripId: string;
};

export type TripOfferResultEventPayload = {
  offerId: string;
  result: 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'lost';
  reason?: string;
};

export type TripsMyAssignedAck =
  | { data: BackendTrip[] }
  | { error: string; message?: string };

/* =======================
   Socket instance
======================= */

let socket: Socket | null = null;

/* =======================
   Connection helpers
======================= */

export async function connectDriverSocket(): Promise<Socket> {
  // If socket exists and is connected, return it
  if (socket && socket.connected) {
    return socket;
  }

  // If socket exists but is disconnected, clean it up first
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (!token) {
    throw new Error('Missing auth token for socket connection');
  }

  const baseUrl = API_CONFIG.BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing API base URL for socket connection');
  }

  socket = io(baseUrl, {
    transports: ['websocket'],
    auth: { token },
  });

  return socket;
}

export function disconnectDriverSocket(): void {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function getDriverSocket(): Socket | null {
  return socket;
}

/* =======================
   Emit events
======================= */

export function emitTripOfferAccept(offerId: string): void {
  if (!socket) return;
  socket.emit(SOCKET_EVENTS.TRIP_OFFER_ACCEPT, { offerId });
}

export function emitTripOfferReject(offerId: string): void {
  if (!socket) return;
  socket.emit(SOCKET_EVENTS.TRIP_OFFER_REJECT, { offerId });
}

/* =======================
   Listen: trip offers (NEW)
======================= */

export async function listenForTripOffers(
  handler: (payload: TripOfferEventPayload) => void
): Promise<void> {
  const s = await connectDriverSocket();
  s.on(SOCKET_EVENTS.TRIP_OFFER, handler);
}

export async function stopListeningForTripOffers(
  handler: (payload: TripOfferEventPayload) => void
): Promise<void> {
  if (!socket) return;
  socket.off(SOCKET_EVENTS.TRIP_OFFER, handler);
}

/* =======================
   Listen: trip assigned
======================= */

export async function listenForTripAssigned(
  handler: (payload: TripAssignedEventPayload) => void
): Promise<void> {
  const s = await connectDriverSocket();
  s.on(SOCKET_EVENTS.TRIP_ASSIGNED, handler);
}

export async function stopListeningForTripAssigned(
  handler: (payload: TripAssignedEventPayload) => void
): Promise<void> {
  if (!socket) return;
  socket.off(SOCKET_EVENTS.TRIP_ASSIGNED, handler);
}

/* =======================
   Listen: offer result / cancelled
======================= */

export async function listenForTripOfferResult(
  handler: (payload: TripOfferResultEventPayload) => void
): Promise<void> {
  const s = await connectDriverSocket();
  s.on(SOCKET_EVENTS.TRIP_OFFER_RESULT, handler);
}

export async function stopListeningForTripOfferResult(
  handler: (payload: TripOfferResultEventPayload) => void
): Promise<void> {
  if (!socket) return;
  socket.off(SOCKET_EVENTS.TRIP_OFFER_RESULT, handler);
}

/* =======================
   Fetch assigned trips (ACK-based)
======================= */

export async function fetchMyAssignedTripsViaSocket(): Promise<BackendTrip[]> {
  const s = await connectDriverSocket();

  return await new Promise<BackendTrip[]>((resolve, reject) => {
    let settled = false;

    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Socket request timed out'));
    }, SOCKET_TIMINGS_MS.ACK_TIMEOUT);

    s.emit(SOCKET_EVENTS.TRIPS_MY_ASSIGNED, {}, (ack: TripsMyAssignedAck) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (ack && 'data' in ack && Array.isArray(ack.data)) {
        resolve(ack.data);
        return;
      }

      const message =
        (ack && 'message' in ack && typeof ack.message === 'string' && ack.message) ||
        (ack && 'error' in ack && typeof ack.error === 'string' && ack.error) ||
        'Failed to fetch assigned trips';

      reject(new Error(message));
    });
  });
}
