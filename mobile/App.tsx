import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastProvider } from './src/contexts';
import { COLORS } from './src/constants';
import { loadFonts } from './src/utils/fonts';
import { DeviceInfoScreen, SplashScreen } from './src/screens';

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

  // Show main app after splash screen
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style="auto" />
        <DeviceInfoScreen />
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
