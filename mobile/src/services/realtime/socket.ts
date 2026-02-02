import { io, type Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { SOCKET_EVENTS, SOCKET_TIMINGS_MS } from '../../constants/socket';
import type { BackendTrip } from '../api/trips';

export type TripOfferEventPayload = {
  offerId: string;
  trip: { id: string };
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

let socket: Socket | null = null;

export async function connectDriverSocket(): Promise<Socket> {
  if (socket) return socket;

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

export function emitTripOfferAccept(offerId: string): void {
  if (!socket) return;
  socket.emit(SOCKET_EVENTS.TRIP_OFFER_ACCEPT, { offerId });
}

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

