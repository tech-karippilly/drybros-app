/**
 * Alerts screen constants (labels, layout, mock data)
 * Replace mock data with API/store once wired.
 */

/**
 * Centralized strings for Alerts screen UI.
 */
export const ALERTS_STRINGS = {
  TITLE: 'Alerts',

  // Primary alert actions
  ACCEPT: 'Accept',
  REJECT: 'Reject',
  VIEW_TRIP: 'View Trip',

  // Common copy fragments
  TRIP_ID_PREFIX: 'Trip ID',
} as const;

/**
 * Layout constants for Alerts screen.
 * Use with normalizeWidth / normalizeHeight.
 */
export const ALERTS_LAYOUT = {
  SCREEN_HORIZONTAL_PADDING: 20,
  LIST_PADDING_TOP: 16,
  LIST_PADDING_BOTTOM: 24,
  CARD_GAP: 16,

  HEADER_HEIGHT: 56,
  HEADER_TITLE_FONT_SIZE: 18,

  CARD_RADIUS: 24,
  CARD_PADDING: 20,
  CARD_TITLE_GAP: 8,
  CARD_TIME_FONT_SIZE: 14,

  ACCENT_WIDTH: 6,

  // Expanded card actions
  ACTION_ROW_GAP: 14,
  ACTION_BUTTON_HEIGHT: 44,
  ACTION_BUTTON_RADIUS: 999,
  ACTION_BUTTON_FONT_SIZE: 16,
  ACTION_SECONDARY_HEIGHT: 44,
  ACTION_SECONDARY_RADIUS: 999,
  ACTION_SECONDARY_FONT_SIZE: 16,
} as const;

/**
 * Screen-specific colors (kept here to avoid polluting global COLORS).
 * These are scoped to the Alerts screen design.
 */
export const ALERTS_COLORS = {
  SCREEN_BG: '#EFEFEF',
  CARD_BG: '#FFFFFF',
  SUBTEXT: '#8E8E8E',

  // Shadow for cards
  CARD_SHADOW: '#000000',

  // Accent colors by alert type
  ACCENT_SUCCESS: '#4CAF50',
  ACCENT_ERROR: '#D32F2F',
  ACCENT_INFO: '#3F51B5',
  ACCENT_WARNING: '#F59E0B',

  // Action buttons
  ACCEPT_BG: '#4CAF50',
  ACCEPT_TEXT: '#FFFFFF',
  REJECT_BG: '#F8D2D2',
  REJECT_TEXT: '#D32F2F',
  VIEW_BG: '#E6E6E6',
  VIEW_TEXT: '#111827',
} as const;

export type AlertType = 'trip_assigned' | 'trip_accepted' | 'trip_rejected' | 'ride_started' | 'payment_pending' | 'payment_completed' | 'leave_approved' | 'leave_rejected' | 'profile_approved';

export type AlertItem = {
  id: string;
  type: AlertType;
  title: string;
  timeLabel: string;
  /**
   * Message template split so we can render Trip ID in bold.
   * If `tripIdLabel` is present:
   * - render: `${messagePrefix} Trip ID <bold>{tripIdLabel}</bold> ${messageSuffix}`
   * Else:
   * - render: `messagePrefix`
   */
  messagePrefix: string;
  messageSuffix?: string;
  isActionable?: boolean;
  tripIdLabel?: string;
};

/**
 * Mock list mirroring the provided design screenshot.
 */
export const ALERTS_MOCK_LIST: AlertItem[] = [
  {
    id: 'alert-1',
    type: 'trip_assigned',
    title: 'New Trip Assigned',
    timeLabel: 'Today, 10:30 AM',
    tripIdLabel: 'TRP-2025-00848',
    messagePrefix: '',
    messageSuffix: 'has been assigned to you.',
    isActionable: true,
  },
  {
    id: 'alert-2',
    type: 'trip_accepted',
    title: 'Trip Accepted',
    timeLabel: 'Today, 10:31 AM',
    tripIdLabel: 'TRP-2025-00325',
    messagePrefix: 'You have accepted',
    messageSuffix: '.',
  },
  {
    id: 'alert-3',
    type: 'trip_rejected',
    title: 'Trip Rejected',
    timeLabel: 'Today, 10:31 AM',
    tripIdLabel: 'TRP-2025-00184',
    messagePrefix: 'You have rejected',
    messageSuffix: '.',
  },
  {
    id: 'alert-4',
    type: 'ride_started',
    title: 'Ride Started',
    timeLabel: 'Today, 11:00 AM',
    tripIdLabel: 'TRP-2025-00735',
    messagePrefix: 'Ride for',
    messageSuffix: 'has started.',
  },
  {
    id: 'alert-5',
    type: 'payment_pending',
    title: 'Payment Pending',
    timeLabel: 'Today, 12:16 PM',
    tripIdLabel: 'TRP-2025-00736',
    messagePrefix: 'Payment for',
    messageSuffix: 'is marked as pending.',
  },
  {
    id: 'alert-6',
    type: 'payment_completed',
    title: 'Payment Completed',
    timeLabel: 'Today, 12:20 PM',
    tripIdLabel: 'TRP-2025-00143',
    messagePrefix: 'Payment for',
    messageSuffix: 'has been completed.',
  },
  {
    id: 'alert-7',
    type: 'leave_approved',
    title: 'Leave Approved',
    timeLabel: 'Yesterday, 6:45 PM',
    messagePrefix: 'Your leave request for 12 Aug 2025 has been approved.',
  },
  {
    id: 'alert-8',
    type: 'leave_rejected',
    title: 'Leave Rejected',
    timeLabel: 'Yesterday, 6:50 PM',
    messagePrefix: 'Your leave request for 15 Aug 2025 has been rejected.',
  },
  {
    id: 'alert-9',
    type: 'profile_approved',
    title: 'Profile Approved',
    timeLabel: '2 days ago',
    messagePrefix: 'Your profile has been approved. You can now start accepting trips.',
  },
] as const;

