/**
 * Swipe button / swipe-to-confirm component constants
 * Design: track (rounded rect), thumb (circle with >> icon), label with gradient
 */

export const SWIPE_BUTTON = {
  /** Track (container) */
  TRACK_HEIGHT: 60,
  TRACK_BORDER_RADIUS: 40,
  TRACK_PADDING_TOP: 12,
  TRACK_PADDING_RIGHT: 7,
  TRACK_PADDING_BOTTOM: 12,
  TRACK_PADDING_LEFT: 7,
  TRACK_GAP: 11,

  /** Thumb (draggable circle) */
  THUMB_SIZE: 46,
  THUMB_BORDER_RADIUS: 50, // circle (half of size = 23, use 50 for pill/circle)
  THUMB_GAP: 10,
  THUMB_PADDING: 15,

  /** Label typography: Satoshi Variable Medium, 15px, line-height 100% */
  LABEL_FONT_SIZE: 15,
  LABEL_LINE_HEIGHT_PERCENT: 100,

  /** Swipe completion threshold (0–1); beyond this triggers onSwipeComplete */
  COMPLETE_THRESHOLD: 0.85,

  /** Default gradient colors for label [start, end] */
  LABEL_GRADIENT_COLORS: ['#5E66B7', '#8E97EA'] as readonly [string, string, ...string[]],
} as const;
