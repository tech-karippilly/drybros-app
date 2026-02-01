/**
 * Trip Request modal constants
 * Centralized strings, layout values, icon name, and colors.
 */

import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './colors';

export const TRIP_REQUEST_STRINGS = {
  TITLE: 'New Trip Assigned',
  ASSIGNED_MESSAGE: (tripId: string) => `Trip ID ${tripId} has been assigned to you.`,

  ACCEPT: 'Accept',
  REJECT: 'Reject',
  VIEW_TRIP: 'View Trip',
} as const;

export const TRIP_REQUEST_LAYOUT = {
  /** Icon concentric rings */
  ICON_OUTER_SIZE: 150,
  ICON_MIDDLE_SIZE: 110,
  ICON_INNER_SIZE: 70,
  ICON_SIZE: 30,

  /** Spacing */
  CONTENT_GAP: 16,
  BUTTON_ROW_GAP: 14,
  BUTTON_TOP_MARGIN: 18,
  ACTIONS_VERTICAL_GAP: 12,
  MESSAGE_TOP_MARGIN: 8,
  MESSAGE_MAX_WIDTH: 320,

  /** Buttons */
  ACTION_BUTTON_HEIGHT: 58,
  VIEW_BUTTON_HEIGHT: 58,
} as const;

export const TRIP_REQUEST_COLORS = {
  /** Icon/rings */
  ICON: COLORS.success,
  ICON_INNER_BG: '#D8F2CE',
  RING_OUTER_BG: 'rgba(16, 185, 129, 0.18)', // success @ ~18%
  RING_MIDDLE_BG: 'rgba(16, 185, 129, 0.12)', // success @ ~12%

  /** Buttons */
  ACCEPT_BG: COLORS.success,
  ACCEPT_TEXT: COLORS.white,

  REJECT_BG: '#FAD1D1',
  REJECT_TEXT: COLORS.error,

  VIEW_BG: '#E6E6E6',
  VIEW_TEXT: COLORS.textPrimary,

  /** Copy */
  TITLE: COLORS.textPrimary,
  MESSAGE: COLORS.textSecondary,
} as const;

export const TRIP_REQUEST_ICON = {
  /** Ionicons name */
  NAME: 'car-outline' as ComponentProps<typeof Ionicons>['name'],
} as const;

