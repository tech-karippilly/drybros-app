/**
 * Runtime-only constants (global flags, dev toggles)
 *
 * Note: Keep keys centralized to avoid magic strings scattered across the app.
 */

export const RUNTIME_GLOBAL_FLAGS = {
  /**
   * Guards one-time initialization logic (e.g., react-native-screens enableScreens)
   * across Fast Refresh / HMR in dev.
   */
  SCREENS_CONFIGURED: '__DRYBROS_SCREENS_CONFIGURED__',
} as const;

