/**
 * Earnings screen constants (labels, layout, mock data)
 * Replace mock data with API/store once wired.
 */

export const EARNINGS_STRINGS = {
  TITLE: 'Earnings',
  PERIOD_DAILY: 'Daily',
  PERIOD_MONTHLY: 'Monthly',
  PERIOD_YEARLY: 'Yearly',
  TODAY: 'Today',
  TOTAL_EARNINGS: 'Total Earnings',
  INCENTIVES: 'Incentives',
  BONUS: 'Bonus',
  HISTORY_TITLE: 'Earnings History',
  COL_EARNINGS: 'Earnings',
  COL_INCENTIVE: 'Incentive',
  COL_BONUS: 'Bonus',
} as const;

export const EARNINGS_LAYOUT = {
  SCREEN_HORIZONTAL_PADDING: 20,
  HEADER_HEIGHT: 56,
  HEADER_ICON_SIZE: 28,
  HEADER_TITLE_FONT_SIZE: 18,
  HEADER_SIDE_BTN_SIZE: 44,
  TABS_HEIGHT: 52,
  TAB_PILL_HEIGHT: 44,
  TAB_PILL_RADIUS: 26,
  CARD_RADIUS: 24,
  INNER_CARD_RADIUS: 16,
  GAP: 14,
  LIST_BOTTOM_PADDING: 24,
  HISTORY_ROW_VERTICAL_PADDING: 18,
} as const;

/**
 * Screen-specific colors (kept here to avoid polluting global COLORS)
 */
export const EARNINGS_COLORS = {
  SCREEN_BG: '#EFEFEF',
  TAB_BG: '#ECECEC',
  TAB_ACTIVE_BG: '#151B4A',
  TAB_ACTIVE_TEXT: '#FFFFFF',
  TAB_INACTIVE_TEXT: '#7B7B7B',
  CARD_BG: '#FFFFFF',
  TOTAL_BG: '#E7E2FF',
  INCENTIVE_BG: '#DFF6DF',
  BONUS_BG: '#DCECF7',
  SUBTEXT: '#8E8E8E',
  DIVIDER: '#E7E7E7',
} as const;

export const EARNINGS_MOCK_SUMMARY = {
  total: '₹ 8,450',
  incentives: '₹ 1,200',
  bonus: '₹ 500',
} as const;

export const EARNINGS_MOCK_HISTORY = [
  { dateLabel: '27 Dec 2025', earnings: '₹ 1,450', incentive: '₹ 250', bonus: '₹ 0' },
  { dateLabel: '26 Dec 2025', earnings: '₹ 1,450', incentive: '₹ 250', bonus: '₹ 0' },
  { dateLabel: '25 Dec 2025', earnings: '₹ 1,350', incentive: '₹ 200', bonus: '₹ 150' },
  { dateLabel: '24 Dec 2025', earnings: '₹ 1,200', incentive: '₹ 150', bonus: '₹ 100' },
  { dateLabel: '23 Dec 2025', earnings: '₹ 950', incentive: '₹ 100', bonus: '₹ 0' },
] as const;

