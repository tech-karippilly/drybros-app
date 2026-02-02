/**
 * Hook for camera permissions and access
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PERMISSION_STATUS, PERMISSION_MESSAGES } from '../constants/permissions';

export interface CameraState {
  permissionStatus: typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS] | null;
  error: string | null;
  loading: boolean;
}

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    permissionStatus: null,
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
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      setState((prev) => ({
        ...prev,
        permissionStatus: status as typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS],
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const requestPermission = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          PERMISSION_MESSAGES.CAMERA_REQUIRED,
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

  const takePicture = useCallback(async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      setState((prev) => ({ ...prev, loading: false }));

      if (!result.canceled && result.assets[0]) {
        return result.assets[0];
      }

      return null;
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
      return null;
    }
  }, [requestPermission]);

  const pickImage = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      setState((prev) => ({ ...prev, loading: false }));

      if (!result.canceled && result.assets[0]) {
        return result.assets[0];
      }

      return null;
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
      return null;
    }
  }, []);

  const hasPermission = state.permissionStatus === PERMISSION_STATUS.GRANTED;

  return useMemo(
    () => ({
      ...state,
      hasPermission,
      requestPermission,
      takePicture,
      pickImage,
      checkPermission,
    }),
    [checkPermission, hasPermission, pickImage, requestPermission, state, takePicture]
  );
};