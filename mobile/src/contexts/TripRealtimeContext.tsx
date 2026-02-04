import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TripRequestModal } from '../components/ui/TripRequestModal';
import { TripDetailsModal } from '../components/ui/TripDetailsModal';
import { useToast } from './ToastContext';
import { SOCKET_EVENTS } from '../constants/socket';
import {
  connectDriverSocket,
  disconnectDriverSocket,
  emitTripOfferAccept,
  emitTripOfferReject,
  getDriverSocket,
  type TripAssignedEventPayload,
  type TripOfferEventPayload,
  type TripOfferResultEventPayload,
} from '../services/realtime/socket';
import { acceptTripOfferApi, rejectTripOfferApi } from '../services/api/tripOffers';
import { savePendingTripOffer, removePendingTripOffer } from '../services/storage/tripStorage';
import { useAuth } from './AuthContext';

type TripOfferState = {
  offerId: string;
  tripId: string;
  expiresAt: string;
};

type TripRealtimeContextValue = {
  currentOffer: TripOfferState | null;
  lastAssignedTripId: string | null;
  isRealtimeEnabled: boolean;
  enableRealtime: () => void;
  disableRealtime: () => void;
  acceptCurrentOffer: () => void;
  rejectCurrentOffer: () => void;
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
  const { isLoggedIn } = useAuth();
  const [currentOffer, setCurrentOffer] = useState<TripOfferState | null>(null);
  const [lastAssignedTripId, setLastAssignedTripId] = useState<string | null>(null);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState<boolean>(false);
  const [showTripDetails, setShowTripDetails] = useState<boolean>(false);
  const acceptingRef = useRef(false);
  const rejectingRef = useRef(false);
  const currentOfferRef = useRef<TripOfferState | null>(null);

  useEffect(() => {
    currentOfferRef.current = currentOffer;
  }, [currentOffer]);

  // Auto-connect socket when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      setIsRealtimeEnabled(true);
    } else {
      setIsRealtimeEnabled(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let mounted = true;
    let s: any = null;

    // Only connect when explicitly enabled (e.g., after clock-in).
    if (!isRealtimeEnabled) {
      disconnectDriverSocket();
      setCurrentOffer(null);
      setLastAssignedTripId(null);
      acceptingRef.current = false;
      return () => {
        mounted = false;
      };
    }

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
  }, [isRealtimeEnabled, showToast]);

  const enableRealtime = useCallback(() => {
    setIsRealtimeEnabled(true);
  }, []);

  const disableRealtime = useCallback(() => {
    setIsRealtimeEnabled(false);
  }, []);

  const dismissOffer = useCallback(() => {
    // Save to storage before dismissing so it shows in Trips screen
    if (currentOffer) {
      savePendingTripOffer({
        offerId: currentOffer.offerId,
        tripId: currentOffer.tripId,
        expiresAt: currentOffer.expiresAt,
      }).catch((err) => console.error('Failed to save pending trip offer:', err));
    }
    setCurrentOffer(null);
    setShowTripDetails(false);
    acceptingRef.current = false;
    rejectingRef.current = false;
  }, [currentOffer]);

  const rejectCurrentOffer = useCallback(async () => {
    if (!currentOffer) return;
    if (rejectingRef.current || acceptingRef.current) return;
    rejectingRef.current = true;

    try {
      // Emit socket event for real-time rejection (triggers next driver assignment)
      const s = getDriverSocket();
      if (s) {
        emitTripOfferReject(currentOffer.offerId);
      }

      // Also call REST API for persistence
      const updated = await rejectTripOfferApi(currentOffer.offerId);
      
      showToast({
        type: 'info',
        position: 'top',
        message: 'Trip offer rejected',
      });

      // Remove from pending storage
      await removePendingTripOffer(currentOffer.offerId);
      
      setCurrentOffer(null);
      setShowTripDetails(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to reject trip offer';
      showToast({ type: 'error', position: 'top', message: msg });
    } finally {
      rejectingRef.current = false;
    }
  }, [currentOffer, showToast]);

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
        setShowTripDetails(false);
        acceptingRef.current = false;
        return;
      }

      // Accepted: keep modal disabled; wait for TRIP_ASSIGNED (socket) or manual refresh (REST).
      showToast({
        type: 'success',
        position: 'top',
        message: 'Trip accepted. Waiting for assignment...',
      });

      // Remove from pending storage since it's accepted
      await removePendingTripOffer(currentOffer.offerId);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to accept trip offer';
      showToast({ type: 'error', position: 'top', message: msg });
      acceptingRef.current = false;
    }
  }, [currentOffer, showToast]);

  const value = useMemo<TripRealtimeContextValue>(
    () => ({
      currentOffer,
      lastAssignedTripId,
      isRealtimeEnabled,
      enableRealtime,
      disableRealtime,
      acceptCurrentOffer,
      rejectCurrentOffer,
      dismissOffer,
    }),
    [currentOffer, lastAssignedTripId, isRealtimeEnabled, enableRealtime, disableRealtime, acceptCurrentOffer, rejectCurrentOffer, dismissOffer]
  );

  const handleViewTrip = useCallback(() => {
    setShowTripDetails(true);
  }, []);

  const handleCloseTripDetails = useCallback(() => {
    setShowTripDetails(false);
  }, []);

  return (
    <TripRealtimeContext.Provider value={value}>
      {children}
      
      {/* Initial notification modal */}
      <TripRequestModal
        visible={Boolean(currentOffer) && !showTripDetails}
        tripId={currentOffer?.tripId ?? ''}
        onClose={dismissOffer}
        onAccept={acceptCurrentOffer}
        onReject={rejectCurrentOffer}
        onViewTrip={handleViewTrip}
        disabled={acceptingRef.current || rejectingRef.current}
      />

      {/* Full trip details modal */}
      <TripDetailsModal
        visible={Boolean(currentOffer) && showTripDetails}
        tripId={currentOffer?.tripId ?? ''}
        onClose={handleCloseTripDetails}
        onAccept={acceptCurrentOffer}
        onReject={rejectCurrentOffer}
        disabled={acceptingRef.current || rejectingRef.current}
      />
    </TripRealtimeContext.Provider>
  );
}

