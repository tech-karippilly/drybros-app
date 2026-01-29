/**
 * Primary button / button with icon constants
 * Design: 322×60, border-radius 44, padding 13/16, gap 11, Satoshi 15px
 */

export const PRIMARY_BUTTON = {
  /** Border radius */
  BORDER_RADIUS: 44,

  /** Padding (design reference) */
  PADDING_TOP: 13,
  PADDING_RIGHT: 16,
  PADDING_BOTTOM: 13,
  PADDING_LEFT: 16,

  /** Gap between icon and label */
  GAP: 11,

  /** Label typography: Satoshi Variable Medium, 15px, line-height 100% */
  LABEL_FONT_SIZE: 15,
  LABEL_LINE_HEIGHT_PERCENT: 100,
} as const;
