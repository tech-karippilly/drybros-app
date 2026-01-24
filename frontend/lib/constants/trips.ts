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
