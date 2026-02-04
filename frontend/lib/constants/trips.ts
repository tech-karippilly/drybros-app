/**
 * Trip-related constants
 */

export const CAR_GEAR_TYPES = {
    MANUAL: "MANUAL",
    AUTOMATIC: "AUTOMATIC",
    EV: "EV",
} as const;

export type CarGearType = typeof CAR_GEAR_TYPES[keyof typeof CAR_GEAR_TYPES];

export const CAR_TYPE_CATEGORIES = {
    PREMIUM: "PREMIUM",
    LUXURY: "LUXURY",
    NORMAL: "NORMAL",
} as const;

export type CarTypeCategory = typeof CAR_TYPE_CATEGORIES[keyof typeof CAR_TYPE_CATEGORIES];

export const TRIP_ROUTES = {
    LIST: '/trips',
    CREATE: '/trips/create',
    EDIT: '/trips/edit',
} as const;

export const TRIP_API_ENDPOINTS = {
    LIST: '/trips',
    CREATE: '/trips',
    UPDATE: '/trips',
    DELETE: '/trips',
} as const;

export const TRIP_STRINGS = {
    TITLE: 'Trip Management',
    LIST_TITLE: 'Trips',
    CREATE_TITLE: 'Create New Trip',
    EDIT_TITLE: 'Edit Trip',
    LIST_ERROR: 'Failed to load trips',
    CREATE_ERROR: 'Failed to create trip',
    EDIT_ERROR: 'Failed to edit trip',
    DELETE_ERROR: 'Failed to delete trip',
    UPDATE_ERROR: 'Failed to update trip',
} as const;

/** Alias + extra keys for CreateTripForm */
export const TRIPS_STRINGS = {
    ...TRIP_STRINGS,
    STEP_1_TITLE: 'Customer & Trip Details',
    STEP_2_TITLE: 'Review & Confirm',
    CUSTOMER_NAME: 'Customer name',
    CUSTOMER_NAME_PLACEHOLDER: 'Full name',
    PHONE: 'Phone',
    PHONE_PLACEHOLDER: '10-digit number',
    ALTERNATIVE_PHONE: 'Alternative phone',
    ALTERNATIVE_PHONE_PLACEHOLDER: 'Optional',
    EMAIL: 'Email',
    EMAIL_PLACEHOLDER: 'email@example.com',
    TRIP_TYPE: 'Trip type',
    CAR_TYPE: 'Car type',
    SCHEDULED_AT: 'Scheduled at',
    SCHEDULED_DATE: 'Date',
    SCHEDULED_TIME: 'Time',
    PICKUP_LOCATION: 'Pickup location',
    PICKUP_LOCATION_PLACEHOLDER: 'Address or landmark',
    PICKUP_NOTE_PLACEHOLDER: 'Optional note',
    DESTINATION_LOCATION: 'Destination',
    DESTINATION_LOCATION_PLACEHOLDER: 'Address or landmark',
    DESTINATION_NOTE_PLACEHOLDER: 'Optional note',
    IS_DETAILS_RECONFIRMED: 'Details reconfirmed',
    IS_FARE_DISCUSSED: 'Fare discussed',
    IS_PRICE_ACCEPTED: 'Price accepted',
    NEXT_STEP: 'Next',
    PREVIOUS_STEP: 'Previous',
} as const;

/** Book a Trip page – UI strings matching Dybros Dispatch design */
export const BOOKING_STRINGS = {
    BREADCRUMB_DASHBOARD: 'Dashboard',
    BREADCRUMB_TRIPS: 'Trips',
    BREADCRUMB_BOOK: 'Book a Trip',
    PAGE_TITLE: 'Book a Trip',
    PAGE_SUBTITLE: 'Enter trip details to assign a driver and vehicle.',
    SAVE_AS_DRAFT: 'Save as Draft',
    CUSTOMER_INFO: 'Customer Information',
    CUSTOMER_FULL_NAME: 'Customer Full Name',
    CUSTOMER_FULL_NAME_PLACEHOLDER: 'John Doe',
    PHONE_NUMBER: 'Phone Number',
    PHONE_PLACEHOLDER: '+1 (555) 000-0000',
    EMAIL_ADDRESS: 'Email Address',
    EMAIL_PLACEHOLDER: 'john.doe@example.com',
    CAR_DETAILS: 'Car Details',
    CAR_MODEL_NAME: 'Car Model / Name',
    CAR_MODEL_PLACEHOLDER: 'e.g. Mercedes-Benz S-Class',
    TRANSMISSION_TYPE: 'Transmission Type',
    TRANSMISSION_AUTOMATIC: 'Automatic',
    TRANSMISSION_MANUAL: 'Manual',
    TRANSMISSION_EV: 'EV',
    VEHICLE_CATEGORY: 'Vehicle Category',
    VEHICLE_NORMAL: 'Normal',
    VEHICLE_PREMIUM: 'Premium',
    VEHICLE_LUXURY: 'Luxury',
    TRIP_LOGISTICS: 'Trip Logistics',
    LOCATION: 'Location',
    LOCATION_PLACEHOLDER_PICKUP: 'Search for pickup location...',
    LOCATION_PLACEHOLDER_DESTINATION: 'Search for destination location...',
    PICKUP_ADDRESS: 'Pickup Address',
    PICKUP_ADDRESS_PLACEHOLDER: 'Enter pickup address',
    DESTINATION_ADDRESS: 'Destination Address',
    DESTINATION_ADDRESS_PLACEHOLDER: 'Enter destination address',
    NOTE_SPECIAL_INSTRUCTIONS: 'Note (special instructions)',
    NOTE_PICKUP_PLACEHOLDER: 'e.g. Building, entrance, gate code',
    NOTE_DESTINATION_PLACEHOLDER: 'e.g. Drop at reception, call on arrival',
    MAP_PREVIEW: 'Map Preview',
    OPERATIONAL_DETAILS: 'Operational Details',
    FRANCHISE_OFFICE: 'Franchise Office',
    TRIP_TYPE: 'Trip Type',
    SCHEDULED_DATE: 'Scheduled Date',
    SCHEDULED_TIME: 'Scheduled Time',
    DETAILS_RECONFIRMED: 'Details Reconfirmed with Customer',
    CANCEL: 'Cancel',
    BOOK_TRIP_NOW: 'Book Trip Now',
    CREATING: 'Creating...',
    SELECT_FRANCHISE: 'Select franchise',
    SELECT_TRIP_TYPE: 'Select trip type',
    LOADING_FRANCHISES: 'Loading franchises...',
    SUCCESS_CREATED_REDIRECTING_REQUEST_DRIVERS:
        'Trip created successfully! Redirecting to request drivers...',
} as const;

