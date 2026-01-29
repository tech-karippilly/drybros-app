/**
 * Concentric icon circle: 3 circles (outer + middle blur, inner solid) with icon in center
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { IconCircleProps } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { ICON_CIRCLE } from '../../constants/iconCircle';
import { normalizeWidth } from '../../utils/responsive';

export const IconCircle: React.FC<IconCircleProps> = ({
  icon,
  size: sizeProp,
  outerBlurIntensity = ICON_CIRCLE.OUTER_BLUR_INTENSITY,
  middleBlurIntensity = ICON_CIRCLE.MIDDLE_BLUR_INTENSITY,
  innerColor = ICON_CIRCLE.INNER_BACKGROUND_DEFAULT,
  iconColor = COLORS.gray800,
  iconSize: iconSizeProp,
  blurTint = 'light',
  style,
}) => {
  const size = sizeProp != null ? normalizeWidth(sizeProp) : normalizeWidth(ICON_CIRCLE.OUTER_SIZE);
  const middleSize = size * ICON_CIRCLE.MIDDLE_RATIO;
  const innerSize = size * ICON_CIRCLE.INNER_RATIO;
  const iconSize = iconSizeProp != null ? normalizeWidth(iconSizeProp) : normalizeWidth(ICON_CIRCLE.ICON_SIZE);

  const outerRadius = size / 2;
  const middleRadius = middleSize / 2;
  const innerRadius = innerSize / 2;

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
  };

  return (
    <View style={[containerStyle, style]}>
      {/* Outer circle – blur */}
      <View
        style={[
          styles.circle,
          styles.outer,
          {
            width: size,
            height: size,
            borderRadius: outerRadius,
          },
        ]}
      >
        <BlurView
          intensity={outerBlurIntensity}
          tint={blurTint}
          style={[styles.blurFill, { width: size, height: size, borderRadius: outerRadius }]}
        />
      </View>

      {/* Middle circle – blur (blurrier than outer) */}
      <View
        style={[
          styles.circle,
          styles.middle,
          {
            left: (size - middleSize) / 2,
            top: (size - middleSize) / 2,
            width: middleSize,
            height: middleSize,
            borderRadius: middleRadius,
          },
        ]}
      >
        <BlurView
          intensity={middleBlurIntensity}
          tint={blurTint}
          style={[styles.blurFill, { width: middleSize, height: middleSize, borderRadius: middleRadius }]}
        />
      </View>

      {/* Inner circle – solid color, icon in center */}
      <View
        style={[
          styles.circle,
          styles.inner,
          {
            left: (size - innerSize) / 2,
            top: (size - innerSize) / 2,
            width: innerSize,
            height: innerSize,
            borderRadius: innerRadius,
            backgroundColor: innerColor,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={iconSize}
          color={iconColor}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outer: {
    left: 0,
    top: 0,
  },
  middle: {},
  inner: {},
  blurFill: {
    overflow: 'hidden',
  },
});

export default IconCircle;
