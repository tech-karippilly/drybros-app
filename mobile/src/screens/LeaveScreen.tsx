/**
 * Leave tab screen (attendance / leave)
 * Matches provided design (filters + leave cards + floating add button)
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../typography';
import {
  COLORS,
  TAB_BAR_SCENE_PADDING_BOTTOM,
  TAB_BAR,
  LEAVES_COLORS,
  LEAVES_LAYOUT,
  LEAVES_MOCK_LIST,
  LEAVES_STRINGS,
  LEAVE_STACK_ROUTES,
  type LeaveItem,
  type LeaveStatus,
} from '../constants';
import { normalizeWidth, normalizeHeight } from '../utils/responsive';
import type { LeaveStackParamList } from '../navigation/LeaveStackNavigator';

export function LeaveScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<LeaveStackParamList>>();
  const [filter, setFilter] = React.useState<'all' | LeaveStatus>('all');

  const filtered = React.useMemo(() => {
    if (filter === 'all') return LEAVES_MOCK_LIST;
    return LEAVES_MOCK_LIST.filter((x) => x.status === filter);
  }, [filter]);

  // Place FAB low, overlapping just above the floating tab bar.
  const bottomInset = Math.max(insets.bottom, normalizeHeight(12));
  const fabBottom =
    bottomInset +
    normalizeHeight(TAB_BAR.HEIGHT - LEAVES_LAYOUT.FAB_SIZE / 2) +
    normalizeHeight(LEAVES_LAYOUT.FAB_BOTTOM_OFFSET);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status bar: white background + dark icons (as per design) */}
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        {/* Spacer to keep title centered */}
        <View style={styles.headerSideSpacer} />
        <Text variant="body" weight="semiBold" style={styles.headerTitle}>
          {LEAVES_STRINGS.TITLE}
        </Text>
        <View style={styles.headerSideSpacer} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: normalizeHeight(LEAVES_LAYOUT.LIST_PADDING_BOTTOM) + TAB_BAR_SCENE_PADDING_BOTTOM },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <FilterPill label={LEAVES_STRINGS.FILTER_ALL} isActive={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill
            label={LEAVES_STRINGS.FILTER_PENDING}
            isActive={filter === 'pending'}
            onPress={() => setFilter('pending')}
          />
          <FilterPill
            label={LEAVES_STRINGS.FILTER_APPROVED}
            isActive={filter === 'approved'}
            onPress={() => setFilter('approved')}
          />
          <FilterPill
            label={LEAVES_STRINGS.FILTER_REJECTED}
            isActive={filter === 'rejected'}
            onPress={() => setFilter('rejected')}
          />
        </ScrollView>

        {filtered.map((item) => (
          <LeaveCard key={item.id} item={item} />
        ))}
      </ScrollView>

      {/* Floating action button */}
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => navigation.navigate(LEAVE_STACK_ROUTES.APPLY_LEAVE)}
      >
        <MaterialCommunityIcons
          name="plus"
          size={normalizeWidth(LEAVES_LAYOUT.FAB_ICON_SIZE)}
          color={LEAVES_COLORS.FAB_ICON}
        />
      </TouchableOpacity>
    </View>
  );
}

