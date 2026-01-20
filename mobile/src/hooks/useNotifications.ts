/**
 * Hook for notification permissions and handling
 */

import { useState, useEffect, useRef } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PERMISSION_STATUS, PERMISSION_MESSAGES } from '../constants/permissions';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationState {
  permissionStatus: typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS] | null;
  expoPushToken: string | null;
  error: string | null;
  loading: boolean;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    permissionStatus: null,
    expoPushToken: null,
    error: null,
    loading: false,
  });

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    checkPermission();
    registerForPushNotifications();

    // Listen for notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const checkPermission = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      setState((prev) => ({
        ...prev,
        permissionStatus: existingStatus as typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS],
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  const registerForPushNotifications = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          PERMISSION_MESSAGES.NOTIFICATIONS_REQUIRED,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      setState((prev) => ({
        ...prev,
        permissionStatus: finalStatus as typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS],
        expoPushToken: token,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  const requestPermission = async () => {
    await registerForPushNotifications();
    return state.permissionStatus === PERMISSION_STATUS.GRANTED;
  };

  const scheduleNotification = async (title: string, body: string, data?: any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // Send immediately
    });
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  return {
    ...state,
    hasPermission: state.permissionStatus === PERMISSION_STATUS.GRANTED,
    requestPermission,
    scheduleNotification,
    cancelAllNotifications,
    checkPermission,
  };
};