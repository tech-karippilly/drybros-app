/**
 * Typography Text component with Poppins font
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { FONT_FAMILY, FONT_SIZES } from '../constants/typography';
import { COLORS } from '../constants/colors';
import { FontFamily, FontSize } from '../types/theme';

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
  h1: { fontSize: FONT_SIZES['5xl'], fontFamily: FONT_FAMILY.bold },
  h2: { fontSize: FONT_SIZES['4xl'], fontFamily: FONT_FAMILY.bold },
  h3: { fontSize: FONT_SIZES['3xl'], fontFamily: FONT_FAMILY.semiBold },
  h4: { fontSize: FONT_SIZES['2xl'], fontFamily: FONT_FAMILY.semiBold },
  h5: { fontSize: FONT_SIZES.xl, fontFamily: FONT_FAMILY.medium },
  h6: { fontSize: FONT_SIZES.lg, fontFamily: FONT_FAMILY.medium },
  body: { fontSize: FONT_SIZES.base, fontFamily: FONT_FAMILY.regular },
  caption: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.regular },
  label: { fontSize: FONT_SIZES.sm, fontFamily: FONT_FAMILY.medium },
};

const weightStyles = {
  light: { fontFamily: FONT_FAMILY.light },
  regular: { fontFamily: FONT_FAMILY.regular },
  medium: { fontFamily: FONT_FAMILY.medium },
  semiBold: { fontFamily: FONT_FAMILY.semiBold },
  bold: { fontFamily: FONT_FAMILY.bold },
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