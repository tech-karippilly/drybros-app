import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { STORAGE_KEYS } from '../../constants/storageKeys';

export type RememberedCredentials = {
  driverCode: string;
  password: string;
};

export type RememberMeState = {
  enabled: boolean;
  credentials?: RememberedCredentials;
};

const TRUE = 'true';

/**
 * Loads "Remember me" state.
 *
 * Passwords are stored using `expo-secure-store` (encrypted on device).
 * The enable flag is stored using `AsyncStorage`.
 */
export async function loadRememberMeState(): Promise<RememberMeState> {
  const enabled =
    (await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME_ENABLED)) === TRUE;

  if (!enabled) return { enabled: false };

  let raw: string | null = null;
  try {
    raw = await SecureStore.getItemAsync(STORAGE_KEYS.REMEMBERED_CREDENTIALS);
  } catch {
    // Non-blocking: secure storage issues should not break login screen.
    return { enabled: true };
  }
  if (!raw) return { enabled: true };

  try {
    const parsed = JSON.parse(raw) as Partial<RememberedCredentials>;
    if (!parsed?.driverCode || !parsed?.password) return { enabled: true };
    return { enabled: true, credentials: { driverCode: parsed.driverCode, password: parsed.password } };
  } catch {
    return { enabled: true };
  }
}

export async function enableRememberMe(credentials: RememberedCredentials): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME_ENABLED, TRUE);
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.REMEMBERED_CREDENTIALS,
      JSON.stringify(credentials)
    );
  } catch {
    // Non-blocking: don't fail login if secure storage write fails.
  }
}

export async function disableRememberMe(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME_ENABLED);
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REMEMBERED_CREDENTIALS);
  } catch {
    // Best-effort cleanup.
  }
}

