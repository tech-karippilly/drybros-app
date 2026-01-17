/**
 * Theme-related types
 */

import { COLORS } from '../constants/colors';
import { FONT_FAMILY, FONT_SIZES } from '../constants/typography';

export type ColorValue = typeof COLORS[keyof typeof COLORS];
export type FontFamily = typeof FONT_FAMILY[keyof typeof FONT_FAMILY];
export type FontSize = typeof FONT_SIZES[keyof typeof FONT_SIZES];

export interface Theme {
  colors: typeof COLORS;
  typography: {
    fontFamily: typeof FONT_FAMILY;
    fontSize: typeof FONT_SIZES;
  };
}