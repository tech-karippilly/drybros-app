/**
 * Hook for location permissions and access
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { PERMISSION_STATUS, PERMISSION_MESSAGES } from '../constants/permissions';

export interface LocationState {
  permissionStatus: typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS] | null;
  location: Location.LocationObject | null;
  error: string | null;
  loading: boolean;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    permissionStatus: null,
    location: null,
    error: null,
    loading: false,
  });

  /**
   * IMPORTANT:
   * These functions are memoized so screens can safely use them in `useEffect`
   * dependency arrays without causing infinite re-render loops.
   */
  const checkPermission = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setState((prev) => ({
        ...prev,
        permissionStatus: status as typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS],
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          PERMISSION_MESSAGES.LOCATION_REQUIRED,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }

      setState((prev) => ({
        ...prev,
        permissionStatus: status as typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS],
        loading: false,
      }));

      return status === 'granted';
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setState((prev) => ({ ...prev, location, loading: false }));
      return location;
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
      return null;
    }
  }, [requestPermission]);

  const watchPosition = useCallback((callback: (location: Location.LocationObject) => void) => {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 1000,
        distanceInterval: 10,
      },
      callback
    );
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const hasPermission = state.permissionStatus === PERMISSION_STATUS.GRANTED;

  return useMemo(
    () => ({
      ...state,
      hasPermission,
      requestPermission,
      getCurrentLocation,
      watchPosition,
      checkPermission,
    }),
    [checkPermission, getCurrentLocation, hasPermission, requestPermission, state, watchPosition]
  );
};
