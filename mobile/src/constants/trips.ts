/**
 * Trips + Trip Details constants (labels, layout, mock data)
 * Replace mock data with API/store once wired.
 */

export const TRIPS_STRINGS = {
  TITLE: 'Trips',

  FILTER_ALL: 'All',
  FILTER_UPCOMING: 'Upcoming',
  FILTER_ONGOING: 'Ongoing',
  FILTER_COMPLETED: 'Completed',

  // Common labels
  TRIP_ID_LABEL: 'Trip ID',
  CUSTOMER_LABEL: 'Customer',
  PICKUP_LABEL: 'Pickup',
  DROP_LABEL: 'Drop',

  // Footer labels (list)
  STARTED_AT_PREFIX: 'Started at',
  SCHEDULED_FOR_PREFIX: 'Scheduled for',
  COMPLETED_ON_PREFIX: 'Completed on',

  // Trip details page
  DETAILS_TITLE: 'Trip Details',
  PICKUP_LOCATION_LABEL: 'Pickup Location',
  DROP_LOCATION_LABEL: 'Drop Location',
  SCHEDULED_DATE_TIME_LABEL: 'Scheduled Date & Time',

  CALL_CUSTOMER: 'Call Customer',
  NAVIGATE: 'Navigate',
  SWIPE_START_TRIP: 'Swipe Start Trip',
  SWIPE_END_TRIP: 'Swipe End Trip',
  TRIP_TIMER_LABEL: 'Trip Timer',
  SWIPE_COLLECT_PAYMENT: 'Swipe Collect Payment',

  CUSTOMER_DETAILS_TITLE: 'Customer Details',
  TRIP_METRICS_TITLE: 'Trip Metrics',
  BOOKING_DETAILS_TITLE: 'Booking Details',

  EST_DISTANCE: 'Est. Distance',
  EST_DURATION: 'Est. Duration',

  VEHICLE_NUMBER: 'Vehicle Number',
  TRANSMISSION: 'Transmission',
  VEHICLE_MODEL: 'Vehicle Model',

  BOOKING_TIME: 'Booking Time',
  SERVICE_TYPE: 'Service Type',
  SPECIAL_REQUESTS: 'Special Requests',
} as const;

export const TRIPS_COLORS = {
  SCREEN_BG: '#EFEFEF',
  CARD_BG: '#FFFFFF',
  SUBTEXT: '#8E8E8E',
  DIVIDER: '#E7E7E7',
  CARD_SHADOW: '#000000',

  FILTER_ACTIVE_BG: '#0E1738',
  FILTER_ACTIVE_TEXT: '#FFFFFF',
  FILTER_INACTIVE_BG: '#E6E6E6',
  FILTER_INACTIVE_TEXT: '#111827',

  // Status pills
  STATUS_ONGOING_BG: '#DDF2D4',
  STATUS_ONGOING_TEXT: '#2E7D32',
  STATUS_UPCOMING_BG: '#F6E5C8',
  STATUS_UPCOMING_TEXT: '#D97706',
  STATUS_COMPLETED_BG: '#DDF2D4',
  STATUS_COMPLETED_TEXT: '#2E7D32',

  // Route dots
  PICKUP_DOT: '#3F51B5',
  DROP_DOT: '#D32F2F',

  // Details action buttons
  ACTION_BG: '#E6E6E6',
  ACTION_TEXT: '#111827',

  // Trip details
  SWIPE_TRACK_BG: '#1A244B',
  METRIC_CARD_BG: '#EEF0F5',
} as const;

/**
 * Trip Start screen (odometer + vehicle photos)
 */
