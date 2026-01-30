/**
 * Complaints screen
 * Matches the provided design (custom header, list of complaint cards).
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../typography';
import { normalizeHeight, normalizeWidth } from '../utils/responsive';
import { COLORS, COMPLAINTS_COLORS, COMPLAINTS_LAYOUT, COMPLAINTS_MOCK_LIST, COMPLAINTS_STRINGS } from '../constants';

type HeaderProps = {
  title: string;
  onBack: () => void;
};

function ComplaintsHeader({ title, onBack }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.headerIconBtn} hitSlop={12}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={normalizeWidth(COMPLAINTS_LAYOUT.HEADER_ICON_SIZE)}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>

      <Text variant="body" weight="semiBold" style={styles.headerTitle}>
        {title}
      </Text>

      {/* Spacer to keep title centered */}
      <View style={styles.headerRightSpacer} />
    </View>
  );
}

type ComplaintCardProps = {
  idLabel: string;
  title: string;
  raisedOnLabel: string;
};

function ComplaintCard({ idLabel, title, raisedOnLabel }: ComplaintCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} accessibilityRole="button" style={styles.card} onPress={() => {}}>
      <Text variant="caption" style={styles.cardId}>
        {COMPLAINTS_STRINGS.ID_LABEL} {idLabel}
      </Text>

      <Text variant="h5" weight="semiBold" style={styles.cardTitle}>
        {title}
      </Text>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons
          name="calendar-blank-outline"
          size={normalizeWidth(COMPLAINTS_LAYOUT.META_ICON_SIZE)}
          color={COMPLAINTS_COLORS.SUBTEXT}
        />
        <Text variant="caption" style={styles.metaText}>
          {COMPLAINTS_STRINGS.RAISED_ON_PREFIX} {raisedOnLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function ComplaintsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status bar: white background + dark icons */}
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <ComplaintsHeader title={COMPLAINTS_STRINGS.TITLE} onBack={() => navigation.goBack()} />
      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {COMPLAINTS_MOCK_LIST.map((c) => (
          <ComplaintCard key={c.idLabel} idLabel={c.idLabel} title={c.title} raisedOnLabel={c.raisedOnLabel} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMPLAINTS_COLORS.SCREEN_BG,
  },
  header: {
    height: normalizeHeight(COMPLAINTS_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(COMPLAINTS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerIconBtn: {
    width: normalizeWidth(COMPLAINTS_LAYOUT.HEADER_SIDE_BTN_SIZE),
    height: normalizeHeight(COMPLAINTS_LAYOUT.HEADER_SIDE_BTN_SIZE),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(COMPLAINTS_LAYOUT.HEADER_TITLE_FONT_SIZE),
  },
  headerRightSpacer: {
    width: normalizeWidth(COMPLAINTS_LAYOUT.HEADER_SIDE_BTN_SIZE),
    height: normalizeHeight(COMPLAINTS_LAYOUT.HEADER_SIDE_BTN_SIZE),
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COMPLAINTS_COLORS.DIVIDER,
  },
  scrollContent: {
    paddingHorizontal: normalizeWidth(COMPLAINTS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingTop: normalizeHeight(COMPLAINTS_LAYOUT.LIST_PADDING_TOP),
    paddingBottom: normalizeHeight(COMPLAINTS_LAYOUT.LIST_PADDING_BOTTOM),
    gap: normalizeHeight(COMPLAINTS_LAYOUT.CARD_GAP),
  },
  card: {
    backgroundColor: COMPLAINTS_COLORS.CARD_BG,
    borderRadius: normalizeWidth(COMPLAINTS_LAYOUT.CARD_RADIUS),
    padding: normalizeWidth(COMPLAINTS_LAYOUT.CARD_PADDING),
  },
  cardId: {
    color: COMPLAINTS_COLORS.SUBTEXT,
    marginBottom: normalizeHeight(COMPLAINTS_LAYOUT.CARD_ID_MARGIN_BOTTOM),
  },
  cardTitle: {
    color: COLORS.textPrimary,
    marginBottom: normalizeHeight(COMPLAINTS_LAYOUT.CARD_TITLE_MARGIN_BOTTOM),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalizeWidth(COMPLAINTS_LAYOUT.META_GAP),
  },
  metaText: {
    color: COMPLAINTS_COLORS.SUBTEXT,
  },
});

export default ComplaintsScreen;

