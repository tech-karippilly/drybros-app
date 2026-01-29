/**
 * Typography constants
 * Based on Poppins font family
 * Loaded eagerly from index.ts so FONT_FAMILY is never undefined.
 */

const FONT_FAMILY_MAP = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  light: 'Poppins-Light',
  thin: 'Poppins-Thin',
  satoshiBold: 'Satoshi-Bold',
  satoshiVariable: 'Satoshi-Variable',
  satoshiBlack: 'Satoshi-Bold', // Use Bold for Black (900) if no separate Black font
} as const;

export const FONT_FAMILY = FONT_FAMILY_MAP;

export type FontFamilyKey = keyof typeof FONT_FAMILY_MAP;

const SYSTEM_FONT = 'System';

/** Safe getter – never throws; use this in styles to avoid "regular of undefined" when load order is wrong */
export function getFontFamily(key: FontFamilyKey): string {
  try {
    const map = (typeof FONT_FAMILY_MAP !== 'undefined' ? FONT_FAMILY_MAP : null) as Record<string, string> | null;
    return map?.[key] ?? SYSTEM_FONT;
  } catch {
    return SYSTEM_FONT;
  }
}

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export type FontSizeKey = keyof typeof FONT_SIZES;

/** Safe font size getter – use in styles to avoid load-order issues (replaces safeSize) */
export function getFontSize(key: FontSizeKey): number {
  try {
    const sizes = (typeof FONT_SIZES !== 'undefined' ? FONT_SIZES : null) as Record<string, number> | null;
    return sizes?.[key] ?? 16;
  } catch {
    return 16;
  }
}

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const LETTER_SPACING = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
} as const;