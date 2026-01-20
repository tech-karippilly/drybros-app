/**
 * App configuration constants
 */

export const APP_CONFIG = {
  NAME: 'Drybros',
  VERSION: '1.0.0',
  ORIENTATION: 'portrait' as const,
  SUPPORTED_PLATFORMS: ['ios', 'android'] as const,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@drybros/auth_token',
  USER_DATA: '@drybros/user_data',
  ONBOARDING_COMPLETED: '@drybros/onboarding_completed',
  THEME: '@drybros/theme',
  LANGUAGE: '@drybros/language',
} as const;