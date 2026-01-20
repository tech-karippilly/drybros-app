/**
 * Responsive utility functions for different screen sizes
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro - 375x812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Normalize width based on screen size
 */
export const normalizeWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Normalize height based on screen size
 */
export const normalizeHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Normalize font size based on screen width
 */
export const normalizeFont = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get responsive percentage of screen width
 */
export const widthPercentage = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * Get responsive percentage of screen height
 */
export const heightPercentage = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

/**
 * Check if device is small (width < 375)
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375;
};

/**
 * Check if device is medium (375 <= width < 414)
 */
export const isMediumDevice = (): boolean => {
  return SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
};

/**
 * Check if device is large (width >= 414)
 */
export const isLargeDevice = (): boolean => {
  return SCREEN_WIDTH >= 414;
};

/**
 * Get screen dimensions
 */
export const getScreenDimensions = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: isSmallDevice(),
    isMedium: isMediumDevice(),
    isLarge: isLargeDevice(),
  };
};

/**
 * Platform-specific value
 */
export const platformSelect = <T>(values: { ios?: T; android?: T; default?: T }): T | undefined => {
  if (Platform.OS === 'ios' && values.ios !== undefined) {
    return values.ios;
  }
  if (Platform.OS === 'android' && values.android !== undefined) {
    return values.android;
  }
  return values.default;
};

/**
 * Platform padding top (status bar height)
 */
export const getStatusBarHeight = (): number => {
  return Platform.OS === 'ios' ? 44 : 24;
};

/**
 * Platform padding bottom (safe area)
 */
export const getBottomSafeArea = (): number => {
  return Platform.OS === 'ios' ? 34 : 0;
};