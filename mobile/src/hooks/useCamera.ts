/**
 * Hook for camera permissions and access
 */

import { useState, useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
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

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      setState((prev) => ({
        ...prev,
        permissionStatus: status as typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS],
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  const requestPermission = async () => {
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
  };

  const takePicture = async () => {
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
  };

  const pickImage = async () => {
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
  };

  return {
    ...state,
    hasPermission: state.permissionStatus === PERMISSION_STATUS.GRANTED,
    requestPermission,
    takePicture,
    pickImage,
    checkPermission,
  };
};