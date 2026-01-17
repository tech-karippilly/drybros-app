/**
 * Input component
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONT_FAMILY, FONT_SIZES } from '../../constants/typography';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../../utils/responsive';
import { Text } from '../../typography';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  secureTextEntry = false,
  showPasswordToggle = false,
  style,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || showPasswordToggle) && styles.inputWithRightIcon,
            inputStyle,
            style,
          ]}
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.rightIcon}>
            <Text style={styles.toggleText}>{isPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && !showPasswordToggle && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && (
        <Text variant="caption" style={styles.errorText}>
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text variant="caption" style={styles.helperText}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: normalizeHeight(16),
  },
  label: {
    marginBottom: normalizeHeight(8),
    color: COLORS.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: normalizeWidth(8),
    backgroundColor: COLORS.white,
    minHeight: normalizeHeight(48),
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY.regular,
    fontSize: normalizeFont(FONT_SIZES.base),
    color: COLORS.textPrimary,
    paddingHorizontal: normalizeWidth(16),
    paddingVertical: normalizeHeight(12),
    minHeight: normalizeHeight(48),
  },
  inputWithLeftIcon: {
    paddingLeft: normalizeWidth(8),
  },
  inputWithRightIcon: {
    paddingRight: normalizeWidth(8),
  },
  leftIcon: {
    paddingLeft: normalizeWidth(12),
  },
  rightIcon: {
    paddingRight: normalizeWidth(12),
  },
  toggleText: {
    fontSize: normalizeFont(FONT_SIZES.lg),
  },
  errorText: {
    marginTop: normalizeHeight(4),
    color: COLORS.error,
  },
  helperText: {
    marginTop: normalizeHeight(4),
    color: COLORS.textSecondary,
  },
});

export default Input;