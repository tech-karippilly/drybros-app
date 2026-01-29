/**
 * Concentric icon circle component constants
 * 3 circles: outer + middle (blur), inner (solid) with icon in center
 */

export const ICON_CIRCLE = {
  /** Outer circle diameter (design reference) */
  OUTER_SIZE: 120,

  /** Middle circle as ratio of outer (0–1) */
  MIDDLE_RATIO: 0.75,

  /** Inner circle as ratio of outer (0–1) */
  INNER_RATIO: 0.5,

  /** Blur intensity for outer circle */
  OUTER_BLUR_INTENSITY: 20,

  /** Blur intensity for middle circle (blurrier than outer) */
  MIDDLE_BLUR_INTENSITY: 40,

  /** Default inner circle background (solid color) */
  INNER_BACKGROUND_DEFAULT: 'rgba(255, 255, 255, 0.9)',

  /** Default icon size */
  ICON_SIZE: 40,
} as const;
