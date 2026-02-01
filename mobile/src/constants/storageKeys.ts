/**
 * Storage keys used across the mobile app.
 *
 * Rules:
 * - Keep ALL storage keys centralized here.
 * - Never hardcode storage keys inside screens/services.
 */
export const STORAGE_KEYS = {
  /** Auth */
  AUTH_TOKEN: '@drybros/auth_token',
  REFRESH_TOKEN: '@drybros/refresh_token',
  USER_DATA: '@drybros/user_data',

  /** App */
  ONBOARDING_COMPLETED: '@drybros/onboarding_completed',
  THEME: '@drybros/theme',
  LANGUAGE: '@drybros/language',

  /** Login (Remember me) */
  REMEMBER_ME_ENABLED: '@drybros/remember_me_enabled',
  /**
   * Stored securely via `expo-secure-store` as JSON:
   * `{ driverCode: string; password: string }`
   *
   * Note: SecureStore keys must use a safe character set (letters/numbers/._-).
   * Avoid characters like `@` and `/` which can throw "Invalid key provided".
   */
  REMEMBERED_CREDENTIALS: 'drybros.remembered_credentials',
} as const;

