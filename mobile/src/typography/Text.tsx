/**
 * Typography Text component with Poppins font
 * Uses fallback fonts when typography module is not yet loaded (avoids load-order crash)
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import {
  getFontFamily,
  FONT_SIZES as FONT_SIZES_IMPORT,
} from '../constants/typography';
import { COLORS } from '../constants/colors';
import { FontFamily, FontSize } from '../types/theme';

const FALLBACK_SIZES = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48 } as const;
const FONT_SIZES = FONT_SIZES_IMPORT ?? FALLBACK_SIZES;

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'label';
  weight?: 'light' | 'regular' | 'medium' | 'semiBold' | 'bold';
  size?: FontSize;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  numberOfLines?: number;
  children: React.ReactNode;
}

const variantStyles = {
  h1: { fontSize: FONT_SIZES['5xl'], fontFamily: getFontFamily('bold') },
  h2: { fontSize: FONT_SIZES['4xl'], fontFamily: getFontFamily('bold') },
  h3: { fontSize: FONT_SIZES['3xl'], fontFamily: getFontFamily('semiBold') },
  h4: { fontSize: FONT_SIZES['2xl'], fontFamily: getFontFamily('semiBold') },
  h5: { fontSize: FONT_SIZES.xl, fontFamily: getFontFamily('medium') },
  h6: { fontSize: FONT_SIZES.lg, fontFamily: getFontFamily('medium') },
  body: { fontSize: FONT_SIZES.base, fontFamily: getFontFamily('regular') },
  caption: { fontSize: FONT_SIZES.sm, fontFamily: getFontFamily('regular') },
  label: { fontSize: FONT_SIZES.sm, fontFamily: getFontFamily('medium') },
};

const weightStyles = {
  light: { fontFamily: getFontFamily('light') },
  regular: { fontFamily: getFontFamily('regular') },
  medium: { fontFamily: getFontFamily('medium') },
  semiBold: { fontFamily: getFontFamily('semiBold') },
  bold: { fontFamily: getFontFamily('bold') },
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  weight,
  size,
  color = COLORS.textPrimary,
  align = 'left',
  numberOfLines,
  style,
  children,
  ...props
}) => {
  const variantStyle = variantStyles[variant];
  const weightStyle = weight ? weightStyles[weight] : {};
  const sizeStyle = size ? { fontSize: size } : {};

  return (
    <RNText
      style={[
        variantStyle,
        weightStyle,
        sizeStyle,
        { color, textAlign: align },
        style,
      ]}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Text;