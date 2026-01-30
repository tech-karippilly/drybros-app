/**
 * Complaints screen constants (labels, layout, mock data)
 * Replace mock data with API/store once wired.
 */

export const COMPLAINTS_STRINGS = {
  TITLE: 'Complaints',
  ID_LABEL: 'ID',
  RAISED_ON_PREFIX: 'Raised on',
} as const;

export const COMPLAINTS_LAYOUT = {
  SCREEN_HORIZONTAL_PADDING: 20,
  HEADER_HEIGHT: 56,
  HEADER_ICON_SIZE: 28,
  HEADER_TITLE_FONT_SIZE: 18,
  HEADER_SIDE_BTN_SIZE: 44,
  CARD_RADIUS: 24,
  CARD_PADDING: 20,
  CARD_GAP: 16,
  LIST_PADDING_TOP: 16,
  LIST_PADDING_BOTTOM: 24,
  CARD_ID_MARGIN_BOTTOM: 8,
  CARD_TITLE_MARGIN_BOTTOM: 12,
  META_ICON_SIZE: 18,
  META_GAP: 10,
} as const;

/**
 * Screen-specific colors (kept here to avoid polluting global COLORS)
 */
export const COMPLAINTS_COLORS = {
  SCREEN_BG: '#EFEFEF',
  CARD_BG: '#FFFFFF',
  SUBTEXT: '#8E8E8E',
  DIVIDER: '#E7E7E7',
} as const;

export type ComplaintListItem = {
  idLabel: string;
  title: string;
  raisedOnLabel: string;
};

export const COMPLAINTS_MOCK_LIST: ComplaintListItem[] = [
  { idLabel: '#CPL-2847', title: 'Customer misbehavior during trip', raisedOnLabel: 'Jan 15, 2025' },
  { idLabel: '#CPL-2791', title: 'Incorrect payment received', raisedOnLabel: 'Jan 12, 2025' },
  { idLabel: '#CP-2654', title: 'Late arrival complaint from customer', raisedOnLabel: 'Jan 08, 2025' },
] as const;

