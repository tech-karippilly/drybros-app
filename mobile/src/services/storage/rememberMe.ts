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

  const raw = await SecureStore.getItemAsync(STORAGE_KEYS.REMEMBERED_CREDENTIALS);
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
  await SecureStore.setItemAsync(
    STORAGE_KEYS.REMEMBERED_CREDENTIALS,
    JSON.stringify(credentials)
  );
}

export async function disableRememberMe(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME_ENABLED);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REMEMBERED_CREDENTIALS);
}

