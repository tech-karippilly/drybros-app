export const DRIVERS_ROUTES = {
    LIST: '/drivers',
    CREATE: '/drivers/create',
    EDIT: '/drivers/edit',
} as const;

export const DRIVERS_API_ENDPOINTS = {
    LIST: '/drivers',
    CREATE: '/drivers',
    UPDATE: '/drivers',
    DELETE: '/drivers',
} as const;

export const DRIVERS_STRINGS = {
    TITLE: 'Driver Management',
    LIST_TITLE: 'Drivers',
    CREATE_TITLE: 'Create New Driver',
    EDIT_TITLE: 'Edit Driver',
    NAME: 'Driver Name',
    NAME_PLACEHOLDER: 'Enter driver name',
    LIST_ERROR: 'Failed to load drivers',
    CREATE_ERROR: 'Failed to create driver',
    EDIT_ERROR: 'Failed to edit driver',
    DELETE_ERROR: 'Failed to delete driver',
    UPDATE_ERROR: 'Failed to update driver',
} as const;
export * from './drivers';

