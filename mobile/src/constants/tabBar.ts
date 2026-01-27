/**
 * Tab bar design constants
 * Responsive-friendly: use with normalizeWidth / normalizeHeight
 */

import { normalizeHeight, getBottomSafeArea } from '../utils/responsive';

export const TAB_BAR = {
  /** Tab bar container (solid, not transparent) */
  BACKGROUND: '#090C20',
  BORDER_RADIUS: 50,
  PADDING: 8,
  HEIGHT: 64,
  HORIZONTAL_MARGIN: 24,

  /** Active tab pill */
  ACTIVE_BACKGROUND: '#DE4A48',
  ACTIVE_BORDER_RADIUS: 46,
  ACTIVE_HEIGHT: 48,
  ACTIVE_PADDING_VERTICAL: 12,
  ACTIVE_PADDING_HORIZONTAL: 20,
  ACTIVE_GAP: 14,

  /** Inactive tab icon/text */
  INACTIVE_OPACITY: 0.7,
} as const;

/** Bottom padding for tab screens so content is not covered by floating tab bar */
export const TAB_BAR_SCENE_PADDING_BOTTOM =
  normalizeHeight(8) +
  normalizeHeight(TAB_BAR.HEIGHT) +
  normalizeHeight(12) +
  getBottomSafeArea();

/** Tab labels shown in tab bar (simple, for uneducated users) */
export const TAB_LABELS = {
  HOME: 'Home',
  TRIP: 'Trip',
  LEAVE: 'Leave',
  ALERTS: 'Alerts',
  PROFILE: 'Profile',
} as const;

/** MaterialCommunityIcons icon names per tab */
export const TAB_ICONS = {
  HOME: 'home-outline',
  TRIP: 'steering',
  LEAVE: 'calendar',
  ALERTS: 'bell',
  PROFILE: 'account',
} as const;
