/**
 * Trip tab screen
 * Matches provided design (filters + trip cards list)
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../typography';
import {
  COLORS,
  TAB_BAR_SCENE_PADDING_BOTTOM,
  TRIPS_COLORS,
  TRIPS_LAYOUT,
  TRIPS_STRINGS,
  TRIP_STACK_ROUTES,
  type TripFilter,
  type TripItem,
  type TripStatus,
} from '../constants';
import { normalizeWidth, normalizeHeight } from '../utils/responsive';
import type { TripStackParamList } from '../navigation/TripStackNavigator';
import { useToast, useTripRealtime } from '../contexts';
import { getMyTripsApi, getTripByIdApi } from '../services/api/trips';
import { mapBackendTripToTripItem } from '../services/mappers/trips';
import { getPendingTripOffers, removePendingTripOffer } from '../services/storage/tripStorage';

export function TripScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<TripStackParamList>>();
  const { showToast } = useToast();
  const { lastAssignedTripId } = useTripRealtime();
  const [filter, setFilter] = React.useState<TripFilter>('all');
  const [trips, setTrips] = React.useState<TripItem[]>([]);
  const [pendingTrips, setPendingTrips] = React.useState<TripItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const loadPendingOffers = React.useCallback(async () => {
    try {
      const offers = await getPendingTripOffers();
      const pendingTripItems: TripItem[] = [];

      // Load trip details for each pending offer
      for (const offer of offers) {
        try {
          const trip = await getTripByIdApi(offer.tripId);
          const tripItem = mapBackendTripToTripItem(trip);
          // Override status to 'requested'
          pendingTripItems.push({
            ...tripItem,
            status: 'requested',
            footerLabel: `Offer received`,
          });
        } catch (err) {
          // If trip doesn't exist anymore, remove from storage
          await removePendingTripOffer(offer.offerId);
        }
      }

      setPendingTrips(pendingTripItems);
    } catch (error) {
      console.error('Failed to load pending offers:', error);
    }
  }, []);

  const loadTrips = React.useCallback(async () => {
    setLoading(true);
    try {
      const allTrips = await getMyTripsApi();
      setTrips(allTrips.map(mapBackendTripToTripItem));
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load trips';
      showToast({ message: errorMessage, type: 'error', position: 'top' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load trips on mount
  React.useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Reload trips when new trip is assigned
  React.useEffect(() => {
    if (lastAssignedTripId) {
      loadTrips();
      loadPendingOffers(); // Also refresh pending offers
    }
  }, [lastAssignedTripId, loadTrips, loadPendingOffers]);

  // Reload pending offers when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadPendingOffers();
    }, [loadPendingOffers])
  );

  // Merge trips and pending trips
  const allTrips = React.useMemo(() => {
    return [...pendingTrips, ...trips];
  }, [pendingTrips, trips]);

  const filtered = React.useMemo(() => {
    if (filter === 'all') return allTrips;
    return allTrips.filter((x) => x.status === filter);
  }, [filter, allTrips]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <View style={styles.headerSideSpacer} />
        <Text variant="body" weight="semiBold" style={styles.headerTitle}>
          {TRIPS_STRINGS.TITLE}
        </Text>
        <View style={styles.headerSideSpacer} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: normalizeHeight(TRIPS_LAYOUT.LIST_PADDING_BOTTOM) + TAB_BAR_SCENE_PADDING_BOTTOM },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          <FilterPill label={TRIPS_STRINGS.FILTER_ALL} isActive={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill
            label={TRIPS_STRINGS.FILTER_REQUESTED}
            isActive={filter === 'requested'}
            onPress={() => setFilter('requested')}
          />
          <FilterPill
            label={TRIPS_STRINGS.FILTER_UPCOMING}
            isActive={filter === 'upcoming'}
            onPress={() => setFilter('upcoming')}
          />
          <FilterPill
            label={TRIPS_STRINGS.FILTER_ONGOING}
            isActive={filter === 'ongoing'}
            onPress={() => setFilter('ongoing')}
          />
          <FilterPill
            label={TRIPS_STRINGS.FILTER_COMPLETED}
            isActive={filter === 'completed'}
            onPress={() => setFilter('completed')}
          />
        </ScrollView>

        {filtered.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onPress={() => navigation.navigate(TRIP_STACK_ROUTES.TRIP_DETAILS, { trip })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function FilterPill({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.filterPill, isActive ? styles.filterPillActive : styles.filterPillInactive]}
    >
      <Text
        variant="body"
        weight="semiBold"
        style={[
          styles.filterText,
          { color: isActive ? TRIPS_COLORS.FILTER_ACTIVE_TEXT : TRIPS_COLORS.FILTER_INACTIVE_TEXT },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getStatusMeta(status: TripStatus) {
  switch (status) {
    case 'ongoing':
      return {
        bg: TRIPS_COLORS.STATUS_ONGOING_BG,
        text: TRIPS_COLORS.STATUS_ONGOING_TEXT,
        label: TRIPS_STRINGS.FILTER_ONGOING.toUpperCase(),
      };
    case 'completed':
      return {
        bg: TRIPS_COLORS.STATUS_COMPLETED_BG,
        text: TRIPS_COLORS.STATUS_COMPLETED_TEXT,
        label: TRIPS_STRINGS.FILTER_COMPLETED.toUpperCase(),
      };
    case 'requested':
      return {
        bg: TRIPS_COLORS.STATUS_REQUESTED_BG,
        text: TRIPS_COLORS.STATUS_REQUESTED_TEXT,
        label: TRIPS_STRINGS.FILTER_REQUESTED.toUpperCase(),
      };
    case 'upcoming':
    default:
      return {
        bg: TRIPS_COLORS.STATUS_UPCOMING_BG,
        text: TRIPS_COLORS.STATUS_UPCOMING_TEXT,
        label: TRIPS_STRINGS.FILTER_UPCOMING.toUpperCase(),
      };
  }
}

function TripCard({ trip, onPress }: { trip: TripItem; onPress: () => void }) {
  const status = getStatusMeta(trip.status);

  return (
    <View style={styles.cardOuter}>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.9} style={styles.card} onPress={onPress}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTopLeft}>
            <Text variant="caption" style={styles.subText}>
              {TRIPS_STRINGS.TRIP_ID_LABEL}
            </Text>
            <Text variant="body" weight="semiBold" style={styles.tripIdText}>
              {trip.tripIdLabel}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text variant="caption" weight="semiBold" style={[styles.statusText, { color: status.text }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.sectionSpacer} />

        <Text variant="caption" style={styles.subText}>
          {TRIPS_STRINGS.CUSTOMER_LABEL}
        </Text>
        <Text variant="body" weight="semiBold" style={styles.valueText}>
          {trip.customerName}
        </Text>

        <View style={styles.sectionSpacer} />

        <View style={styles.routeBlock}>
          <View style={styles.routeDotsCol}>
            <View style={[styles.routeDot, { backgroundColor: TRIPS_COLORS.PICKUP_DOT }]} />
            <View style={styles.routeLine} />
            <View style={[styles.routeDot, { backgroundColor: TRIPS_COLORS.DROP_DOT }]} />
          </View>
          <View style={styles.routeTextCol}>
            <View style={styles.routeRow}>
              <Text variant="caption" style={styles.subText}>
                {TRIPS_STRINGS.PICKUP_LABEL}
              </Text>
              <Text variant="body" weight="semiBold" style={styles.valueText}>
                {trip.pickup}
              </Text>
            </View>
            <View style={styles.routeRow}>
              <Text variant="caption" style={styles.subText}>
                {TRIPS_STRINGS.DROP_LABEL}
              </Text>
              <Text variant="body" weight="semiBold" style={styles.valueText}>
                {trip.drop}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.footerRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={normalizeWidth(TRIPS_LAYOUT.FOOTER_ICON_SIZE)}
            color={TRIPS_COLORS.SUBTEXT}
          />
          <Text variant="caption" style={styles.subText}>
            {trip.footerLabel}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TRIPS_COLORS.SCREEN_BG,
  },
  scrollContent: {
    paddingHorizontal: normalizeWidth(TRIPS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingTop: normalizeHeight(TRIPS_LAYOUT.LIST_PADDING_TOP),
    gap: normalizeHeight(TRIPS_LAYOUT.CARD_GAP),
  },
  header: {
    height: normalizeHeight(TRIPS_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(TRIPS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(TRIPS_LAYOUT.HEADER_TITLE_FONT_SIZE),
    textAlign: 'center',
  },
  headerSideSpacer: {
    width: normalizeWidth(44),
    height: normalizeHeight(44),
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: TRIPS_COLORS.DIVIDER,
  },

  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: normalizeHeight(8),
    paddingBottom: normalizeHeight(6),
    paddingRight: normalizeWidth(TRIPS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  filterPill: {
    height: normalizeHeight(TRIPS_LAYOUT.FILTER_PILL_HEIGHT),
    borderRadius: normalizeWidth(TRIPS_LAYOUT.FILTER_PILL_RADIUS),
    paddingHorizontal: normalizeWidth(TRIPS_LAYOUT.FILTER_PILL_PADDING_HORIZONTAL),
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
    marginRight: normalizeWidth(TRIPS_LAYOUT.FILTER_ROW_GAP),
  },
  filterPillActive: { backgroundColor: TRIPS_COLORS.FILTER_ACTIVE_BG },
  filterPillInactive: { backgroundColor: TRIPS_COLORS.FILTER_INACTIVE_BG },
  filterText: { fontSize: normalizeWidth(TRIPS_LAYOUT.FILTER_FONT_SIZE) },

  cardOuter: {
    borderRadius: normalizeWidth(TRIPS_LAYOUT.CARD_RADIUS),
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && {
      shadowColor: TRIPS_COLORS.CARD_SHADOW,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
    }),
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  card: {
    backgroundColor: TRIPS_COLORS.CARD_BG,
    borderRadius: normalizeWidth(TRIPS_LAYOUT.CARD_RADIUS),
    padding: normalizeWidth(TRIPS_LAYOUT.CARD_PADDING),
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: normalizeWidth(12),
  },
  cardTopLeft: { flex: 1 },
  subText: { color: TRIPS_COLORS.SUBTEXT },
  valueText: { color: COLORS.textPrimary, marginTop: normalizeHeight(2) },
  tripIdText: { color: COLORS.textPrimary, marginTop: normalizeHeight(6) },
  sectionSpacer: { height: normalizeHeight(TRIPS_LAYOUT.SECTION_GAP) },

  statusPill: {
    height: normalizeHeight(TRIPS_LAYOUT.STATUS_PILL_HEIGHT),
    borderRadius: normalizeWidth(TRIPS_LAYOUT.STATUS_PILL_RADIUS),
    paddingHorizontal: normalizeWidth(TRIPS_LAYOUT.STATUS_PILL_PADDING_HORIZONTAL),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontSize: normalizeWidth(TRIPS_LAYOUT.STATUS_FONT_SIZE), letterSpacing: 0.5 },

  routeBlock: { flexDirection: 'row', gap: normalizeWidth(12) },
  routeDotsCol: { width: normalizeWidth(16), alignItems: 'center' },
  routeDot: { width: normalizeWidth(10), height: normalizeWidth(10), borderRadius: normalizeWidth(5) },
  routeLine: {
    width: normalizeWidth(TRIPS_LAYOUT.ROUTE_LINE_WIDTH),
    height: normalizeHeight(TRIPS_LAYOUT.ROUTE_LINE_HEIGHT),
    backgroundColor: TRIPS_COLORS.DIVIDER,
    marginVertical: normalizeHeight(6),
  },
  routeTextCol: { flex: 1, gap: normalizeHeight(14) },
  routeRow: { gap: normalizeHeight(4) },

  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: TRIPS_COLORS.DIVIDER,
    marginVertical: normalizeHeight(16),
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: normalizeWidth(10) },
});

export default TripScreen;
