/**
 * Badge component
 * Satoshi Variable Medium 15px, variant backgrounds (success / pending / rejected / onProcess)
 * Width/height 100% by default
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import type { BadgeProps } from '../../types/common';
import { FONT_FAMILY } from '../../constants/typography';
import { BADGE, type BadgeVariant } from '../../constants/badge';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../../utils/responsive';

const VARIANT_STYLES: Record<
  BadgeVariant,
  { background: string; text: string }
> = {
  success: {
    background: BADGE.SUCCESS_BACKGROUND,
    text: BADGE.SUCCESS_TEXT,
  },
  pending: {
    background: BADGE.PENDING_BACKGROUND,
    text: BADGE.PENDING_TEXT,
  },
  rejected: {
    background: BADGE.REJECTED_BACKGROUND,
    text: BADGE.REJECTED_TEXT,
  },
  onProcess: {
    background: BADGE.ON_PROCESS_BACKGROUND,
    text: BADGE.ON_PROCESS_TEXT,
  },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant,
  width = '100%',
  height = '100%',
  style,
}) => {
  const { background, text } = VARIANT_STYLES[variant];
  const fontSize = normalizeFont(BADGE.FONT_SIZE);
  const lineHeight = fontSize * (BADGE.LINE_HEIGHT_PERCENT / 100);
  const paddingH = normalizeWidth(12);
  const paddingV = normalizeHeight(6);
  const borderRadius = normalizeWidth(20);

  const containerStyle: ViewStyle = {
    width: typeof width === 'number' ? width : '100%',
    height: typeof height === 'number' ? height : '100%',
  };

  return (
    <View style={[containerStyle, style]}>
      <View
        style={[
          styles.inner,
          {
            backgroundColor: background,
            borderRadius,
            paddingHorizontal: paddingH,
            paddingVertical: paddingV,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            {
              fontFamily: FONT_FAMILY.satoshiVariable,
              fontWeight: '500',
              fontStyle: 'normal',
              letterSpacing: 0,
              fontSize,
              lineHeight,
              color: text,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    minHeight: 0,
  },
  label: {},
});

export default Badge;