export const TRIP_START_STRINGS = {
  TITLE: 'Start Trip',
  SUBTITLE: 'Capture vehicle photos and odometer reading to begin.',

  ODOMETER_VALUE_LABEL: 'Odometer Value',
  ODOMETER_VALUE_PLACEHOLDER: 'Enter odometer reading',
  ODOMETER_VALUE_HELPER: 'Example: 12345.5',

  PHOTO_SECTION_TITLE: 'Upload Photos',
  ODOMETER_PHOTO_LABEL: 'Odometer Photo',
  CAR_FRONT_PHOTO_LABEL: 'Car Front Photo',
  CAR_BACK_PHOTO_LABEL: 'Car Back Photo',

  ADD_PHOTO: 'Add Photo',
  CHANGE_PHOTO: 'Change Photo',
  TAKE_PHOTO: 'Take Photo',
  CHOOSE_FROM_GALLERY: 'Choose from Gallery',
  CANCEL: 'Cancel',

  SUBMIT: 'Start Trip',
  SUCCESS: 'Trip started successfully',
  OTP_SENT: 'OTP sent. Please enter OTP to start the trip.',
  OTP_TITLE: 'Verify OTP',
  OTP_LABEL: 'OTP',
  OTP_PLACEHOLDER: 'Enter OTP',
  OTP_HELPER: 'Ask customer for the OTP',
  VERIFY: 'Verify & Start',
  ERROR_TRIP_MISSING: 'Trip details missing. Please try again.',
  ERROR_OTP_REQUIRED: 'Please enter OTP',
  ERROR_INITIATE_FAILED: 'Failed to initiate trip start',
  ERROR_VERIFY_FAILED: 'Failed to verify OTP',

  // Validation / errors
  ERROR_ODOMETER_REQUIRED: 'Please enter odometer value',
  ERROR_ODOMETER_INVALID: 'Please enter a valid odometer value',
  ERROR_ODOMETER_PHOTO_REQUIRED: 'Please add odometer photo',
  ERROR_CAR_FRONT_PHOTO_REQUIRED: 'Please add car front photo',
  ERROR_CAR_BACK_PHOTO_REQUIRED: 'Please add car back photo',
} as const;

export const TRIP_START_LAYOUT = {
  SCREEN_HORIZONTAL_PADDING: 20,
  HEADER_HEIGHT: 56,
  HEADER_TITLE_FONT_SIZE: 17,

  CONTENT_TOP_PADDING: 16,
  CONTENT_GAP: 16,

  CAR_IMAGE_SIZE: 110,
  CAR_IMAGE_RADIUS: 22,

  CARD_RADIUS: 18,
  CARD_PADDING: 16,

  PHOTO_TILE_HEIGHT: 140,
  PHOTO_TILE_RADIUS: 16,
  PHOTO_TILE_GAP: 12,

  ACTION_ROW_GAP: 12,
  ACTION_BTN_HEIGHT: 52,
  ACTION_BTN_RADIUS: 999,

  BOTTOM_PADDING: 24,
} as const;

export const TRIP_START_COLORS = {
  SCREEN_BG: TRIPS_COLORS.SCREEN_BG,
  CARD_BG: TRIPS_COLORS.CARD_BG,
  BORDER: TRIPS_COLORS.DIVIDER,

  SUBTITLE: TRIPS_COLORS.SUBTEXT,

  PHOTO_TILE_BG: '#EEF0F5',
  PHOTO_PLACEHOLDER_ICON: '#9CA3AF',

  PRIMARY_BG: '#0E1738',
  PRIMARY_TEXT: '#FFFFFF',

  SECONDARY_BG: '#E6E6E6',
  SECONDARY_TEXT: '#111827',
} as const;

/**
 * Trip End screen (odometer + odometer photo)
 */
