# Trip Booking Page - Implementation Guide

## Overview
This implementation provides a complete trip booking page with location search functionality using Google Places API integration.

## Features Implemented

### 1. Navigation Menu
- Added "Trips" menu with "Booking" submenu to all roles (Admin, Manager, Staff)
- Menu structure integrated into DashboardLayout component

### 2. Booking Form Sections
- **Customer Information**: Name, phone, alternative phone, email (optional)
- **Pickup Location**: 
  - Location search with Google Places API
  - Auto-filled address display
  - Additional pickup notes
- **Destination Location**: 
  - Location search with Google Places API
  - Auto-filled address display
  - Additional destination notes
- **Trip Details**: 
  - Trip type dropdown (from API)
  - Date and time pickers
  - Franchise selection (Admin only)

### 3. Location Search Features
- **Debounce functionality**: 500ms delay to prevent excessive API calls
- **Dropdown suggestions**: Shows location predictions from Google Places
- **Auto-fill**: Populates full address when location is selected
- **Mock implementation**: Current implementation includes mock data for testing

### 4. Validation & Submission
- Client-side validation for all required fields
- Form state management
- Loading states during API calls
- Toast notifications for success/error feedback

## File Structure
```
web/
├── components/
│   └── trips/
│       └── BookingForm.tsx          # Main booking form component
├── hooks/
│   └── useDebounceValue.ts          # Custom hook for value debouncing
├── app/
│   ├── admin/
│   │   └── trips/
│   │       └── booking/
│   │           └── page.tsx         # Admin booking page
│   ├── manager/
│   │   └── trips/
│   │       └── booking/
│   │           └── page.tsx         # Manager booking page
│   └── staff/
│       └── trips/
│           └── booking/
│               └── page.tsx         # Staff booking page
```

## Google Places API Integration

### Current Implementation
The location search uses mock data for demonstration purposes. To integrate with real Google Places API:

1. **Get API Key**: 
   - Go to Google Cloud Console
   - Enable Places API
   - Generate an API key

2. **Replace Mock Functions**:
   In `BookingForm.tsx`, replace the `searchPlaces` and `getPlaceDetails` functions:

```typescript
// Replace this mock implementation
const searchPlaces = async (query: string): Promise<PlacePrediction[]> => {
  // Your Google Places API call here
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=YOUR_API_KEY`
  );
  const data = await response.json();
  return data.predictions;
};

// Replace this mock implementation
const getPlaceDetails = async (placeId: string): Promise<PlaceDetails> => {
  // Your Google Places Details API call here
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=YOUR_API_KEY`
  );
  const data = await response.json();
  return {
    lat: data.result.geometry.location.lat,
    lng: data.result.geometry.location.lng,
    formatted_address: data.result.formatted_address
  };
};
```

### Environment Variables
Add to your `.env.local` file:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Styling & Theme
- Uses existing dark theme colors (`bg-gray-900/50`, `border-gray-800`)
- Consistent with dashboard design language
- Responsive layout for all screen sizes
- Proper spacing and typography

## Usage Instructions

### For Admin Users:
1. Navigate to Trips → Booking in sidebar
2. Select franchise from dropdown
3. Fill in customer details
4. Search and select pickup/destination locations
5. Choose trip type, date, and time
6. Submit form

### For Manager/Staff Users:
1. Navigate to Trips → Booking in sidebar
2. Franchise is auto-selected based on user's franchise
3. Fill in customer details
4. Search and select pickup/destination locations
5. Choose trip type, date, and time
6. Submit form

## Future Enhancements
- Integration with real Google Places API
- Map visualization of selected locations
- Trip confirmation and tracking
- Customer notification system
- Trip history and management
- Real-time pricing calculation based on distance/time

## Dependencies Used
- React hooks (useState, useEffect, useCallback)
- Custom debounce hook for location search
- Existing UI components (Input, TextArea, DatePicker, TimePicker, Button)
- Toast notifications for user feedback
- Redux for user authentication state