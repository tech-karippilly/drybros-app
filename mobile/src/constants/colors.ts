/**
 * Color constants for the mobile app
 * Update these colors based on Figma design
 */

export const COLORS = {
  // Primary colors
  primary: '#2563eb', // Blue-600
  primaryDark: '#1e40af', // Blue-700
  primaryLight: '#3b82f6', // Blue-500

  // Secondary colors
  secondary: '#ea580c', // Orange-600
  secondaryDark: '#c2410c', // Orange-700
  secondaryLight: '#fb923c', // Orange-400

  // Semantic colors
  success: '#10b981', // Green-500
  error: '#dc2626', // Red-600
  warning: '#f59e0b', // Amber-500
  info: '#2563eb', // Blue-600

  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Background colors
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  backgroundTertiary: '#f3f4f6',

  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',

  // Border colors
  border: '#e5e7eb',
  borderDark: '#d1d5db',
  divider: '#e5e7eb',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Tab bar
  tabBarBackground: '#090C20EB', // Dark blue with transparency

  // Transparent
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof COLORS;