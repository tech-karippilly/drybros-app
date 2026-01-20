/**
 * Permission-related constants
 */

export const PERMISSION_TYPES = {
  LOCATION: 'location',
  CAMERA: 'camera',
  NOTIFICATIONS: 'notifications',
  SMS: 'sms',
  STORAGE: 'storage',
} as const;

export const PERMISSION_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
  RESTRICTED: 'restricted',
} as const;

export const PERMISSION_MESSAGES = {
  LOCATION_REQUIRED: 'Location permission is required for this feature',
  CAMERA_REQUIRED: 'Camera permission is required to take photos',
  NOTIFICATIONS_REQUIRED: 'Notification permission is required to receive updates',
  SMS_REQUIRED: 'SMS permission is required to send messages',
  PERMISSION_DENIED: 'Permission denied. Please enable it in settings',
} as const;