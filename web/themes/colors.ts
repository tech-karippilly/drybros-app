// Light Mode Colors
export const lightColors = {
  // Primary colors
  primary: {
    main: '#3B82F6',      // Blue
    light: '#60A5FA',
    dark: '#2563EB',
    contrast: '#FFFFFF',
  },
  
  // Secondary colors
  secondary: {
    main: '#8B5CF6',      // Purple
    light: '#A78BFA',
    dark: '#7C3AED',
    contrast: '#FFFFFF',
  },
  
  // Background colors
  background: {
    default: '#FFFFFF',
    paper: '#F9FAFB',
    elevated: '#FFFFFF',
  },
  
  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    hint: '#D1D5DB',
  },
  
  // Status colors
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    contrast: '#FFFFFF',
  },
  
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    contrast: '#FFFFFF',
  },
  
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    contrast: '#FFFFFF',
  },
  
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    contrast: '#FFFFFF',
  },
  
  // UI elements
  divider: '#E5E7EB',
  border: '#D1D5DB',
  hover: '#F3F4F6',
  selected: '#EFF6FF',
  disabled: '#F3F4F6',
  
  // Additional colors
  grey: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

// Dark Mode Colors
export const darkColors = {
  // Primary colors
  primary: {
    main: '#60A5FA',      // Lighter blue for dark mode
    light: '#93C5FD',
    dark: '#3B82F6',
    contrast: '#000000',
  },
  
  // Secondary colors
  secondary: {
    main: '#A78BFA',      // Lighter purple for dark mode
    light: '#C4B5FD',
    dark: '#8B5CF6',
    contrast: '#000000',
  },
  
  // Background colors
  background: {
    default: '#0F172A',
    paper: '#1E293B',
    elevated: '#334155',
  },
  
  // Text colors
  text: {
    primary: '#F1F5F9',
    secondary: '#CBD5E1',
    disabled: '#64748B',
    hint: '#475569',
  },
  
  // Status colors
  success: {
    main: '#34D399',
    light: '#6EE7B7',
    dark: '#10B981',
    contrast: '#000000',
  },
  
  error: {
    main: '#F87171',
    light: '#FCA5A5',
    dark: '#EF4444',
    contrast: '#000000',
  },
  
  warning: {
    main: '#FBBF24',
    light: '#FCD34D',
    dark: '#F59E0B',
    contrast: '#000000',
  },
  
  info: {
    main: '#60A5FA',
    light: '#93C5FD',
    dark: '#3B82F6',
    contrast: '#000000',
  },
  
  // UI elements
  divider: '#334155',
  border: '#475569',
  hover: '#334155',
  selected: '#1E3A8A',
  disabled: '#1E293B',
  
  // Additional colors
  grey: {
    50: '#1E293B',
    100: '#334155',
    200: '#475569',
    300: '#64748B',
    400: '#94A3B8',
    500: '#CBD5E1',
    600: '#E2E8F0',
    700: '#F1F5F9',
    800: '#F8FAFC',
    900: '#FFFFFF',
  },
};

export type ThemeColors = typeof lightColors;
