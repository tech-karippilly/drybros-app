/**
 * App configuration constants
 */

export { STORAGE_KEYS } from './storageKeys';

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

/** Profile content card below header */
export const PROFILE_CARD = {
  BACKGROUND: '#FFFFFF',
  BORDER_RADIUS_TOP: 24,
  BORDER_RADIUS_BOTTOM: 24,
  MARGIN_LEFT: 16,
  MARGIN_RIGHT: 16,
  MARGIN_BOTTOM: 16,
  /** HR gradient line: transparent → #DDDDDD → transparent (90deg) */
  HR_GRADIENT_COLORS: ['rgba(221, 221, 221, 0)', '#DDDDDD', 'rgba(221, 221, 221, 0)'] as const,
  HR_GRADIENT_LOCATIONS: [0.0226, 0.5113, 1] as const,
} as const;

/** Profile screen background gradient (180deg: top → bottom) */
export const PROFILE_SCREEN_GRADIENT = {
  TOP: '#ECECEC',
  BOTTOM: '#DBDBDB',
} as const;

/** Profile circle (avatar + edit icon at bottom-right) */
export const PROFILE_CIRCLE = {
  SIZE: 100,
  /** Thin border – light grey (almost white) per design */
  BORDER_WIDTH: 2,
  BORDER_COLOR: '#E8E8E8',
  BOTTOM_CIRCLE_SIZE: 32,
  /** Edit icon circle – dark grey/black, white icon on top */
  BOTTOM_CIRCLE_BACKGROUND: '#1F2937',
  /** Font size for initials when no profile image */
  INITIALS_FONT_SIZE: 36,
} as const;