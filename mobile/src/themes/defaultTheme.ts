/**
 * Default theme configuration
 */

import { COLORS } from '../constants/colors';
import { FONT_FAMILY, FONT_SIZES } from '../constants/typography';
import { Theme } from '../types/theme';

export const defaultTheme: Theme = {
  colors: COLORS,
  typography: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES,
  },
};

export default defaultTheme;