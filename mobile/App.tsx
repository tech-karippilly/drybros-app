import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
/** Load typography first so FONT_FAMILY is never undefined (avoids "regular of undefined" crash) */
import './src/constants/typography';
import { ToastProvider } from './src/contexts';
import { COLORS } from './src/constants';
import { loadFonts } from './src/utils/fonts';
import { SplashScreen, LoginScreen, ForgotPasswordScreen } from './src/screens';
import { MainTabNavigator } from './src/navigation';

const LoadingScreen = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await loadFonts();
      } catch (error) {
        console.warn('Error loading fonts:', error);
      } finally {
        setFontsLoaded(true);
      }
    };

    prepare();
  }, []);

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  // Show splash screen first
  if (!splashFinished) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onFinish={() => setSplashFinished(true)} />
      </SafeAreaProvider>
    );
  }

  // Show forgot password screen
  if (showForgotPassword) {
    return (
      <SafeAreaProvider>
        <ToastProvider>
          <ForgotPasswordScreen
            onBack={() => setShowForgotPassword(false)}
            onSuccess={() => setShowForgotPassword(false)}
          />
        </ToastProvider>
      </SafeAreaProvider>
    );
  }

  // Show login screen after splash
  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <ToastProvider>
          <LoginScreen
            onLoginSuccess={() => setIsLoggedIn(true)}
            onForgotPassword={() => setShowForgotPassword(true)}
          />
        </ToastProvider>
      </SafeAreaProvider>
    );
  }

  // Show main app after login (tab bar: Home, Trip, Leave, Alerts, Profile)
  const navTheme = {
    dark: false,
    colors: {
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.background,
      text: COLORS.textPrimary,
      border: COLORS.border,
      notification: COLORS.primary,
    },
  };

  return (
    <GestureHandlerRootView style={[styles.flex1, styles.appBackground]}>
      <SafeAreaProvider>
        <ToastProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" backgroundColor={COLORS.headerBackground} />
            <MainTabNavigator />
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  appBackground: { backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
