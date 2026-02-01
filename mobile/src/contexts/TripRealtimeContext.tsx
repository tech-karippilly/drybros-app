import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TripRequestModal } from '../components/ui/TripRequestModal';
import { useToast } from './ToastContext';
import { SOCKET_EVENTS } from '../constants/socket';
import {
  connectDriverSocket,
  disconnectDriverSocket,
  emitTripOfferAccept,
  getDriverSocket,
  type TripAssignedEventPayload,
  type TripOfferEventPayload,
  type TripOfferResultEventPayload,
} from '../services/realtime/socket';
import { acceptTripOfferApi } from '../services/api/tripOffers';

type TripOfferState = {
  offerId: string;
  tripId: string;
  expiresAt: string;
};

type TripRealtimeContextValue = {
  currentOffer: TripOfferState | null;
  lastAssignedTripId: string | null;
  acceptCurrentOffer: () => void;
  dismissOffer: () => void;
};

const TripRealtimeContext = createContext<TripRealtimeContextValue | undefined>(undefined);

export function useTripRealtime(): TripRealtimeContextValue {
  const ctx = useContext(TripRealtimeContext);
  if (!ctx) throw new Error('useTripRealtime must be used within TripRealtimeProvider');
  return ctx;
}

export function TripRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [currentOffer, setCurrentOffer] = useState<TripOfferState | null>(null);
  const [lastAssignedTripId, setLastAssignedTripId] = useState<string | null>(null);
  const acceptingRef = useRef(false);
  const currentOfferRef = useRef<TripOfferState | null>(null);

  useEffect(() => {
    currentOfferRef.current = currentOffer;
  }, [currentOffer]);

  useEffect(() => {
    let mounted = true;
    let s: any = null;

    const init = async () => {
      try {
        s = await connectDriverSocket();

        const onTripOffer = (payload: TripOfferEventPayload) => {
          if (!mounted) return;
          const offerId = payload?.offerId;
          const tripId = payload?.trip?.id;
          const expiresAt = payload?.expiresAt;
          if (!offerId || !tripId || !expiresAt) return;
          setCurrentOffer({ offerId, tripId, expiresAt });
        };

        const onTripAssigned = (payload: TripAssignedEventPayload) => {
          if (!mounted) return;
          const tripId = payload?.tripId;
          if (!tripId) return;
          setLastAssignedTripId(tripId);
          setCurrentOffer(null);
          acceptingRef.current = false;
        };

        const onOfferResult = (payload: TripOfferResultEventPayload) => {
          if (!mounted) return;
          const offerId = payload?.offerId;
          if (!offerId) return;
          if (currentOfferRef.current?.offerId !== offerId) return;

          // If accepted: keep modal disabled until trip assignment event arrives.
          if (payload.result === 'accepted') {
            showToast({
              type: 'success',
              position: 'top',
              message: 'Trip accepted. Waiting for assignment...',
            });
            return;
          }

          if (payload.result !== 'accepted') {
            showToast({
              type: 'error',
              position: 'top',
              message: payload.reason ?? `Offer ${payload.result}`,
            });
            setCurrentOffer(null);
          }
          acceptingRef.current = false;
        };

        s.on(SOCKET_EVENTS.TRIP_OFFER, onTripOffer);
        s.on(SOCKET_EVENTS.TRIP_ASSIGNED, onTripAssigned);
        s.on(SOCKET_EVENTS.TRIP_OFFER_RESULT, onOfferResult);
        s.on(SOCKET_EVENTS.TRIP_OFFER_CANCELLED, onOfferResult);

        // Cleanup listeners on disconnect/unmount
        const cleanup = () => {
          if (!s) return;
          s.off(SOCKET_EVENTS.TRIP_OFFER, onTripOffer);
          s.off(SOCKET_EVENTS.TRIP_ASSIGNED, onTripAssigned);
          s.off(SOCKET_EVENTS.TRIP_OFFER_RESULT, onOfferResult);
          s.off(SOCKET_EVENTS.TRIP_OFFER_CANCELLED, onOfferResult);
        };
        s.on('disconnect', cleanup);
      } catch {
        // Socket is optional; app should still work with REST polling.
      }
    };

    init();
    return () => {
      mounted = false;
      disconnectDriverSocket();
    };
  }, [showToast]);

  const dismissOffer = useCallback(() => {
    setCurrentOffer(null);
    acceptingRef.current = false;
  }, []);

  const acceptCurrentOffer = useCallback(async () => {
    if (!currentOffer) return;
    if (acceptingRef.current) return;
    acceptingRef.current = true;

    // Always send accept request to backend (socket first for realtime ack, REST as source of truth).
    try {
      const s = getDriverSocket();
      if (s) {
        emitTripOfferAccept(currentOffer.offerId);
      }

      const updated = await acceptTripOfferApi(currentOffer.offerId);
      if (updated.status !== 'ACCEPTED') {
        showToast({
          type: 'error',
          position: 'top',
          message: `Offer ${updated.status.toLowerCase()}`,
        });
        setCurrentOffer(null);
        acceptingRef.current = false;
        return;
      }

      // Accepted: keep modal disabled; wait for TRIP_ASSIGNED (socket) or manual refresh (REST).
      showToast({
        type: 'success',
        position: 'top',
        message: 'Trip accepted. Waiting for assignment...',
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to accept trip offer';
      showToast({ type: 'error', position: 'top', message: msg });
      acceptingRef.current = false;
    }
  }, [currentOffer]);

  const value = useMemo<TripRealtimeContextValue>(
    () => ({ currentOffer, lastAssignedTripId, acceptCurrentOffer, dismissOffer }),
    [currentOffer, lastAssignedTripId, acceptCurrentOffer, dismissOffer]
  );

  return (
    <TripRealtimeContext.Provider value={value}>
      {children}
      <TripRequestModal
        visible={Boolean(currentOffer)}
        tripId={currentOffer?.tripId ?? ''}
        onClose={dismissOffer}
        onAccept={acceptCurrentOffer}
        onReject={dismissOffer}
        onViewTrip={dismissOffer}
        disabled={acceptingRef.current}
      />
    </TripRealtimeContext.Provider>
  );
}