function FilterPill({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.filterPill,
        isActive ? styles.filterPillActive : styles.filterPillInactive,
      ]}
    >
      <Text
        variant="body"
        weight="semiBold"
        style={[
          styles.filterText,
          { color: isActive ? LEAVES_COLORS.FILTER_ACTIVE_TEXT : LEAVES_COLORS.FILTER_INACTIVE_TEXT },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getStatusMeta(status: LeaveStatus) {
  switch (status) {
    case 'approved':
      return {
        bg: LEAVES_COLORS.STATUS_APPROVED_BG,
        text: LEAVES_COLORS.STATUS_APPROVED_TEXT,
        dot: LEAVES_COLORS.STATUS_APPROVED_DOT,
        label: LEAVES_STRINGS.FILTER_APPROVED.toUpperCase(),
      };
    case 'rejected':
      return {
        bg: LEAVES_COLORS.STATUS_REJECTED_BG,
        text: LEAVES_COLORS.STATUS_REJECTED_TEXT,
        dot: LEAVES_COLORS.STATUS_REJECTED_DOT,
        label: LEAVES_STRINGS.FILTER_REJECTED.toUpperCase(),
      };
    case 'pending':
    default:
      return {
        bg: LEAVES_COLORS.STATUS_PENDING_BG,
        text: LEAVES_COLORS.STATUS_PENDING_TEXT,
        dot: LEAVES_COLORS.STATUS_PENDING_DOT,
        label: LEAVES_STRINGS.FILTER_PENDING.toUpperCase(),
      };
  }
}

function LeaveCard({ item }: { item: LeaveItem }) {
  const meta = getStatusMeta(item.status);

  return (
    <View style={styles.cardOuter}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text variant="caption" style={styles.dateText}>
              {item.dateLabel}
            </Text>
            <Text variant="body" weight="semiBold" style={styles.titleText}>
              {item.title}
            </Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: meta.dot }]} />
            <Text variant="caption" weight="semiBold" style={[styles.statusText, { color: meta.text }]}>
              {meta.label}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LEAVES_COLORS.SCREEN_BG,
  },
  scrollContent: {
    paddingHorizontal: normalizeWidth(LEAVES_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingTop: normalizeHeight(LEAVES_LAYOUT.LIST_PADDING_TOP),
    gap: normalizeHeight(LEAVES_LAYOUT.CARD_GAP),
  },
  header: {
    height: normalizeHeight(LEAVES_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(LEAVES_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(LEAVES_LAYOUT.HEADER_TITLE_FONT_SIZE),
    textAlign: 'center',
  },
  headerSideSpacer: {
    width: normalizeWidth(44),
    height: normalizeHeight(44),
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LEAVES_COLORS.DIVIDER,
  },

  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: normalizeHeight(8),
    paddingBottom: normalizeHeight(6),
    paddingRight: normalizeWidth(LEAVES_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  filterPill: {
    height: normalizeHeight(LEAVES_LAYOUT.FILTER_PILL_HEIGHT),
    borderRadius: normalizeWidth(LEAVES_LAYOUT.FILTER_PILL_RADIUS),
    paddingHorizontal: normalizeWidth(LEAVES_LAYOUT.FILTER_PILL_PADDING_HORIZONTAL),
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
    marginRight: normalizeWidth(LEAVES_LAYOUT.FILTER_ROW_GAP),
  },
  filterPillActive: {
    backgroundColor: LEAVES_COLORS.FILTER_ACTIVE_BG,
  },
  filterPillInactive: {
    backgroundColor: LEAVES_COLORS.FILTER_INACTIVE_BG,
  },
  filterText: {
    fontSize: normalizeWidth(LEAVES_LAYOUT.FILTER_FONT_SIZE),
  },

  cardOuter: {
    borderRadius: normalizeWidth(LEAVES_LAYOUT.CARD_RADIUS),
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && {
      shadowColor: LEAVES_COLORS.CARD_SHADOW,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
    }),
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  card: {
    backgroundColor: LEAVES_COLORS.CARD_BG,
    borderRadius: normalizeWidth(LEAVES_LAYOUT.CARD_RADIUS),
    padding: normalizeWidth(LEAVES_LAYOUT.CARD_PADDING),
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: normalizeWidth(12),
  },
  cardLeft: {
    flex: 1,
    gap: normalizeHeight(LEAVES_LAYOUT.CARD_ROW_GAP),
  },
  dateText: {
    color: LEAVES_COLORS.SUBTEXT,
  },
  titleText: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(LEAVES_LAYOUT.CARD_TITLE_FONT_SIZE),
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: normalizeHeight(LEAVES_LAYOUT.STATUS_PILL_HEIGHT),
    borderRadius: normalizeWidth(LEAVES_LAYOUT.STATUS_PILL_RADIUS),
    paddingHorizontal: normalizeWidth(LEAVES_LAYOUT.STATUS_PILL_PADDING_HORIZONTAL),
    gap: normalizeWidth(8),
  },
  statusDot: {
    width: normalizeWidth(LEAVES_LAYOUT.STATUS_DOT_SIZE),
    height: normalizeWidth(LEAVES_LAYOUT.STATUS_DOT_SIZE),
    borderRadius: normalizeWidth(LEAVES_LAYOUT.STATUS_DOT_SIZE / 2),
  },
  statusText: {
    fontSize: normalizeWidth(LEAVES_LAYOUT.STATUS_FONT_SIZE),
    letterSpacing: 0.5,
  },

  fab: {
    position: 'absolute',
    right: normalizeWidth(LEAVES_LAYOUT.FAB_RIGHT),
    width: normalizeWidth(LEAVES_LAYOUT.FAB_SIZE),
    height: normalizeWidth(LEAVES_LAYOUT.FAB_SIZE),
    borderRadius: normalizeWidth(LEAVES_LAYOUT.FAB_RADIUS),
    backgroundColor: LEAVES_COLORS.FAB_BG,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios' && {
      shadowColor: LEAVES_COLORS.CARD_SHADOW,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 18,
    }),
    ...(Platform.OS === 'android' && { elevation: 6 }),
  },
});

export default LeaveScreen;