export const TRIP_END_STRINGS = {
  TITLE: 'End Trip',
  SUBTITLE: 'Capture end odometer reading to finish the trip.',

  ODOMETER_VALUE_LABEL: 'Odometer Value',
  ODOMETER_VALUE_PLACEHOLDER: 'Enter end odometer reading',
  ODOMETER_VALUE_HELPER: 'Example: 12350.2',

  PHOTO_SECTION_TITLE: 'Upload Photo',
  ODOMETER_PHOTO_LABEL: 'Odometer Photo',

  ADD_PHOTO: 'Add Photo',
  CHANGE_PHOTO: 'Change Photo',
  TAKE_PHOTO: 'Take Photo',
  CHOOSE_FROM_GALLERY: 'Choose from Gallery',

  SUBMIT: 'End Trip',
  OTP_SENT: 'OTP sent. Please enter OTP to end the trip.',
  OTP_TITLE: 'Verify OTP',
  OTP_LABEL: 'OTP',
  OTP_PLACEHOLDER: 'Enter OTP',
  OTP_HELPER: 'Ask customer for the OTP',
  VERIFY: 'Verify & End',

  SUCCESS_WITH_AMOUNT: 'Trip ended. Amount: ₹{amount}',
  END_VERIFIED_GO_TO_PAYMENT: 'Trip end verified. Collect payment to finish.',

  ERROR_TRIP_MISSING: 'Trip details missing. Please try again.',
  ERROR_ODOMETER_REQUIRED: 'Please enter odometer value',
  ERROR_ODOMETER_INVALID: 'Please enter a valid odometer value',
  ERROR_ODOMETER_PHOTO_REQUIRED: 'Please add odometer photo',
  ERROR_OTP_REQUIRED: 'Please enter OTP',
  ERROR_INITIATE_FAILED: 'Failed to initiate trip end',
  ERROR_VERIFY_FAILED: 'Failed to verify OTP',
} as const;

export const TRIP_END_LAYOUT = {
  SCREEN_HORIZONTAL_PADDING: TRIP_START_LAYOUT.SCREEN_HORIZONTAL_PADDING,
  HEADER_HEIGHT: TRIP_START_LAYOUT.HEADER_HEIGHT,
  HEADER_TITLE_FONT_SIZE: TRIP_START_LAYOUT.HEADER_TITLE_FONT_SIZE,

  CONTENT_TOP_PADDING: TRIP_START_LAYOUT.CONTENT_TOP_PADDING,
  CONTENT_GAP: TRIP_START_LAYOUT.CONTENT_GAP,

  CAR_IMAGE_SIZE: TRIP_START_LAYOUT.CAR_IMAGE_SIZE,
  CAR_IMAGE_RADIUS: TRIP_START_LAYOUT.CAR_IMAGE_RADIUS,

  CARD_RADIUS: TRIP_START_LAYOUT.CARD_RADIUS,
  CARD_PADDING: TRIP_START_LAYOUT.CARD_PADDING,

  PHOTO_TILE_HEIGHT: TRIP_START_LAYOUT.PHOTO_TILE_HEIGHT,
  PHOTO_TILE_RADIUS: TRIP_START_LAYOUT.PHOTO_TILE_RADIUS,

  ACTION_BTN_HEIGHT: TRIP_START_LAYOUT.ACTION_BTN_HEIGHT,
  BOTTOM_PADDING: TRIP_START_LAYOUT.BOTTOM_PADDING,
} as const;

export const TRIP_END_COLORS = {
  SCREEN_BG: TRIP_START_COLORS.SCREEN_BG,
  CARD_BG: TRIP_START_COLORS.CARD_BG,
  BORDER: TRIP_START_COLORS.BORDER,
  SUBTITLE: TRIP_START_COLORS.SUBTITLE,

  PHOTO_TILE_BG: TRIP_START_COLORS.PHOTO_TILE_BG,
  PHOTO_PLACEHOLDER_ICON: TRIP_START_COLORS.PHOTO_PLACEHOLDER_ICON,

  PRIMARY_BG: TRIP_START_COLORS.PRIMARY_BG,
  PRIMARY_TEXT: TRIP_START_COLORS.PRIMARY_TEXT,
  SECONDARY_BG: TRIP_START_COLORS.SECONDARY_BG,
  SECONDARY_TEXT: TRIP_START_COLORS.SECONDARY_TEXT,
} as const;

/**
 * Trip Payment screen (collect + verify payment)
 */
