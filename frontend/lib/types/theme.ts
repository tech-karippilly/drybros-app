import { THEME_COLORS } from "@/lib/constants/theme";

export type ThemeMode = 'light' | 'dark';
export type ThemeColorKey = keyof typeof THEME_COLORS.light;
