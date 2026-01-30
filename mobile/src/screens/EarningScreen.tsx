/**
 * Earnings screen
 * Matches the provided design (custom header, tabs, summary cards, history list).
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../typography';
import { normalizeHeight, normalizeWidth } from '../utils/responsive';
import { COLORS, EARNINGS_COLORS, EARNINGS_LAYOUT, EARNINGS_MOCK_HISTORY, EARNINGS_MOCK_SUMMARY, EARNINGS_STRINGS } from '../constants';

type EarningsPeriod = 'daily' | 'monthly' | 'yearly';

type HeaderProps = {
  title: string;
  onBack: () => void;
};

function EarningsHeader({ title, onBack }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.headerIconBtn} hitSlop={12}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={normalizeWidth(EARNINGS_LAYOUT.HEADER_ICON_SIZE)}
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

type TabsProps = {
  value: EarningsPeriod;
  onChange: (next: EarningsPeriod) => void;
};

function EarningsTabs({ value, onChange }: TabsProps) {
  const tabs: Array<{ key: EarningsPeriod; label: string }> = [
    { key: 'daily', label: EARNINGS_STRINGS.PERIOD_DAILY },
    { key: 'monthly', label: EARNINGS_STRINGS.PERIOD_MONTHLY },
    { key: 'yearly', label: EARNINGS_STRINGS.PERIOD_YEARLY },
  ];

  return (
    <View style={styles.tabsWrap}>
      <View style={styles.tabsTrack}>
        {tabs.map((t) => {
          const isActive = value === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={() => onChange(t.key)}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
            >
              <Text
                variant="body"
                weight="semiBold"
                style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SummaryCard() {
  return (
    <View style={styles.card}>
      <Text variant="body" weight="semiBold" style={styles.sectionTitle}>
        {EARNINGS_STRINGS.TODAY}
      </Text>

      <View style={styles.totalBox}>
        <Text variant="h4" weight="semiBold" style={styles.totalAmount}>
          {EARNINGS_MOCK_SUMMARY.total}
        </Text>
        <Text variant="caption" style={styles.subLabel}>
          {EARNINGS_STRINGS.TOTAL_EARNINGS}
        </Text>
      </View>

      <View style={styles.twoColRow}>
        <View style={[styles.smallBox, styles.incentiveBox]}>
          <Text variant="h4" weight="semiBold" style={styles.smallAmount}>
            {EARNINGS_MOCK_SUMMARY.incentives}
          </Text>
          <Text variant="caption" style={styles.subLabel}>
            {EARNINGS_STRINGS.INCENTIVES}
          </Text>
        </View>

        <View style={[styles.smallBox, styles.bonusBox]}>
          <Text variant="h4" weight="semiBold" style={styles.smallAmount}>
            {EARNINGS_MOCK_SUMMARY.bonus}
          </Text>
          <Text variant="caption" style={styles.subLabel}>
            {EARNINGS_STRINGS.BONUS}
          </Text>
        </View>
      </View>
    </View>
  );
}

function EarningsHistoryCard() {
  return (
    <View style={styles.card}>
      <Text variant="body" weight="semiBold" style={styles.sectionTitle}>
        {EARNINGS_STRINGS.HISTORY_TITLE}
      </Text>

      {EARNINGS_MOCK_HISTORY.map((row, idx) => (
        <View key={`${row.dateLabel}-${idx}`} style={[styles.historyRow, idx > 0 && styles.historyRowDivider]}>
          <Text variant="caption" style={styles.historyDate}>
            {row.dateLabel}
          </Text>

          <View style={styles.historyCols}>
            <View style={styles.historyCol}>
              <Text variant="caption" style={styles.historyColLabel}>
                {EARNINGS_STRINGS.COL_EARNINGS}
              </Text>
              <Text variant="body" weight="semiBold" style={styles.historyValue}>
                {row.earnings}
              </Text>
            </View>

            <View style={styles.historyCol}>
              <Text variant="caption" style={styles.historyColLabel}>
                {EARNINGS_STRINGS.COL_INCENTIVE}
              </Text>
              <Text variant="body" weight="semiBold" style={styles.historyValue}>
                {row.incentive}
              </Text>
            </View>

            <View style={styles.historyCol}>
              <Text variant="caption" style={styles.historyColLabel}>
                {EARNINGS_STRINGS.COL_BONUS}
              </Text>
              <Text variant="body" weight="semiBold" style={styles.historyValue}>
                {row.bonus}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function EarningScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = React.useState<EarningsPeriod>('daily');

  // TODO: When wired, switch summary/history based on `period`
  void period;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status bar: white background + dark icons */}
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <EarningsHeader title={EARNINGS_STRINGS.TITLE} onBack={() => navigation.goBack()} />
      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <EarningsTabs value={period} onChange={setPeriod} />
        <SummaryCard />
        <EarningsHistoryCard />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: EARNINGS_COLORS.SCREEN_BG,
  },
  header: {
    height: normalizeHeight(EARNINGS_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(EARNINGS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerIconBtn: {
    width: normalizeWidth(EARNINGS_LAYOUT.HEADER_SIDE_BTN_SIZE),
    height: normalizeHeight(EARNINGS_LAYOUT.HEADER_SIDE_BTN_SIZE),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(EARNINGS_LAYOUT.HEADER_TITLE_FONT_SIZE),
  },
  headerRightSpacer: {
    width: normalizeWidth(EARNINGS_LAYOUT.HEADER_SIDE_BTN_SIZE),
    height: normalizeHeight(EARNINGS_LAYOUT.HEADER_SIDE_BTN_SIZE),
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: EARNINGS_COLORS.DIVIDER,
  },
  scrollContent: {
    paddingHorizontal: normalizeWidth(EARNINGS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingBottom: normalizeHeight(EARNINGS_LAYOUT.LIST_BOTTOM_PADDING),
  },
  tabsWrap: {
    paddingTop: normalizeHeight(14),
    paddingBottom: normalizeHeight(10),
  },
  tabsTrack: {
    backgroundColor: EARNINGS_COLORS.TAB_BG,
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.TAB_PILL_RADIUS),
    padding: normalizeWidth(4),
    height: normalizeHeight(EARNINGS_LAYOUT.TABS_HEIGHT),
    flexDirection: 'row',
    gap: normalizeWidth(8),
    alignItems: 'center',
  },
  tabPill: {
    flex: 1,
    height: normalizeHeight(EARNINGS_LAYOUT.TAB_PILL_HEIGHT),
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.TAB_PILL_RADIUS),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: EARNINGS_COLORS.TAB_ACTIVE_BG,
  },
  tabLabel: {
    letterSpacing: 0,
  },
  tabLabelActive: {
    color: EARNINGS_COLORS.TAB_ACTIVE_TEXT,
  },
  tabLabelInactive: {
    color: EARNINGS_COLORS.TAB_INACTIVE_TEXT,
  },
  card: {
    backgroundColor: EARNINGS_COLORS.CARD_BG,
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.CARD_RADIUS),
    padding: normalizeWidth(18),
    marginTop: normalizeHeight(14),
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: normalizeHeight(12),
  },
  totalBox: {
    backgroundColor: EARNINGS_COLORS.TOTAL_BG,
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.INNER_CARD_RADIUS),
    padding: normalizeWidth(18),
  },
  totalAmount: {
    color: COLORS.textPrimary,
  },
  subLabel: {
    color: EARNINGS_COLORS.SUBTEXT,
    marginTop: normalizeHeight(6),
  },
  twoColRow: {
    marginTop: normalizeHeight(14),
    flexDirection: 'row',
    gap: normalizeWidth(EARNINGS_LAYOUT.GAP),
  },
  smallBox: {
    flex: 1,
    borderRadius: normalizeWidth(EARNINGS_LAYOUT.INNER_CARD_RADIUS),
    padding: normalizeWidth(18),
  },
  incentiveBox: {
    backgroundColor: EARNINGS_COLORS.INCENTIVE_BG,
  },
  bonusBox: {
    backgroundColor: EARNINGS_COLORS.BONUS_BG,
  },
  smallAmount: {
    color: COLORS.textPrimary,
  },
  historyRow: {
    paddingVertical: normalizeHeight(EARNINGS_LAYOUT.HISTORY_ROW_VERTICAL_PADDING),
  },
  historyRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: EARNINGS_COLORS.DIVIDER,
  },
  historyDate: {
    color: EARNINGS_COLORS.SUBTEXT,
    marginBottom: normalizeHeight(12),
  },
  historyCols: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyCol: {
    flex: 1,
  },
  historyColLabel: {
    color: EARNINGS_COLORS.SUBTEXT,
    marginBottom: normalizeHeight(6),
  },
  historyValue: {
    color: COLORS.textPrimary,
  },
});

export default EarningScreen;
