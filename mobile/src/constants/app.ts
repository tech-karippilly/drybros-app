/**
 * App configuration constants
 */

export const APP_CONFIG = {
  NAME: 'Drybros',
  VERSION: '1.0.0',
  ORIENTATION: 'portrait' as const,
  SUPPORTED_PLATFORMS: ['ios', 'android'] as const,
} as const;

/** Screen layout (header heights, etc.) */
export const LAYOUT = {
  PROFILE_HEADER_HEIGHT_PERCENT: 20,
} as const;

/** Header label typography: Satoshi Variable Black, 20px, line-height 120% */
export const HEADER_LABEL = {
  FONT_SIZE: 20,
  LINE_HEIGHT_PERCENT: 120,
} as const;

/** Profile circle (avatar + bottom button circle) */
export const PROFILE_CIRCLE = {
  SIZE: 100,
  BORDER_WIDTH: 2,
  BORDER_COLOR: '#FFFFFF',
  BOTTOM_CIRCLE_SIZE: 32,
  BOTTOM_CIRCLE_BACKGROUND: '#000000',
  /** Font size for initials when no profile image */
  INITIALS_FONT_SIZE: 36,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@drybros/auth_token',
  USER_DATA: '@drybros/user_data',
  ONBOARDING_COMPLETED: '@drybros/onboarding_completed',
  THEME: '@drybros/theme',
  LANGUAGE: '@drybros/language',
} as const;