export const TRIP_PAYMENT_STRINGS = {
  TITLE: 'Collect Payment',

  AMOUNT_PREFIX: 'Amount',
  AMOUNT_UNKNOWN: 'Amount: N/A',

  PAYMENT_METHOD_LABEL: 'Payment Method',
  METHOD_UPI: 'UPI',
  METHOD_CASH: 'Cash',
  METHOD_BOTH: 'Both',

  UPI_AMOUNT_LABEL: 'UPI Amount',
  UPI_AMOUNT_PLACEHOLDER: 'Enter UPI amount',
  UPI_AMOUNT_HELPER: 'Enter amount collected via UPI',

  UPI_REFERENCE_LABEL: 'UPI Reference (Optional)',
  UPI_REFERENCE_PLACEHOLDER: 'Enter UPI reference',
  UPI_REFERENCE_HELPER: 'Transaction reference/ID',

  CASH_AMOUNT_LABEL: 'Cash Amount',
  CASH_AMOUNT_PLACEHOLDER: 'Enter cash amount',
  CASH_AMOUNT_HELPER: 'Enter amount collected as cash',

  SUBMIT: 'Submit Payment',
  SUCCESS: 'Payment completed. Trip finished.',

  ERROR_TRIP_MISSING: 'Trip details missing. Please try again.',
  ERROR_DRIVER_MISSING: 'Driver details missing. Please login again.',
  ERROR_FAILED: 'Payment failed. Please try again.',
} as const;

export const TRIP_PAYMENT_LAYOUT = {
  SCREEN_HORIZONTAL_PADDING: TRIP_START_LAYOUT.SCREEN_HORIZONTAL_PADDING,
  HEADER_HEIGHT: TRIP_START_LAYOUT.HEADER_HEIGHT,
  HEADER_TITLE_FONT_SIZE: TRIP_START_LAYOUT.HEADER_TITLE_FONT_SIZE,

  CONTENT_TOP_PADDING: TRIP_START_LAYOUT.CONTENT_TOP_PADDING,
  CONTENT_GAP: 14,

  CARD_RADIUS: TRIP_START_LAYOUT.CARD_RADIUS,
  CARD_PADDING: TRIP_START_LAYOUT.CARD_PADDING,

  METHOD_PILL_HEIGHT: 44,
  METHOD_PILL_RADIUS: 999,

  ACTION_BTN_HEIGHT: TRIP_START_LAYOUT.ACTION_BTN_HEIGHT,
  BOTTOM_PADDING: TRIP_START_LAYOUT.BOTTOM_PADDING,
} as const;

export const TRIP_PAYMENT_COLORS = {
  SCREEN_BG: TRIP_START_COLORS.SCREEN_BG,
  CARD_BG: TRIP_START_COLORS.CARD_BG,
  BORDER: TRIP_START_COLORS.BORDER,
  SUBTITLE: TRIP_START_COLORS.SUBTITLE,

  METHOD_ACTIVE_BG: '#0E1738',
  METHOD_ACTIVE_TEXT: '#FFFFFF',
  METHOD_INACTIVE_BG: '#E6E6E6',
  METHOD_INACTIVE_TEXT: '#111827',

  PRIMARY_BG: TRIP_START_COLORS.PRIMARY_BG,
  PRIMARY_TEXT: TRIP_START_COLORS.PRIMARY_TEXT,
} as const;

export const TRIPS_LAYOUT = {
  SCREEN_HORIZONTAL_PADDING: 20,
  LIST_PADDING_TOP: 16,
  LIST_PADDING_BOTTOM: 24,
  CARD_GAP: 16,

  HEADER_HEIGHT: 56,
  HEADER_TITLE_FONT_SIZE: 17,

  FILTER_ROW_GAP: 12,
  FILTER_PILL_HEIGHT: 44,
  FILTER_PILL_RADIUS: 999,
  FILTER_PILL_PADDING_HORIZONTAL: 22,
  FILTER_FONT_SIZE: 14,

  CARD_RADIUS: 24,
  CARD_PADDING: 20,
  SECTION_GAP: 14,

  STATUS_PILL_HEIGHT: 34,
  STATUS_PILL_RADIUS: 999,
  STATUS_PILL_PADDING_HORIZONTAL: 14,
  STATUS_DOT_SIZE: 10,
  STATUS_FONT_SIZE: 13,

  // Trip card route column
  ROUTE_ICON_SIZE: 12,
  ROUTE_LINE_WIDTH: 2,
  ROUTE_LINE_HEIGHT: 42,

  FOOTER_ICON_SIZE: 18,

  // Trip details
  DETAILS_TOP_PADDING: 16,
  DETAILS_CARD_RADIUS: 24,
  DETAILS_CARD_PADDING: 18,
  DETAILS_ACTION_BTN_HEIGHT: 52,
  DETAILS_ACTION_BTN_RADIUS: 999,
  DETAILS_ACTION_GAP: 14,
  DETAILS_SWIPE_HEIGHT: 64,

  METRIC_CARD_RADIUS: 18,
  METRIC_CARD_PADDING: 16,
} as const;

