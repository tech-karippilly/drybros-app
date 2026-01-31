/**
 * Alerts tab screen (notifications)
 * Matches provided design (header + alert cards list)
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from '../typography';
import { COLORS, TAB_BAR_SCENE_PADDING_BOTTOM, ALERTS_COLORS, ALERTS_LAYOUT, ALERTS_MOCK_LIST, ALERTS_STRINGS, type AlertItem } from '../constants';
import { normalizeWidth, normalizeHeight } from '../utils/responsive';

type AlertsHeaderProps = {
  title: string;
};

function AlertsHeader({ title }: AlertsHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Spacer to keep title centered */}
      <View style={styles.headerSideSpacer} />
      <Text variant="body" weight="semiBold" style={styles.headerTitle}>
        {title}
      </Text>
      <View style={styles.headerSideSpacer} />
    </View>
  );
}

function getAccentColor(item: AlertItem): string {
  switch (item.type) {
    case 'trip_assigned':
    case 'trip_accepted':
    case 'payment_completed':
    case 'leave_approved':
    case 'profile_approved':
      return ALERTS_COLORS.ACCENT_SUCCESS;
    case 'trip_rejected':
    case 'leave_rejected':
      return ALERTS_COLORS.ACCENT_ERROR;
    case 'ride_started':
      return ALERTS_COLORS.ACCENT_INFO;
    case 'payment_pending':
      return ALERTS_COLORS.ACCENT_WARNING;
    default:
      return ALERTS_COLORS.ACCENT_INFO;
  }
}

function AlertActionsRow() {
  return (
    <View style={styles.actionsWrap}>
      <View style={styles.actionsRow}>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} style={[styles.actionBtn, styles.acceptBtn]}>
          <Text variant="body" weight="semiBold" style={styles.acceptText}>
            {ALERTS_STRINGS.ACCEPT}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} style={[styles.actionBtn, styles.rejectBtn]}>
          <Text variant="body" weight="semiBold" style={styles.rejectText}>
            {ALERTS_STRINGS.REJECT}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} style={[styles.actionSecondaryBtn, styles.viewTripBtn]}>
        <Text variant="body" weight="semiBold" style={styles.viewTripText}>
          {ALERTS_STRINGS.VIEW_TRIP}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function AlertCard({ item }: { item: AlertItem }) {
  const accent = getAccentColor(item);
  const isActionable = Boolean(item.isActionable);
  const showTrip = Boolean(item.tripIdLabel);

  return (
    <View style={styles.cardOuter}>
      <View style={[styles.cardAccent, { backgroundColor: accent }]} />
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.9} style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text variant="body" weight="semiBold" style={styles.cardTitle}>
            {item.title}
          </Text>
          <Text variant="caption" style={styles.cardTime}>
            {item.timeLabel}
          </Text>
        </View>

        <Text variant="caption" style={styles.cardMessage} numberOfLines={isActionable ? undefined : 2}>
          {showTrip ? (
            <>
              {item.messagePrefix ? `${item.messagePrefix} ` : ''}
              <Text variant="caption" weight="semiBold" style={styles.tripIdBold}>
                {ALERTS_STRINGS.TRIP_ID_PREFIX} {item.tripIdLabel}
              </Text>
              {item.messageSuffix ? ` ${item.messageSuffix}` : ''}
            </>
          ) : (
            item.messagePrefix
          )}
        </Text>

        {isActionable ? <AlertActionsRow /> : null}
      </TouchableOpacity>
    </View>
  );
}

export function AlertsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status bar: white background + dark icons (as per design) */}
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <AlertsHeader title={ALERTS_STRINGS.TITLE} />
      <View style={styles.headerDivider} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: normalizeHeight(ALERTS_LAYOUT.LIST_PADDING_BOTTOM) + TAB_BAR_SCENE_PADDING_BOTTOM,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {ALERTS_MOCK_LIST.map((item) => (
          <AlertCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ALERTS_COLORS.SCREEN_BG,
  },
  scrollContent: {
    paddingHorizontal: normalizeWidth(ALERTS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingTop: normalizeHeight(ALERTS_LAYOUT.LIST_PADDING_TOP),
    gap: normalizeHeight(ALERTS_LAYOUT.CARD_GAP),
  },
  header: {
    height: normalizeHeight(ALERTS_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(ALERTS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(ALERTS_LAYOUT.HEADER_TITLE_FONT_SIZE),
    textAlign: 'center',
  },
  headerSideSpacer: {
    width: normalizeWidth(44),
    height: normalizeHeight(44),
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
  },

  cardOuter: {
    flexDirection: 'row',
    borderRadius: normalizeWidth(ALERTS_LAYOUT.CARD_RADIUS),
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && {
      shadowColor: ALERTS_COLORS.CARD_SHADOW,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    }),
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  cardAccent: {
    width: normalizeWidth(ALERTS_LAYOUT.ACCENT_WIDTH),
  },
  card: {
    flex: 1,
    backgroundColor: ALERTS_COLORS.CARD_BG,
    padding: normalizeWidth(ALERTS_LAYOUT.CARD_PADDING),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: normalizeWidth(ALERTS_LAYOUT.CARD_TITLE_GAP),
  },
  cardTitle: {
    flex: 1,
    color: COLORS.textPrimary,
  },
  cardTime: {
    color: ALERTS_COLORS.SUBTEXT,
    fontSize: normalizeWidth(ALERTS_LAYOUT.CARD_TIME_FONT_SIZE),
  },
  cardMessage: {
    color: ALERTS_COLORS.SUBTEXT,
    marginTop: normalizeHeight(10),
    lineHeight: normalizeHeight(18),
  },
  tripIdBold: {
    color: COLORS.textPrimary,
  },

  actionsWrap: {
    marginTop: normalizeHeight(16),
    gap: normalizeHeight(12),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: normalizeWidth(ALERTS_LAYOUT.ACTION_ROW_GAP),
  },
  actionBtn: {
    flex: 1,
    height: normalizeHeight(ALERTS_LAYOUT.ACTION_BUTTON_HEIGHT),
    borderRadius: normalizeWidth(ALERTS_LAYOUT.ACTION_BUTTON_RADIUS),
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: ALERTS_COLORS.ACCEPT_BG,
  },
  acceptText: {
    color: ALERTS_COLORS.ACCEPT_TEXT,
    fontSize: normalizeWidth(ALERTS_LAYOUT.ACTION_BUTTON_FONT_SIZE),
  },
  rejectBtn: {
    backgroundColor: ALERTS_COLORS.REJECT_BG,
  },
  rejectText: {
    color: ALERTS_COLORS.REJECT_TEXT,
    fontSize: normalizeWidth(ALERTS_LAYOUT.ACTION_BUTTON_FONT_SIZE),
  },
  actionSecondaryBtn: {
    height: normalizeHeight(ALERTS_LAYOUT.ACTION_SECONDARY_HEIGHT),
    borderRadius: normalizeWidth(ALERTS_LAYOUT.ACTION_SECONDARY_RADIUS),
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewTripBtn: {
    backgroundColor: ALERTS_COLORS.VIEW_BG,
  },
  viewTripText: {
    color: ALERTS_COLORS.VIEW_TEXT,
    fontSize: normalizeWidth(ALERTS_LAYOUT.ACTION_SECONDARY_FONT_SIZE),
  },
});

export default AlertsScreen;
