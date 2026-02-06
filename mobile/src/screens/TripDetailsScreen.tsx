/**
 * Trip Details screen
 * Opened from Trips list; returns back to Trips list on back.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { Text } from '../typography';
import { SwipeButton, PrimaryButton } from '../components/ui';
import { openPhoneDialer } from '../utils/linking';
import {
  COLORS,
  TAB_BAR_SCENE_PADDING_BOTTOM,
  BACKEND_TRIP_STATUSES,
  TRIPS_COLORS,
  TRIPS_LAYOUT,
  TRIPS_STRINGS,
  TRIP_STACK_ROUTES,
  type TripItem,
} from '../constants';
import { normalizeHeight, normalizeWidth } from '../utils/responsive';
import type { TripStackParamList } from '../navigation/TripStackNavigator';
import { useToast } from '../contexts';
import { getTripByIdApi } from '../services/api/trips';
import { mapBackendTripToTripItem } from '../services/mappers/trips';
import { getPendingTripOffers, removePendingTripOffer } from '../services/storage/tripStorage';
import { emitTripOfferAccept, emitTripOfferReject, getDriverSocket } from '../services/realtime/socket';
import { startTripLocationTracking, stopTripLocationTracking } from '../services/tripLocationTracking';

type Props = NativeStackScreenProps<TripStackParamList, typeof TRIP_STACK_ROUTES.TRIP_DETAILS>;

function getStatusPill(status: TripItem['status']) {
  switch (status) {
    case 'ongoing':
      return { bg: TRIPS_COLORS.STATUS_ONGOING_BG, text: TRIPS_COLORS.STATUS_ONGOING_TEXT, label: TRIPS_STRINGS.FILTER_ONGOING.toUpperCase() };
    case 'completed':
      return { bg: TRIPS_COLORS.STATUS_COMPLETED_BG, text: TRIPS_COLORS.STATUS_COMPLETED_TEXT, label: TRIPS_STRINGS.FILTER_COMPLETED.toUpperCase() };
    case 'requested':
      return { bg: TRIPS_COLORS.STATUS_REQUESTED_BG, text: TRIPS_COLORS.STATUS_REQUESTED_TEXT, label: TRIPS_STRINGS.FILTER_REQUESTED.toUpperCase() };
    case 'upcoming':
    default:
      return { bg: TRIPS_COLORS.STATUS_UPCOMING_BG, text: TRIPS_COLORS.STATUS_UPCOMING_TEXT, label: TRIPS_STRINGS.FILTER_UPCOMING.toUpperCase() };
  }
}

function RouteBlock({ pickup, drop }: { pickup: string; drop: string }) {
  return (
    <View style={styles.routeBlock}>
      <View style={styles.routeDotsCol}>
        <View style={[styles.routeDot, { backgroundColor: TRIPS_COLORS.PICKUP_DOT }]} />
        <View style={styles.routeLine} />
        <View style={[styles.routeDot, { backgroundColor: TRIPS_COLORS.DROP_DOT }]} />
      </View>
      <View style={styles.routeTextCol}>
        <View style={styles.routeRow}>
          <Text variant="caption" style={styles.routeLabel}>{TRIPS_STRINGS.PICKUP_LOCATION_LABEL}</Text>
          <Text variant="body" weight="semiBold" style={styles.routeValue}>{pickup}</Text>
        </View>
        <View style={styles.routeRow}>
          <Text variant="caption" style={styles.routeLabel}>{TRIPS_STRINGS.DROP_LOCATION_LABEL}</Text>
          <Text variant="body" weight="semiBold" style={styles.routeValue}>{drop}</Text>
        </View>
      </View>
    </View>
  );
}

export function TripDetailsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const initialTrip: TripItem | undefined = route.params?.trip;
  const [trip, setTrip] = React.useState<TripItem | undefined>(initialTrip);
  const [elapsedLabel, setElapsedLabel] = React.useState<string>('');
  const [swipeResetSeed, setSwipeResetSeed] = React.useState(0);
  const [offerId, setOfferId] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  if (!trip) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.headerIconBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="chevron-left" size={normalizeWidth(28)} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text variant="body" weight="semiBold" style={styles.headerTitle}>{TRIPS_STRINGS.DETAILS_TITLE}</Text>
          <View style={styles.headerSideSpacer} />
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.emptyWrap}>
          <Text variant="body" style={{ color: COLORS.textSecondary }}>{TRIPS_STRINGS.DETAILS_TITLE}</Text>
        </View>
      </View>
    );
  }

  const load = React.useCallback(async () => {
    try {
      if (!initialTrip?.id) return;
      const detailed = await getTripByIdApi(initialTrip.id);
      const mapped = mapBackendTripToTripItem(detailed);
      setTrip((prev) => ({ ...(prev ?? mapped), ...mapped }));

      // If trip is requested, load the offerId from storage
      if (initialTrip.status === 'requested') {
        const offers = await getPendingTripOffers();
        const offer = offers.find((o) => o.tripId === initialTrip.id);
        if (offer) {
          setOfferId(offer.offerId);
        }
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load trip details';
      showToast({ message: errorMessage, type: 'error', position: 'top' });
    }
  }, [initialTrip?.id, initialTrip?.status, showToast]);

  // Polling for live location updates every 5 minutes for ongoing trips
  React.useEffect(() => {
    if (!trip?.id || trip.status !== 'ongoing') return;

    const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
    const intervalId = setInterval(() => {
      load();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [trip?.id, trip?.status, load]);

  React.useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    React.useCallback(() => {
      load();
      setSwipeResetSeed((s) => s + 1);
    }, [load])
  );

  // Start/stop location tracking based on trip status
  React.useEffect(() => {
    if (!trip?.id) return;

    const backendStatus = (trip.backendStatus ?? '').trim().toUpperCase();
    const isPaymentPending = backendStatus === BACKEND_TRIP_STATUSES.TRIP_PROGRESS;
    const isOngoing = trip.status === 'ongoing' && !isPaymentPending;

    if (isOngoing) {
      // Start location tracking when trip is ongoing
      startTripLocationTracking(trip.id);
      return () => {
        // Stop tracking when component unmounts or trip status changes
        stopTripLocationTracking();
      };
    } else {
      // Stop tracking if trip is no longer ongoing
      stopTripLocationTracking();
    }
  }, [trip?.id, trip?.status, trip?.backendStatus]);

  React.useEffect(() => {
    if (trip.status !== 'ongoing') {
      setElapsedLabel('');
      return;
    }
    if (!trip.startedAtISO) {
      setElapsedLabel('');
      return;
    }

    const startedAtMs = new Date(trip.startedAtISO).getTime();
    if (Number.isNaN(startedAtMs)) {
      setElapsedLabel('');
      return;
    }

    const tick = () => {
      const diffMs = Math.max(0, Date.now() - startedAtMs);
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      setElapsedLabel(`${hh}:${mm}:${ss}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [trip.startedAtISO, trip.status]);

  const handleAccept = React.useCallback(async () => {
    if (!offerId || actionLoading) return;
    setActionLoading(true);
    try {
      const socket = getDriverSocket();
      if (!socket) {
        throw new Error('Socket not connected');
      }
      
      emitTripOfferAccept(offerId);
      // Remove from storage
      await removePendingTripOffer(offerId);
      showToast({ message: 'Trip accepted successfully', type: 'success', position: 'top' });
      navigation.goBack();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to accept trip';
      showToast({ message: errorMessage, type: 'error', position: 'top' });
    } finally {
      setActionLoading(false);
    }
  }, [offerId, actionLoading, navigation, showToast]);

  const handleReject = React.useCallback(async () => {
    if (!offerId || actionLoading) return;
    setActionLoading(true);
    try {
      const socket = getDriverSocket();
      if (!socket) {
        throw new Error('Socket not connected');
      }
      
      emitTripOfferReject(offerId);
      // Remove from storage
      await removePendingTripOffer(offerId);
      showToast({ message: 'Trip rejected', type: 'info', position: 'top' });
      navigation.goBack();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to reject trip';
      showToast({ message: errorMessage, type: 'error', position: 'top' });
    } finally {
      setActionLoading(false);
    }
  }, [offerId, actionLoading, navigation, showToast]);

  const status = getStatusPill(trip.status);
  const backendStatus = (trip.backendStatus ?? '').trim().toUpperCase();
  const isPaymentPending = backendStatus === BACKEND_TRIP_STATUSES.TRIP_PROGRESS;
  const isOngoing = trip.status === 'ongoing' && !isPaymentPending;
  const isRequested = trip.status === 'requested';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.headerIconBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="chevron-left" size={normalizeWidth(28)} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text variant="body" weight="semiBold" style={styles.headerTitle}>
          {TRIPS_STRINGS.DETAILS_TITLE}
        </Text>
        <View style={styles.headerSideSpacer} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: normalizeHeight(24) + TAB_BAR_SCENE_PADDING_BOTTOM },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text variant="caption" style={styles.topLabel}>{TRIPS_STRINGS.TRIP_ID_LABEL}</Text>
            <Text variant="body" weight="semiBold" style={styles.topValue}>{trip.tripIdLabel}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text variant="caption" weight="semiBold" style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.cardOuter}>
          <View style={styles.card}>
            <Text variant="caption" style={styles.sectionLabel}>{TRIPS_STRINGS.CUSTOMER_LABEL}</Text>
            <Text variant="body" weight="semiBold" style={styles.sectionValue}>{trip.customerName}</Text>

            <View style={styles.sectionSpacer} />
            <RouteBlock pickup={trip.pickup} drop={trip.drop} />

            <View style={styles.sectionDivider} />
            <View style={styles.timeRow}>
              <MaterialCommunityIcons name="clock-outline" size={normalizeWidth(18)} color={TRIPS_COLORS.SUBTEXT} />
              <View>
                <Text variant="caption" style={styles.sectionLabel}>{TRIPS_STRINGS.SCHEDULED_DATE_TIME_LABEL}</Text>
                <Text variant="body" weight="semiBold" style={styles.sectionValue}>{trip.scheduledDateTimeLabel}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.85}
                style={styles.actionBtn}
                onPress={() => openPhoneDialer(trip.customerPhone)}
              >
                <MaterialCommunityIcons name="phone-outline" size={normalizeWidth(18)} color={COLORS.textPrimary} />
                <Text variant="body" weight="semiBold" style={styles.actionText}>{TRIPS_STRINGS.CALL_CUSTOMER}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} style={styles.actionBtn}>
                <MaterialCommunityIcons name="navigation-variant-outline" size={normalizeWidth(18)} color={COLORS.textPrimary} />
                <Text variant="body" weight="semiBold" style={styles.actionText}>{TRIPS_STRINGS.NAVIGATE}</Text>
              </TouchableOpacity>
            </View>

            {isOngoing && elapsedLabel ? (
              <View style={styles.timerRow}>
                <Text variant="caption" style={styles.sectionLabel}>{TRIPS_STRINGS.TRIP_TIMER_LABEL}</Text>
                <Text variant="body" weight="semiBold" style={styles.sectionValue}>{elapsedLabel}</Text>
              </View>
            ) : null}

            {isRequested ? (
              <View style={styles.requestedActions}>
                <View style={styles.requestedButtonRow}>
                  <View style={styles.requestedButtonFlex}>
                    <PrimaryButton
                      label="Accept"
                      onPress={handleAccept}
                      backgroundColor={COLORS.success}
                      textColor={COLORS.white}
                      height={normalizeHeight(58)}
                      disabled={actionLoading}
                    />
                  </View>
                  <View style={styles.requestedButtonFlex}>
                    <PrimaryButton
                      label="Reject"
                      onPress={handleReject}
                      backgroundColor="#FAD1D1"
                      textColor={COLORS.error}
                      height={normalizeHeight(58)}
                      disabled={actionLoading}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.swipeWrap}>
                <SwipeButton
                  key={`${trip.id}-${trip.status}-${swipeResetSeed}`}
                  label={
                    isPaymentPending
                      ? TRIPS_STRINGS.SWIPE_COLLECT_PAYMENT
                      : isOngoing
                        ? TRIPS_STRINGS.SWIPE_END_TRIP
                        : TRIPS_STRINGS.SWIPE_START_TRIP
                  }
                  onSwipeComplete={() =>
                    isPaymentPending
                      ? navigation.navigate(TRIP_STACK_ROUTES.TRIP_PAYMENT, { trip })
                      : isOngoing
                        ? navigation.navigate(TRIP_STACK_ROUTES.TRIP_END, { trip })
                        : navigation.navigate(TRIP_STACK_ROUTES.TRIP_START, { trip })
                  }
                  height={normalizeHeight(TRIPS_LAYOUT.DETAILS_SWIPE_HEIGHT)}
                  trackColor={TRIPS_COLORS.SWIPE_TRACK_BG}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text variant="body" weight="semiBold" style={styles.sectionTitle}>{TRIPS_STRINGS.CUSTOMER_DETAILS_TITLE}</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={normalizeWidth(28)} color={COLORS.gray500} />
            </View>
            <View style={styles.customerTextCol}>
              <Text variant="body" weight="semiBold" style={styles.sectionValue}>{trip.customerName}</Text>
              <Text variant="caption" style={styles.subText}>{trip.customerPhone}</Text>
            </View>
          </View>
        </View>

        {trip.liveLocationLat != null && trip.liveLocationLng != null && isOngoing ? (
          <View style={styles.sectionBlock}>
            <View style={styles.liveLocationHeader}>
              <Text variant="body" weight="semiBold" style={styles.sectionTitle}>Driver Live Location</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text variant="caption" style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={normalizeWidth(20)} color={COLORS.primary} />
              <View style={styles.locationTextCol}>
                <Text variant="caption" style={styles.kvLabel}>Latitude</Text>
                <Text variant="body" weight="semiBold" style={styles.kvValue}>{trip.liveLocationLat.toFixed(6)}</Text>
              </View>
            </View>
            <View style={styles.locationSpacer} />
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={normalizeWidth(20)} color={COLORS.primary} />
              <View style={styles.locationTextCol}>
                <Text variant="caption" style={styles.kvLabel}>Longitude</Text>
                <Text variant="body" weight="semiBold" style={styles.kvValue}>{trip.liveLocationLng.toFixed(6)}</Text>
              </View>
            </View>
            <Text variant="caption" style={styles.locationUpdateText}>Updates every 5 minutes</Text>
          </View>
        ) : null}

        <View style={styles.sectionBlock}>
          <Text variant="body" weight="semiBold" style={styles.sectionTitle}>{TRIPS_STRINGS.TRIP_METRICS_TITLE}</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text variant="body" weight="semiBold" style={styles.metricValue}>{trip.estDistanceKm}</Text>
              <Text variant="caption" style={styles.subText}>{TRIPS_STRINGS.EST_DISTANCE}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text variant="body" weight="semiBold" style={styles.metricValue}>{trip.estDurationMin}</Text>
              <Text variant="caption" style={styles.subText}>{TRIPS_STRINGS.EST_DURATION}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text variant="body" weight="semiBold" style={styles.sectionTitle}>{TRIPS_STRINGS.TRIP_METRICS_TITLE}</Text>
          <View style={styles.kvBlock}>
            <KV label={TRIPS_STRINGS.VEHICLE_NUMBER} value={trip.vehicleNumber} />
            <KV label={TRIPS_STRINGS.TRANSMISSION} value={trip.transmission} />
            <KV label={TRIPS_STRINGS.VEHICLE_MODEL} value={trip.vehicleModel} />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text variant="body" weight="semiBold" style={styles.sectionTitle}>{TRIPS_STRINGS.BOOKING_DETAILS_TITLE}</Text>
          <View style={styles.kvBlock}>
            <KV label={TRIPS_STRINGS.BOOKING_TIME} value={trip.bookingTimeLabel} />
            <View style={styles.kvTwoCol}>
              <View style={styles.kvHalf}>
                <KV label={TRIPS_STRINGS.SERVICE_TYPE} value={trip.serviceType} />
              </View>
              <View style={styles.kvHalf}>
                <KV label={TRIPS_STRINGS.SPECIAL_REQUESTS} value={trip.specialRequests} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text variant="caption" style={styles.kvLabel}>{label}</Text>
      <Text variant="body" weight="semiBold" style={styles.kvValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TRIPS_COLORS.SCREEN_BG },
  header: {
    height: normalizeHeight(TRIPS_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(TRIPS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerIconBtn: {
    width: normalizeWidth(44),
    height: normalizeHeight(44),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(TRIPS_LAYOUT.HEADER_TITLE_FONT_SIZE),
    textAlign: 'center',
  },
  headerSideSpacer: { width: normalizeWidth(44), height: normalizeHeight(44) },
  headerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: TRIPS_COLORS.DIVIDER },

  scrollContent: {
    paddingHorizontal: normalizeWidth(TRIPS_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingTop: normalizeHeight(TRIPS_LAYOUT.DETAILS_TOP_PADDING),
    gap: normalizeHeight(18),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLabel: { color: TRIPS_COLORS.SUBTEXT },
  topValue: { color: COLORS.textPrimary, marginTop: normalizeHeight(4) },

  statusPill: {
    height: normalizeHeight(TRIPS_LAYOUT.STATUS_PILL_HEIGHT),
    borderRadius: normalizeWidth(TRIPS_LAYOUT.STATUS_PILL_RADIUS),
    paddingHorizontal: normalizeWidth(TRIPS_LAYOUT.STATUS_PILL_PADDING_HORIZONTAL),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: { fontSize: normalizeWidth(TRIPS_LAYOUT.STATUS_FONT_SIZE), letterSpacing: 0.5 },

  cardOuter: {
    borderRadius: normalizeWidth(TRIPS_LAYOUT.DETAILS_CARD_RADIUS),
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
    borderRadius: normalizeWidth(TRIPS_LAYOUT.DETAILS_CARD_RADIUS),
    padding: normalizeWidth(TRIPS_LAYOUT.DETAILS_CARD_PADDING),
  },
  sectionLabel: { color: TRIPS_COLORS.SUBTEXT },
  sectionValue: { color: COLORS.textPrimary, marginTop: normalizeHeight(4) },
  sectionSpacer: { height: normalizeHeight(14) },
  sectionDivider: { height: StyleSheet.hairlineWidth, backgroundColor: TRIPS_COLORS.DIVIDER, marginVertical: normalizeHeight(16) },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: normalizeWidth(12) },

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
  routeLabel: { color: TRIPS_COLORS.SUBTEXT },
  routeValue: { color: COLORS.textPrimary },

  actionsRow: {
    flexDirection: 'row',
    gap: normalizeWidth(TRIPS_LAYOUT.DETAILS_ACTION_GAP),
    marginTop: normalizeHeight(16),
  },
  actionBtn: {
    flex: 1,
    height: normalizeHeight(TRIPS_LAYOUT.DETAILS_ACTION_BTN_HEIGHT),
    borderRadius: normalizeWidth(TRIPS_LAYOUT.DETAILS_ACTION_BTN_RADIUS),
    backgroundColor: TRIPS_COLORS.ACTION_BG,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: normalizeWidth(10),
  },
  actionText: { color: TRIPS_COLORS.ACTION_TEXT },
  swipeWrap: { marginTop: normalizeHeight(14) },
  timerRow: { marginTop: normalizeHeight(12), gap: normalizeHeight(4) },

  requestedActions: { marginTop: normalizeHeight(14) },
  requestedButtonRow: { flexDirection: 'row', gap: normalizeWidth(14) },
  requestedButtonFlex: { flex: 1 },

  sectionBlock: { backgroundColor: TRIPS_COLORS.CARD_BG, borderRadius: normalizeWidth(18), padding: normalizeWidth(18) },
  sectionTitle: { color: COLORS.textPrimary, marginBottom: normalizeHeight(12) },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: normalizeWidth(12) },
  avatar: {
    width: normalizeWidth(46),
    height: normalizeWidth(46),
    borderRadius: normalizeWidth(23),
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerTextCol: { flex: 1 },
  subText: { color: TRIPS_COLORS.SUBTEXT, marginTop: normalizeHeight(2) },

  metricsRow: { flexDirection: 'row', gap: normalizeWidth(14) },
  metricCard: {
    flex: 1,
    backgroundColor: TRIPS_COLORS.METRIC_CARD_BG,
    borderRadius: normalizeWidth(TRIPS_LAYOUT.METRIC_CARD_RADIUS),
    padding: normalizeWidth(TRIPS_LAYOUT.METRIC_CARD_PADDING),
  },
  metricValue: { color: COLORS.textPrimary },

  kvBlock: { gap: normalizeHeight(14) },
  kvRow: { gap: normalizeHeight(4) },
  kvLabel: { color: TRIPS_COLORS.SUBTEXT },
  kvValue: { color: COLORS.textPrimary },
  kvTwoCol: { flexDirection: 'row', gap: normalizeWidth(14) },
  kvHalf: { flex: 1 },

  liveLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: normalizeHeight(12),
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalizeWidth(6),
    backgroundColor: '#E8F5E9',
    paddingHorizontal: normalizeWidth(10),
    paddingVertical: normalizeHeight(4),
    borderRadius: normalizeWidth(12),
  },
  liveDot: {
    width: normalizeWidth(6),
    height: normalizeWidth(6),
    borderRadius: normalizeWidth(3),
    backgroundColor: '#4CAF50',
  },
  liveText: {
    color: '#4CAF50',
    fontSize: normalizeWidth(10),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: normalizeWidth(12),
  },
  locationTextCol: {
    flex: 1,
    gap: normalizeHeight(4),
  },
  locationSpacer: {
    height: normalizeHeight(12),
  },
  locationUpdateText: {
    color: TRIPS_COLORS.SUBTEXT,
    marginTop: normalizeHeight(12),
    textAlign: 'center',
  },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default TripDetailsScreen;

