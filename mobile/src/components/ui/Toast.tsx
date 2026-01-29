/**
 * Toast message component
 * Styles built at render time so getFontFamily is never called before typography loads (avoids "regular of undefined").
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ToastOptions } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { getFontFamily, getFontSize } from '../../constants/typography';
import { normalizeFont } from '../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ToastProps extends ToastOptions {
  visible: boolean;
  onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  position = 'top',
  visible,
  onHide,
}) => {
  const styles = useMemo(() => {
    const fontRegular = getFontFamily('regular');
    const fontBold = getFontFamily('bold');
    const sizeBase = getFontSize('base');
    const size2xl = getFontSize('2xl');
    return StyleSheet.create({
      container: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingHorizontal: 16,
      },
      toast: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: SCREEN_WIDTH * 0.9,
        maxWidth: SCREEN_WIDTH * 0.95,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      message: {
        flex: 1,
        fontFamily: fontRegular,
        fontSize: normalizeFont(sizeBase),
        color: COLORS.white,
        marginRight: 8,
      },
      closeButton: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
      },
      closeText: {
        fontFamily: fontBold,
        fontSize: normalizeFont(size2xl),
        color: COLORS.white,
        lineHeight: 24,
      },
    });
  }, []);
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: position === 'top' ? -100 : 100,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      case 'info':
      default:
        return COLORS.info;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: position === 'top' ? 50 : undefined,
          bottom: position === 'bottom' ? 50 : undefined,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default Toast;