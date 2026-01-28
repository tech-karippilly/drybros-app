/**
 * Custom Dropdown component
 * Floating dropdown with transparent background
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../../typography';
import { COLORS } from '../../constants/colors';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../../utils/responsive';

export interface DropdownOption {
  label: string;
  value: string | number;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export interface DropdownProps {
  options: DropdownOption[];
  selectedValue?: string | number;
  onSelect: (value: string | number) => void;
  placeholder?: string;
  visible: boolean;
  onClose: () => void;
  position?: 'top' | 'bottom';
  anchor?: { x: number; y: number };
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  visible,
  onClose,
  position = 'bottom',
  anchor,
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(position === 'bottom' ? 100 : -100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: position === 'bottom' ? 100 : -100,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, position, fadeAnim, slideAnim]);

  const handleSelect = (value: string | number) => {
    onSelect(value);
    onClose();
  };

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.dropdownWrapper,
                position === 'bottom' && {
                  position: 'absolute',
                  bottom: anchor ? undefined : insets.bottom + normalizeHeight(80),
                  top: anchor ? anchor.y : undefined,
                  left: anchor ? anchor.x : normalizeWidth(24),
                  right: anchor ? undefined : normalizeWidth(24),
                  transform: [{ translateY: slideAnim }],
                  opacity: fadeAnim,
                },
                position === 'top' && {
                  position: 'absolute',
                  top: anchor ? anchor.y : insets.top + normalizeHeight(20),
                  left: anchor ? anchor.x : normalizeWidth(24),
                  right: anchor ? undefined : normalizeWidth(24),
                  transform: [{ translateY: slideAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <BlurView
                intensity={4}
                tint="dark"
                style={styles.dropdownContainer}
              >
                {options.map((option, index) => {
                const isSelected = option.value === selectedValue;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      index === 0 && styles.optionFirst,
                      index === options.length - 1 && styles.optionLast,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    {option.icon && (
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={normalizeWidth(20)}
                        color={isSelected ? COLORS.primary : COLORS.textPrimary}
                        style={styles.optionIcon}
                      />
                    )}
                    <Text
                      variant="body"
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={normalizeWidth(20)}
                        color={COLORS.primary}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
              </BlurView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownWrapper: {
    zIndex: 1,
    elevation: 1,
  },
  dropdownContainer: {
    backgroundColor: 'transparent',
    borderRadius: normalizeWidth(12),
    minWidth: normalizeWidth(200),
    maxWidth: normalizeWidth(300),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalizeHeight(12),
    paddingHorizontal: normalizeWidth(16),
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionFirst: {
    borderTopLeftRadius: normalizeWidth(12),
    borderTopRightRadius: normalizeWidth(12),
  },
  optionLast: {
    borderBottomLeftRadius: normalizeWidth(12),
    borderBottomRightRadius: normalizeWidth(12),
    borderBottomWidth: 0,
  },
  optionSelected: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  optionIcon: {
    marginRight: normalizeWidth(12),
  },
  optionText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: normalizeFont(14),
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: normalizeWidth(8),
  },
});

export default Dropdown;
