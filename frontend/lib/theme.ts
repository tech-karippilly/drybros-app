export const THEME_COLORS = {
    light: {
        white: '#ffffff',
        red: '#dc2626',    // Red-600
        orange: '#ea580c', // Orange-600
        blue: '#2563eb',   // Blue-600
        background: '#ffffff',
        foreground: '#171717',
    },
    dark: {
        white: '#ffffff',
        red: '#f87171',    // Red-400
        orange: '#fb923c', // Orange-400
        blue: '#60a5fa',   // Blue-400
        background: '#0a0a0a',
        foreground: '#ededed',
    },
} as const;

export type ThemeMode = 'light' | 'dark';
export type ThemeColorKey = keyof typeof THEME_COLORS.light;
