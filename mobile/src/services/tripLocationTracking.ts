/**
 * Trip Location Tracking Service
 * Handles periodic location updates during active trips (every 5 minutes)
 */

import * as Location from 'expo-location';
import { updateTripLiveLocationApi } from './api/trips';

const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

type LocationTrackerState = {
  tripId: string;
  intervalId: NodeJS.Timeout;
};

let activeTracker: LocationTrackerState | null = null;

/**
 * Start tracking location for an active trip
 * Sends location updates to the backend every 5 minutes
 */
export async function startTripLocationTracking(tripId: string): Promise<void> {
  // Stop any existing tracker first
  stopTripLocationTracking();

  console.log(`[TripLocationTracking] Starting location tracking for trip ${tripId}`);

  // Send initial location immediately
  await sendLocationUpdate(tripId);

  // Set up periodic updates every 5 minutes
  const intervalId = setInterval(async () => {
    await sendLocationUpdate(tripId);
  }, LOCATION_UPDATE_INTERVAL);

  activeTracker = {
    tripId,
    intervalId,
  };
}

/**
 * Stop tracking location for the current trip
 */
export function stopTripLocationTracking(): void {
  if (activeTracker) {
    console.log(`[TripLocationTracking] Stopping location tracking for trip ${activeTracker.tripId}`);
    clearInterval(activeTracker.intervalId);
    activeTracker = null;
  }
}

/**
 * Check if location tracking is active
 */
export function isTripLocationTrackingActive(): boolean {
  return activeTracker !== null;
}

/**
 * Get the current tracking trip ID
 */
export function getTrackingTripId(): string | null {
  return activeTracker?.tripId ?? null;
}

/**
 * Send current location to backend
 */
async function sendLocationUpdate(tripId: string): Promise<void> {
  try {
    // Check for location permissions
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[TripLocationTracking] Location permission not granted');
      return;
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    console.log(`[TripLocationTracking] Sending location update for trip ${tripId}: lat=${latitude}, long=${longitude}`);

    // Send to backend
    await updateTripLiveLocationApi(tripId, {
      lat: latitude,
      long: longitude,
    });

    console.log(`[TripLocationTracking] Location update sent successfully for trip ${tripId}`);
  } catch (error) {
    console.error('[TripLocationTracking] Failed to send location update:', error);
    // Continue tracking even if one update fails
  }
}
