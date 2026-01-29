/**
 * Badge component constants
 * Satoshi Variable Medium 15px, line-height 100%, variant backgrounds
 */

export const BADGE = {
  /** Label typography: Satoshi Variable Medium, 15px, line-height 100% */
  FONT_SIZE: 15,
  LINE_HEIGHT_PERCENT: 100,

  /** Variant background colors (with alpha) */
  SUCCESS_BACKGROUND: '#4FAF0133',
  PENDING_BACKGROUND: '#DE850933',
  REJECTED_BACKGROUND: '#DE090933',
  ON_PROCESS_BACKGROUND: '#87CEEB33', // sky blue with alpha

  /** Variant text colors (contrast with background) */
  SUCCESS_TEXT: '#2d6601',
  PENDING_TEXT: '#b36b07',
  REJECTED_TEXT: '#b30606',
  ON_PROCESS_TEXT: '#1e5f7a',
} as const;

export type BadgeVariant = 'success' | 'pending' | 'rejected' | 'onProcess';
