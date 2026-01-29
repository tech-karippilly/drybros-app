/**
 * Primary button (label only or icon + label)
 * Width/height 100% by default; color from props; Satoshi Variable 15px label
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { PrimaryButtonProps } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { FONT_FAMILY } from '../../constants/typography';
import { PRIMARY_BUTTON } from '../../constants/button';
import {
  normalizeWidth,
  normalizeHeight,
  normalizeFont,
} from '../../utils/responsive';

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  backgroundColor,
  textColor = COLORS.white,
  width = '100%',
  height = '100%',
  icon,
  iconColor,
  disabled = false,
  style,
}) => {
  const borderRadius = normalizeWidth(PRIMARY_BUTTON.BORDER_RADIUS);
  const paddingT = normalizeHeight(PRIMARY_BUTTON.PADDING_TOP);
  const paddingR = normalizeWidth(PRIMARY_BUTTON.PADDING_RIGHT);
  const paddingB = normalizeHeight(PRIMARY_BUTTON.PADDING_BOTTOM);
  const paddingL = normalizeWidth(PRIMARY_BUTTON.PADDING_LEFT);
  const gap = normalizeWidth(PRIMARY_BUTTON.GAP);
  const labelFontSize = normalizeFont(PRIMARY_BUTTON.LABEL_FONT_SIZE);
  const lineHeight =
    labelFontSize * (PRIMARY_BUTTON.LABEL_LINE_HEIGHT_PERCENT / 100);
  const iconSize = normalizeWidth(20);

  const containerStyle: ViewStyle = {
    width: typeof width === 'number' ? width : '100%',
    height: typeof height === 'number' ? height : '100%',
  };

  const labelStyle = {
    fontFamily: FONT_FAMILY.satoshiVariable,
    fontWeight: '500' as const,
    fontStyle: 'normal' as const,
    letterSpacing: 0,
    fontSize: labelFontSize,
    lineHeight,
    color: textColor,
  };

  const iconColorResolved = iconColor ?? textColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[containerStyle, style]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor,
            borderRadius,
            paddingTop: paddingT,
            paddingRight: paddingR,
            paddingBottom: paddingB,
            paddingLeft: paddingL,
            gap,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        {icon ? (
          <>
            <MaterialCommunityIcons
              name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={iconSize}
              color={iconColorResolved}
            />
            <Text style={labelStyle} numberOfLines={1}>
              {label}
            </Text>
          </>
        ) : (
          <Text style={labelStyle} numberOfLines={1}>
            {label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
  },
});

export default PrimaryButton;
