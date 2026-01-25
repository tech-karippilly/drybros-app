/**
 * Trip-related constants
 */

export const CAR_GEAR_TYPES = {
    MANUAL: "MANUAL",
    AUTOMATIC: "AUTOMATIC",
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

/** Statuses that allow reschedule */
export const RESCHEDULABLE_TRIP_STATUSES = ['PENDING', 'NOT_ASSIGNED', 'REQUESTED', 'ASSIGNED', 'DRIVER_ACCEPTED'] as const;

/** Statuses that allow cancel */
export const CANCELLABLE_TRIP_STATUSES = ['PENDING', 'NOT_ASSIGNED', 'REQUESTED', 'ASSIGNED', 'DRIVER_ACCEPTED'] as const;

/** Statuses that allow reassign (has driver, not started) */
export const REASSIGNABLE_TRIP_STATUSES = ['ASSIGNED', 'DRIVER_ACCEPTED'] as const;
