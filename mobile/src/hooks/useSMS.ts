/**
 * Hook for SMS functionality
 * Note: SMS sending capabilities are limited on iOS
 */

import { useCallback, useMemo, useState } from 'react';
import { Linking, Alert } from 'react-native';
import * as SMS from 'expo-sms';

export interface SMSState {
  isAvailable: boolean | null;
  error: string | null;
  loading: boolean;
}

export const useSMS = () => {
  const [state, setState] = useState<SMSState>({
    isAvailable: null,
    error: null,
    loading: false,
  });

  /**
   * IMPORTANT:
   * Memoize functions so screens can safely depend on them in `useEffect`
   * without causing infinite re-render loops.
   */
  const checkAvailability = useCallback(async () => {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      setState((prev) => ({ ...prev, isAvailable }));
      return isAvailable;
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message }));
      return false;
    }
  }, []);

  const sendSMS = useCallback(async (phoneNumbers: string[], message: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const isAvailable = await checkAvailability();

      if (!isAvailable) {
        Alert.alert(
          'SMS Not Available',
          'SMS is not available on this device. Please use the messaging app instead.',
          [
            {
              text: 'Open Messages',
              onPress: () => {
                const url = `sms:${phoneNumbers[0]}?body=${encodeURIComponent(message)}`;
                Linking.openURL(url).catch((err) => {
                  setState((prev) => ({ ...prev, error: err.message }));
                });
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setState((prev) => ({ ...prev, loading: false }));
        return false;
      }

      const result = await SMS.sendSMSAsync(phoneNumbers, message);
      setState((prev) => ({ ...prev, loading: false }));

      return result.result === 'sent';
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
      return false;
    }
  }, [checkAvailability]);

  const openSMS = useCallback((phoneNumber: string, message?: string) => {
    const url = message
      ? `sms:${phoneNumber}?body=${encodeURIComponent(message)}`
      : `sms:${phoneNumber}`;
    Linking.openURL(url).catch((err) => {
      setState((prev) => ({ ...prev, error: err.message }));
    });
  }, []);

  return useMemo(
    () => ({
      ...state,
      sendSMS,
      openSMS,
      checkAvailability,
    }),
    [checkAvailability, openSMS, sendSMS, state]
  );
};