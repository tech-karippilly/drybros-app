/**
 * Header config for stack navigators
 * Uses getFontFamily so header styles never read .regular on undefined
 */

import { getFontFamily } from './typography';
import { COLORS } from './colors';

export const HEADER_CONFIG = {
  headerStyle: { backgroundColor: COLORS.background },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontFamily: getFontFamily('semiBold'),
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
} as const;
