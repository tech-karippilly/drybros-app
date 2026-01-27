/**
 * Alerts tab screen (notifications)
 * Simple list-style layout for alerts
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../typography';
import { COLORS, TAB_BAR_SCENE_PADDING_BOTTOM } from '../constants';
import { normalizeWidth, normalizeHeight } from '../utils/responsive';

export function AlertsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: normalizeHeight(32) + TAB_BAR_SCENE_PADDING_BOTTOM }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="bell"
            size={normalizeWidth(40)}
            color={COLORS.primary}
          />
          <Text variant="h3" weight="bold" style={styles.title}>
            Alerts
          </Text>
          <Text variant="body" style={styles.subtitle}>
            Important updates and notifications show here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    padding: normalizeWidth(24),
  },
  header: {
    alignItems: 'center',
    paddingVertical: normalizeHeight(32),
  },
  title: {
    color: COLORS.textPrimary,
    marginTop: normalizeHeight(16),
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: normalizeHeight(8),
    textAlign: 'center',
  },
});

export default AlertsScreen;
