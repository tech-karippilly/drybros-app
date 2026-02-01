import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DefaultTheme as NavigationDefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
/** Load typography first so FONT_FAMILY is never undefined (avoids "regular of undefined" crash) */
import './src/constants/typography';
import { ToastProvider } from './src/contexts';
import { COLORS } from './src/constants';
import { loadFonts } from './src/utils/fonts';
import { SplashScreen, LoginScreen, ForgotPasswordScreen } from './src/screens';
import { MainTabNavigator } from './src/navigation';
import { AuthProvider, useAuth } from './src/contexts';

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

  const navTheme = {
    /**
     * React Navigation expects `fonts` on theme in some versions (it reads `theme.fonts.regular`).
     * Always extend the library default theme so we never crash on missing keys.
     */
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.background,
      text: COLORS.textPrimary,
      border: COLORS.border,
      notification: COLORS.primary,
    } as typeof NavigationDefaultTheme.colors,
  };

  return (
    <GestureHandlerRootView style={[styles.flex1, styles.appBackground]}>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <AppShell
              navTheme={navTheme}
              showForgotPassword={showForgotPassword}
              setShowForgotPassword={setShowForgotPassword}
            />
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

type AppShellProps = {
  navTheme: any;
  showForgotPassword: boolean;
  setShowForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
};

function AppShell({ navTheme, showForgotPassword, setShowForgotPassword }: AppShellProps) {
  const { isHydrated, isLoggedIn, markLoggedIn } = useAuth();

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  // Show forgot password screen
  if (showForgotPassword) {
    return (
      <ForgotPasswordScreen
        onBack={() => setShowForgotPassword(false)}
        onSuccess={() => setShowForgotPassword(false)}
      />
    );
  }

  // Show login screen after splash
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={() => markLoggedIn()}
        onForgotPassword={() => setShowForgotPassword(true)}
      />
    );
  }

  // Show main app after login (tab bar: Home, Trip, Leave, Alerts, Profile)
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" backgroundColor={COLORS.headerBackground} />
      <MainTabNavigator />
    </NavigationContainer>
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