/** Statuses that allow reschedule */
export const RESCHEDULABLE_TRIP_STATUSES = ['PENDING', 'NOT_ASSIGNED', 'REQUESTED', 'ASSIGNED', 'DRIVER_ACCEPTED'] as const;

/** Statuses that allow cancel */
export const CANCELLABLE_TRIP_STATUSES = ['PENDING', 'NOT_ASSIGNED', 'REQUESTED', 'ASSIGNED', 'DRIVER_ACCEPTED'] as const;

/** Statuses that allow reassign (has driver, not started) */
export const REASSIGNABLE_TRIP_STATUSES = ['ASSIGNED', 'DRIVER_ACCEPTED'] as const;

/** Assign Driver screen (after booking) – Dybros Dispatch style */
export const ASSIGN_DRIVER_STRINGS = {
    PAGE_TITLE: 'Assign Driver',
    PAGE_SUBTITLE: 'Select a driver for the upcoming scheduled trip.',
    TRIP_DETAILS: 'Trip Details',
    PICKUP: 'Pickup',
    DESTINATION: 'Destination',
    DATE: 'Date',
    TIME: 'Time',
    QUICK_ACTIONS: 'Quick Actions',
    CURRENT_TRIP_MANIFEST: 'Current Trip Manifest',
    FULL_ROUTE_MAP: 'Full Route Map',
    TRIP_LOGS: 'Trip Logs',
    SEARCH_PLACEHOLDER: 'Search driver by name...',
    DISTANCE_CLOSEST: 'Distance: Closest',
    RATING_ANY: 'Rating: Any',
    AVAILABLE_DRIVERS: 'Available Drivers',
    ASSIGN_TO_TRIP: 'Assign to Trip',
    ASSIGNING: 'Assigning...',
    SCHEDULED: 'Scheduled',
    TRIP_ID: 'Trip ID',
    BACK_TO_BOOKING: 'Back to Booking',
    SKIP_FOR_NOW: 'Skip for Now',
    NO_DRIVERS: 'No available drivers for this trip.',
    LOADING_TRIP: 'Loading trip details...',
    LOADING_DRIVERS: 'Loading available drivers...',
} as const;

/** Request Drivers screen (after booking) – trigger trip offers via dispatch */
export const REQUEST_DRIVERS_STRINGS = {
    PAGE_TITLE: 'Request Drivers',
    PAGE_SUBTITLE: 'Send this trip request to drivers (all or specific).',
    DISPATCH_NOTE:
        'Dispatch already starts automatically after booking. Use this screen to request immediately or target specific drivers.',
    INVALID_TRIP: 'Invalid trip. Missing trip ID.',
    PLACEHOLDER_DASH: '—',
    ERROR_LOAD_TRIP: 'Failed to load trip details',
    ERROR_REQUEST_DRIVERS: 'Failed to request drivers',
    ERROR_REQUEST_DRIVER: 'Failed to request driver',
    TRIP_DETAILS: 'Trip Details',
    PICKUP: 'Pickup',
    DESTINATION: 'Destination',
    DATE: 'Date',
    TIME: 'Time',
    SEARCH_PLACEHOLDER: 'Search driver by name...',
    AVAILABLE_DRIVERS: 'Drivers',
    REQUEST_ALL: 'Request All Drivers Now',
    REQUEST_DRIVER: 'Request Driver',
    REQUESTING: 'Requesting...',
    MANUAL_ASSIGN: 'Manual Assign',
    BACK_TO_BOOKING: 'Back to Booking',
    LOADING_TRIP: 'Loading trip details...',
    LOADING_DRIVERS: 'Loading drivers...',
    NO_DRIVERS: 'No eligible drivers found for this trip.',
    REQUESTED_COUNT_TEMPLATE: 'Requested {count} driver(s).',
} as const;
