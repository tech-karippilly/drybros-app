/**
 * Card component
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { BaseComponentProps } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { normalizeWidth, normalizeHeight } from '../../utils/responsive';

export interface CardProps extends BaseComponentProps {
  onPress?: () => void;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  backgroundColor?: string;
  shadow?: boolean;
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = 16,
  margin = 0,
  borderRadius = 8,
  backgroundColor = COLORS.white,
  shadow = true,
  elevation = 2,
  testID,
}) => {
  const cardStyle: ViewStyle = {
    padding: normalizeWidth(padding),
    margin: normalizeWidth(margin),
    borderRadius: normalizeWidth(borderRadius),
    backgroundColor,
    ...(shadow && {
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation,
    }),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
};

export default Card;