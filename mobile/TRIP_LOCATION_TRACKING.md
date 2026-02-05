# Trip Live Location Tracking Implementation

## Overview
Implemented automatic location tracking that sends the driver's GPS coordinates to the backend every 5 minutes during an active trip.

## Changes Made

### 1. API Endpoint Configuration
**File**: `mobile/src/constants/endpints.ts`
- Added `LIVE_LOCATION: '/trips/:id/live-location'` endpoint to the TRIPS configuration

### 2. API Service Function
**File**: `mobile/src/services/api/trips.ts`
- Added `updateTripLiveLocationApi()` function to call the backend endpoint
- Accepts trip ID, latitude, and longitude as parameters
- Returns updated location data from the backend

### 3. Location Tracking Service
**File**: `mobile/src/services/tripLocationTracking.ts` (NEW)
- Created a dedicated service to manage periodic location updates
- **Key Features**:
  - Sends location immediately when tracking starts
  - Updates location every 5 minutes (300,000 ms) using `setInterval`
  - Checks for location permissions before each update
  - Uses balanced accuracy for battery efficiency
  - Includes error handling to continue tracking even if one update fails
  - Provides utility functions to start, stop, and check tracking status

### 4. Integration Points

#### Trip Start Screen
**File**: `mobile/src/screens/TripStartScreen.tsx`
- Starts location tracking immediately after successful OTP verification
- Ensures tracking begins as soon as the trip starts

#### Trip End Screen  
**File**: `mobile/src/screens/TripEndScreen.tsx`
- Stops location tracking after successful trip end verification
- Prevents unnecessary location updates after the trip completes

#### Trip Details Screen
**File**: `mobile/src/screens/TripDetailsScreen.tsx`
- Monitors trip status using `useEffect`
- Automatically starts tracking when trip status is 'ongoing'
- Automatically stops tracking when trip status changes or component unmounts
- Handles edge cases like navigating between screens

## How It Works

1. **Trip Start**: When a driver verifies the OTP and starts a trip, the location tracking service is initiated
2. **Active Tracking**: Every 5 minutes, the service:
   - Checks for location permissions
   - Gets the current GPS coordinates
   - Sends lat/long to `/trips/{id}/live-location` endpoint
   - Logs success/failure for debugging
3. **Trip End**: When the driver ends the trip, location tracking is stopped automatically
4. **Continuous Monitoring**: The TripDetailsScreen ensures tracking state is consistent with trip status

## Technical Details

- **Update Frequency**: 5 minutes (configurable via `LOCATION_UPDATE_INTERVAL` constant)
- **Location Accuracy**: Balanced (good compromise between accuracy and battery usage)
- **Permission Handling**: Checks for foreground location permissions before each update
- **Error Resilience**: Failed updates don't stop the tracking service
- **Cleanup**: Properly clears intervals on component unmount and trip status changes

## Backend Endpoint
The backend endpoint `/trips/:id/live-location` (POST) is already implemented and expects:
```json
{
  "lat": number,    // Latitude (-90 to 90)
  "long": number    // Longitude (-180 to 180)
}
```

## Testing Checklist
- [ ] Start a trip and verify location is sent immediately
- [ ] Confirm location updates occur every 5 minutes during the trip
- [ ] End a trip and verify location tracking stops
- [ ] Navigate away from trip details and back to ensure tracking continues
- [ ] Test with location permissions denied
- [ ] Verify app works offline (updates fail gracefully)

## Notes
- The service uses console logging for debugging - these can be removed or converted to a proper logging service in production
- Location permissions must be granted for the feature to work
- The tracking continues in the foreground only (background location tracking would require additional permissions and implementation)
