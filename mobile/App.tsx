import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastProvider } from './src/contexts';
import { COLORS } from './src/constants';
import { loadFonts } from './src/utils/fonts';
import { DeviceInfoScreen } from './src/screens';

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

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

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
