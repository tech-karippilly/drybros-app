/**
 * Leaves screen constants (labels, layout, mock data)
 * Replace mock data with API/store once wired.
 */

export const LEAVES_STRINGS = {
  TITLE: 'Leaves',
  FILTER_ALL: 'All',
  FILTER_PENDING: 'Pending',
  FILTER_APPROVED: 'Approved',
  FILTER_REJECTED: 'Rejected',
} as const;

export const LEAVES_LAYOUT = {
  SCREEN_HORIZONTAL_PADDING: 20,
  LIST_PADDING_TOP: 16,
  LIST_PADDING_BOTTOM: 24,
  CARD_GAP: 16,

  HEADER_HEIGHT: 56,
  HEADER_TITLE_FONT_SIZE: 17,

  FILTER_ROW_GAP: 12,
  FILTER_PILL_HEIGHT: 44,
  FILTER_PILL_RADIUS: 999,
  FILTER_PILL_PADDING_HORIZONTAL: 22,
  FILTER_FONT_SIZE: 14,

  CARD_RADIUS: 24,
  CARD_PADDING: 20,
  CARD_ROW_GAP: 10,
  CARD_TITLE_FONT_SIZE: 18,

  STATUS_PILL_HEIGHT: 34,
  STATUS_PILL_RADIUS: 999,
  STATUS_PILL_PADDING_HORIZONTAL: 14,
  STATUS_DOT_SIZE: 10,
  STATUS_FONT_SIZE: 13,

  FAB_SIZE: 64,
  FAB_RADIUS: 999,
  FAB_ICON_SIZE: 32,
  FAB_RIGHT: 18,
  /**
   * Extra spacing above the tab bar area.
   * Keep small so FAB stays low (as per design).
   */
  FAB_BOTTOM_OFFSET: 8,
} as const;

export const LEAVES_COLORS = {
  SCREEN_BG: '#EFEFEF',
  CARD_BG: '#FFFFFF',
  SUBTEXT: '#8E8E8E',
  DIVIDER: '#E7E7E7',

  FILTER_ACTIVE_BG: '#0E1738', // deep navy
  FILTER_ACTIVE_TEXT: '#FFFFFF',
  FILTER_INACTIVE_BG: '#E6E6E6',
  FILTER_INACTIVE_TEXT: '#111827',

  STATUS_APPROVED_BG: '#DDF2D4',
  STATUS_APPROVED_TEXT: '#2E7D32',
  STATUS_APPROVED_DOT: '#2E7D32',

  STATUS_REJECTED_BG: '#F8D2D2',
  STATUS_REJECTED_TEXT: '#D32F2F',
  STATUS_REJECTED_DOT: '#D32F2F',

  STATUS_PENDING_BG: '#F6E5C8',
  STATUS_PENDING_TEXT: '#D97706',
  STATUS_PENDING_DOT: '#D97706',

  FAB_BG: '#DE4A48',
  FAB_ICON: '#FFFFFF',

  CARD_SHADOW: '#000000',
} as const;

export type LeaveStatus = 'approved' | 'rejected' | 'pending';

export type LeaveItem = {
  id: string;
  dateLabel: string;
  title: string;
  status: LeaveStatus;
};

export const LEAVES_MOCK_LIST: LeaveItem[] = [
  { id: 'leave-1', dateLabel: 'Jan 15, 2025', title: 'Personal work', status: 'approved' },
  { id: 'leave-2', dateLabel: 'Jan 22 - Jan 23, 2025', title: 'Family function', status: 'rejected' },
  { id: 'leave-3', dateLabel: 'Jan 10, 2025', title: 'Medical appointment', status: 'pending' },
  { id: 'leave-4', dateLabel: 'Dec 28, 2024', title: 'Vehicle maintenance', status: 'approved' },
  { id: 'leave-5', dateLabel: 'Dec 20 - Dec 21, 2024', title: 'Out of town', status: 'approved' },
  { id: 'leave-6', dateLabel: 'Dec 15, 2024', title: 'Personal reason', status: 'pending' },
] as const;