export type TripStatus = 'ongoing' | 'upcoming' | 'completed';
export type TripFilter = 'all' | TripStatus;

export type TripItem = {
  id: string;
  tripIdLabel: string;
  status: TripStatus;
  /** Raw backend status string (Prisma TripStatus), used for action decisions */
  backendStatus?: string | null;
  customerName: string;
  pickup: string;
  drop: string;
  footerLabel: string;
  scheduledDateTimeLabel: string;
  bookingTimeLabel: string;
  customerPhone: string;
  /** ISO timestamp when trip started (from backend) */
  startedAtISO?: string | null;
  /** ISO timestamp when trip ended (from backend) */
  endedAtISO?: string | null;
  estDistanceKm: string;
  estDurationMin: string;
  vehicleNumber: string;
  transmission: string;
  vehicleModel: string;
  serviceType: string;
  specialRequests: string;
};

export const TRIPS_MOCK_LIST: TripItem[] = [
  {
    id: 'trip-1',
    tripIdLabel: 'TRP-2025-00847',
    status: 'ongoing',
    customerName: 'Rajesh Kumar',
    pickup: 'Koramangala, 4th Block',
    drop: 'Indiranagar Metro Station',
    footerLabel: 'Started at 2:30 PM',
    scheduledDateTimeLabel: '28 Dec 2025, 02:30 PM',
    bookingTimeLabel: '28 Dec 2025, 01:45 PM',
    customerPhone: '+91 98765 43210',
    estDistanceKm: '8.5 km',
    estDurationMin: '25 min',
    vehicleNumber: 'MH 02 AB 1234',
    transmission: 'Automatic',
    vehicleModel: 'Honda City 2022',
    serviceType: 'Point to Point',
    specialRequests: 'None',
  },
  {
    id: 'trip-2',
    tripIdLabel: 'TRP-2025-00848',
    status: 'upcoming',
    customerName: 'Priya Sharma',
    pickup: 'Koramangala, Bangalore',
    drop: 'HSR Layout, Bangalore',
    footerLabel: 'Scheduled for 5:00 PM',
    scheduledDateTimeLabel: '28 Dec 2025, 02:30 PM',
    bookingTimeLabel: '28 Dec 2025, 01:45 PM',
    customerPhone: '+91 98765 43210',
    estDistanceKm: '8.5 km',
    estDurationMin: '25 min',
    vehicleNumber: 'MH 02 AB 1234',
    transmission: 'Automatic',
    vehicleModel: 'Honda City 2022',
    serviceType: 'Point to Point',
    specialRequests: 'None',
  },
  {
    id: 'trip-3',
    tripIdLabel: 'TRP-2025-00846',
    status: 'completed',
    customerName: 'Amit Patel',
    pickup: 'Indiranagar, Bangalore',
    drop: 'Electronic City, Bangalore',
    footerLabel: 'Completed on Jan 15, 2025',
    scheduledDateTimeLabel: '28 Dec 2025, 02:30 PM',
    bookingTimeLabel: '28 Dec 2025, 01:45 PM',
    customerPhone: '+91 98765 43210',
    estDistanceKm: '8.5 km',
    estDurationMin: '25 min',
    vehicleNumber: 'MH 02 AB 1234',
    transmission: 'Automatic',
    vehicleModel: 'Honda City 2022',
    serviceType: 'Point to Point',
    specialRequests: 'None',
  },
] as const;

