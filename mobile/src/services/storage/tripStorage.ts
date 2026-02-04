/**
 * Trip storage service
 * Saves and loads pending trip offers in AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PENDING_TRIP_OFFERS: '@drybros:pending_trip_offers',
} as const;

export type PendingTripOffer = {
  offerId: string;
  tripId: string;
  expiresAt: string;
  receivedAt: string;
};

/**
 * Save a pending trip offer to storage
 */
export async function savePendingTripOffer(offer: Omit<PendingTripOffer, 'receivedAt'>): Promise<void> {
  try {
    const existingOffers = await getPendingTripOffers();
    const newOffer: PendingTripOffer = {
      ...offer,
      receivedAt: new Date().toISOString(),
    };
    
    // Remove any existing offer with same offerId or tripId
    const filteredOffers = existingOffers.filter(
      (o) => o.offerId !== offer.offerId && o.tripId !== offer.tripId
    );
    
    // Add new offer at the beginning
    const updatedOffers = [newOffer, ...filteredOffers];
    
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_TRIP_OFFERS, JSON.stringify(updatedOffers));
  } catch (error) {
    console.error('Failed to save pending trip offer:', error);
  }
}

/**
 * Get all pending trip offers from storage
 */
export async function getPendingTripOffers(): Promise<PendingTripOffer[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_TRIP_OFFERS);
    if (!data) return [];
    
    const offers: PendingTripOffer[] = JSON.parse(data);
    
    // Filter out expired offers
    const now = new Date().getTime();
    const validOffers = offers.filter((offer) => {
      const expiresAt = new Date(offer.expiresAt).getTime();
      return expiresAt > now;
    });
    
    // Update storage if any offers were filtered out
    if (validOffers.length !== offers.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_TRIP_OFFERS, JSON.stringify(validOffers));
    }
    
    return validOffers;
  } catch (error) {
    console.error('Failed to get pending trip offers:', error);
    return [];
  }
}

/**
 * Remove a pending trip offer from storage
 */
export async function removePendingTripOffer(offerId: string): Promise<void> {
  try {
    const existingOffers = await getPendingTripOffers();
    const filteredOffers = existingOffers.filter((o) => o.offerId !== offerId);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_TRIP_OFFERS, JSON.stringify(filteredOffers));
  } catch (error) {
    console.error('Failed to remove pending trip offer:', error);
  }
}

/**
 * Clear all pending trip offers from storage
 */
export async function clearPendingTripOffers(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_TRIP_OFFERS);
  } catch (error) {
    console.error('Failed to clear pending trip offers:', error);
  }
}
