/**
 * Default theme configuration
 * Uses getFontFamily so typography.fontFamily is never undefined (avoids "regular of undefined").
 */

import { COLORS } from '../constants/colors';
import { getFontFamily, FONT_FAMILY, FONT_SIZES } from '../constants/typography';
import { Theme } from '../types/theme';

const fontFamilySafe = {
  regular: getFontFamily('regular'),
  medium: getFontFamily('medium'),
  semiBold: getFontFamily('semiBold'),
  bold: getFontFamily('bold'),
  light: getFontFamily('light'),
  thin: getFontFamily('thin'),
  satoshiBold: getFontFamily('satoshiBold'),
  satoshiVariable: getFontFamily('satoshiVariable'),
  satoshiBlack: getFontFamily('satoshiBlack'),
} as typeof FONT_FAMILY;

export const defaultTheme: Theme = {
  colors: COLORS,
  typography: {
    fontFamily: fontFamilySafe,
    fontSize: FONT_SIZES,
  },
};

export default defaultTheme;