/**
 * Home tab screen
 * Matches provided design (top cards + upcoming trips list)
 *
 * Live data bindings:
 * - Attendance: /attendance (today) + /attendance/clock-in + /attendance/clock-out
 * - Target: /drivers/:id/daily-stats
 * - Upcoming trips: /trips/my-assigned
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Text } from '../typography';
import { IconCircle, Modal, SwipeButton } from '../components/ui';
import { openPhoneDialer } from '../utils/linking';
import { useToast, useTripRealtime } from '../contexts';
import {
  COLORS,
  TAB_BAR_SCENE_PADDING_BOTTOM,
  IMAGES,
  TAB_ROUTES,
  TRIP_STACK_ROUTES,
  HOME_COLORS,
  HOME_CHECKOUT_MODAL,
  HOME_LAYOUT,
  HOME_STRINGS,
  LOCATION_TRACKING,
  isBackendTripOngoing,
  type HomeUpcomingTrip,
} from '../constants';
import { getFontFamily } from '../constants/typography';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../utils/responsive';
import type { MainTabParamList } from '../navigation/MainTabNavigator';
import { formatTime } from '../utils/formatters';
import { clockInApi, clockOutApi, getAttendanceListApi, type AttendanceEntry } from '../services/api/attendance';
import { getDriverDailyStatsApi } from '../services/api/driverDailyStats';
import { getMyAssignedTripsApi } from '../services/api/trips';
import { mapBackendTripToHomeUpcomingTrip } from '../services/mappers/trips';
import { useLocation } from '../hooks/useLocation';
import { updateMyDriverLocationApi } from '../services/api/driverLocation';
import { haversineDistanceMeters } from '../utils/geo';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function getTodayRangeISO(): { startISO: string; endISO: string } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function getOpenAttendanceRecord(attendances: AttendanceEntry[]): AttendanceEntry | null {
  // "Open session" means clocked in but not clocked out (used by backend rules too).
  const open = attendances.find((a) => Boolean(a.clockIn) && !a.clockOut);
  return open ?? null;
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { showToast } = useToast();
  const { lastAssignedTripId } = useTripRealtime();
  const { getCurrentLocation, watchPosition } = useLocation();
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isOnTrip, setIsOnTrip] = useState(false);
  const locationSubscriptionRef = useRef<any>(null);
  const lastLocationSentRef = useRef<{
    sentAtMs: number;
    lat?: number;
    lng?: number;
  }>({ sentAtMs: 0 });
  const pendingLocationRef = useRef<any>(null);
  const sendTimerRef = useRef<any>(null);
  const shouldSendLocationRef = useRef<boolean>(false);

  const [target, setTarget] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [upcomingTrips, setUpcomingTrips] = useState<HomeUpcomingTrip[]>([]);
  const upcomingCount = upcomingTrips.length;

  const targetPercent = useMemo(() => {
    const p = target.total > 0 ? Math.round((target.current / target.total) * 100) : 0;
    return Math.max(0, Math.min(100, p));
  }, [target.current, target.total]);

  const loadHomeData = useCallback(async () => {
    try {
      // Target card
      const daily = await getDriverDailyStatsApi();
      setTarget({
        current: Number.isFinite(daily.amountRunToday) ? daily.amountRunToday : 0,
        total: Number.isFinite(daily.dailyTargetAmount) ? daily.dailyTargetAmount : 0,
      });

      // Attendance card (derive from today's attendance record)
      const { startISO, endISO } = getTodayRangeISO();
      const todayAttendances = await getAttendanceListApi({ startDate: startISO, endDate: endISO });
      const openAttendance = getOpenAttendanceRecord(todayAttendances);
      setIsCheckedIn(Boolean(openAttendance));
      if (openAttendance?.clockIn) {
        const d = new Date(openAttendance.clockIn);
        setCheckedInAt(Number.isNaN(d.getTime()) ? null : formatTime(d));
      } else {
        setCheckedInAt(null);
      }

      // Upcoming trips
      const assigned = await getMyAssignedTripsApi();
      setIsOnTrip(assigned.some((t) => isBackendTripOngoing(t.status)));
      const mapped = assigned.map(mapBackendTripToHomeUpcomingTrip);
      setUpcomingTrips(mapped);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load dashboard data';
      showToast({ message: errorMessage, type: 'error', position: 'top' });
    }
  }, [showToast]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  useEffect(() => {
    if (lastAssignedTripId) {
      loadHomeData();
    }
  }, [lastAssignedTripId, loadHomeData]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  useEffect(() => {
    shouldSendLocationRef.current = Boolean(isCheckedIn) && !Boolean(isOnTrip);
    if (!shouldSendLocationRef.current) {
      // Clear any pending send while on-trip/off-duty
      pendingLocationRef.current = null;
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current);
        sendTimerRef.current = null;
      }
    }
  }, [isCheckedIn, isOnTrip]);

  const sendLocationNow = useCallback(
    async (location: any) => {
      const coords = location?.coords;
      if (!coords) return;

      const lat = coords.latitude;
      const lng = coords.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const nowMs = Date.now();
      const last = lastLocationSentRef.current;
      const hasPrev = typeof last.lat === 'number' && typeof last.lng === 'number';
      if (hasPrev) {
        const movedM = haversineDistanceMeters(
          { lat: last.lat as number, lng: last.lng as number },
          { lat, lng }
        );
        if (movedM < LOCATION_TRACKING.MIN_DISTANCE_M) return;
      }

      lastLocationSentRef.current = { sentAtMs: nowMs, lat, lng };

      await updateMyDriverLocationApi({
        lat,
        lng,
        accuracyM: typeof coords.accuracy === 'number' ? coords.accuracy : undefined,
        capturedAt: typeof location?.timestamp === 'number' ? new Date(location.timestamp).toISOString() : undefined,
      });
    },
    [LOCATION_TRACKING.MIN_DISTANCE_M]
  );

  const scheduleDebouncedLocationSend = useCallback(
    (location: any) => {
      if (!shouldSendLocationRef.current) return;
      pendingLocationRef.current = location;

      if (sendTimerRef.current) return;

      const nowMs = Date.now();
      const elapsed = nowMs - lastLocationSentRef.current.sentAtMs;
      const delay = Math.max(0, LOCATION_TRACKING.SEND_INTERVAL_MS - elapsed);

      sendTimerRef.current = setTimeout(() => {
        sendTimerRef.current = null;
        const latest = pendingLocationRef.current;
        pendingLocationRef.current = null;
        if (!latest) return;
        if (!shouldSendLocationRef.current) return;
        sendLocationNow(latest).catch(() => {});
      }, delay);
    },
    [sendLocationNow]
  );

  const startLocationTracking = useCallback(async () => {
    if (locationSubscriptionRef.current) return;

    const initial = await getCurrentLocation();
    if (initial) {
      scheduleDebouncedLocationSend(initial);
    }

    try {
      const sub = await watchPosition((loc) => {
        scheduleDebouncedLocationSend(loc);
      });
      locationSubscriptionRef.current = sub;
    } catch {
      // Ignore; permission dialog or device errors handled in hook.
    }
  }, [getCurrentLocation, scheduleDebouncedLocationSend, watchPosition]);

  const stopLocationTracking = useCallback(() => {
    const sub = locationSubscriptionRef.current;
    if (sub?.remove) sub.remove();
    locationSubscriptionRef.current = null;
    pendingLocationRef.current = null;
    if (sendTimerRef.current) {
      clearTimeout(sendTimerRef.current);
      sendTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isCheckedIn) {
      startLocationTracking().catch(() => {});
    } else {
      stopLocationTracking();
    }
    return () => stopLocationTracking();
  }, [isCheckedIn, startLocationTracking, stopLocationTracking]);

  const openCheckoutModal = useCallback(() => {
    setCheckoutModalVisible(true);
  }, []);

  const closeCheckoutModal = useCallback(() => {
    if (checkoutLoading) return;
    setCheckoutModalVisible(false);
  }, [checkoutLoading]);

  const handleCheckButtonPress = useCallback(async () => {
    if (isCheckedIn) {
      openCheckoutModal();
      return;
    }
    if (checkInLoading) return;

    setCheckInLoading(true);
    try {
      const res = await clockInApi();
      setIsCheckedIn(true);
      if (res?.data?.clockIn) {
        const d = new Date(res.data.clockIn);
        setCheckedInAt(Number.isNaN(d.getTime()) ? null : formatTime(d));
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        HOME_STRINGS.CLOCK_IN_FAILED;
      showToast({ message: errorMessage, type: 'error', position: 'top' });
    } finally {
      setCheckInLoading(false);
    }
  }, [checkInLoading, isCheckedIn, openCheckoutModal, showToast]);

  const handleSwipeCheckout = useCallback(async () => {
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      await clockOutApi();
      setIsCheckedIn(false);
      setCheckedInAt(null);
      setCheckoutModalVisible(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        HOME_STRINGS.CLOCK_OUT_FAILED;
      showToast({ message: errorMessage, type: 'error', position: 'top' });
    } finally {
      setCheckoutLoading(false);
    }
  }, [checkoutLoading, showToast]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Half Background - Same as Login Screen */}
      <View style={styles.backgroundHalfContainer}>
        <Image
          source={IMAGES.bannerBg}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Gradient Overlay 1 */}
        <LinearGradient
          colors={['rgba(26, 27, 41, 0)', '#1A1B29']}
          locations={[0, 0.2144]}
          style={styles.gradientOverlay1}
        />
        {/* Gradient Overlay 2 */}
        <LinearGradient
          colors={['rgba(42, 51, 179, 0)', 'rgba(42, 51, 179, 0.4)']}
          locations={[0.5519, 0.9766]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.gradientOverlay2}
        />
        {/* Pattern Overlay */}
        <View style={styles.patternOverlay}>
          <Image
            source={IMAGES.pattern}
            style={styles.patternImage}
            resizeMode="cover"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: normalizeHeight(HOME_LAYOUT.CONTENT_BOTTOM_PADDING) + TAB_BAR_SCENE_PADDING_BOTTOM },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandWrap} pointerEvents="none">
          <Text style={styles.brandText}>
            <Text style={{ color: COLORS.tomatoRed }}>{HOME_STRINGS.BRAND_DRY}</Text>
            <Text style={{ color: COLORS.headerLabelBros }}>{HOME_STRINGS.BRAND_BROS}</Text>
          </Text>
        </View>

        {/* Two Cards in Row */}
        <View style={styles.cardsRow}>
          {/* First Card - My Target */}
          <View style={[styles.card, styles.cardFirst]}>
            <BlurView intensity={18.72} tint="dark" style={styles.cardBlur}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.046)', 'rgba(255, 255, 255, 0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardContent}>
                  <Text variant="body" weight="medium" style={styles.cardTitle}>
                    {HOME_STRINGS.MY_TARGET}
                  </Text>
                  
                  {/* Progress Bar Header */}
                  <View style={styles.progressHeader}>
                    <Text variant="caption" style={styles.progressPercent}>
                      {targetPercent}%
                    </Text>
                    <Text variant="caption" style={styles.progressValue}>
                      ₹{target.current} / ₹{target.total}
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <LinearGradient
                      colors={[...HOME_COLORS.PROGRESS_GRADIENT]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBar, { width: `${targetPercent}%` }]}
                    />
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </View>

          {/* Second Card - Check In/Out */}
          <View style={[styles.card, styles.cardSecond]}>
            <BlurView intensity={18.72} tint="dark" style={styles.cardBlur}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.046)', 'rgba(255, 255, 255, 0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardContent}>
                  <View style={styles.checkInHeader}>
                    <Text variant="body" style={styles.statusLine} numberOfLines={1}>
                      <Text variant="body" style={styles.statusLabel}>
                        {HOME_STRINGS.STATUS}{' '}
                      </Text>
                      <Text variant="body" style={styles.statusValue}>
                        {isCheckedIn ? HOME_STRINGS.CHECKED_IN : HOME_STRINGS.NOT_CHECKED_IN}
                      </Text>
                    </Text>
                    
                    {isCheckedIn ? (
                      <Text variant="h6" weight="medium" style={styles.checkInTime}>
                        {checkedInAt ?? ''}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      isCheckedIn ? styles.checkOutButton : styles.checkInButton,
                    ]}
                    onPress={handleCheckButtonPress}
                    activeOpacity={0.8}
                  >
                    <Text variant="h5" weight="bold" style={styles.checkButtonText}>
                      {isCheckedIn ? HOME_STRINGS.CHECK_OUT : HOME_STRINGS.CHECK_IN}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </View>

        {/* Checkout confirmation modal */}
        <Modal visible={checkoutModalVisible} onClose={closeCheckoutModal} showCloseButton={false}>
          <View style={styles.checkoutModalContent}>
            <IconCircle
              icon="alert"
              size={HOME_CHECKOUT_MODAL.ICON_SIZE}
              innerColor={HOME_COLORS.CHECKOUT_MODAL_ICON_INNER_BG}
              iconColor={HOME_COLORS.CHECKOUT_MODAL_ICON_COLOR}
              blurTint="light"
              style={styles.checkoutModalIcon}
            />

            <Text variant="h3" weight="semiBold" style={styles.checkoutTitle}>
              {HOME_STRINGS.CHECKOUT_TITLE}
            </Text>
            <Text variant="body" style={styles.checkoutSubtitle}>
              {HOME_STRINGS.CHECKOUT_SUBTITLE}
            </Text>

            <SwipeButton
              label={HOME_STRINGS.SWIPE_TO_CHECKOUT}
              onSwipeComplete={handleSwipeCheckout}
              height={normalizeHeight(HOME_CHECKOUT_MODAL.SWIPE_HEIGHT)}
              trackColor={HOME_COLORS.CHECKOUT_MODAL_SWIPE_TRACK}
              thumbColor={HOME_COLORS.CHECKOUT_MODAL_SWIPE_THUMB}
              thumbIconColor={COLORS.white}
              gradientColors={HOME_COLORS.CHECKOUT_MODAL_LABEL_GRADIENT}
              disabled={checkoutLoading}
              style={styles.checkoutSwipe}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={closeCheckoutModal}
              disabled={checkoutLoading}
              style={[styles.checkoutCancelBtn, checkoutLoading && styles.checkoutCancelBtnDisabled]}
            >
              <Text variant="h5" weight="semiBold" style={styles.checkoutCancelText}>
                {HOME_STRINGS.CANCEL}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Upcoming Trips and Get Help Section */}
        <View style={styles.bottomSection}>
          {/* Left: Upcoming Trips */}
          <View style={styles.upcomingTripsContainer}>
            <Text variant="body" weight="medium" style={styles.upcomingTripsLabel}>
              {HOME_STRINGS.UPCOMING_TRIPS}
            </Text>
            <View style={styles.badge}>
              <Text variant="caption" weight="bold" style={styles.badgeText}>
                {upcomingCount}
              </Text>
            </View>
          </View>

          {/* Right: Get Help */}
          <TouchableOpacity style={styles.getHelpContainer} activeOpacity={0.7}>
            <Text variant="body" weight="medium" style={styles.getHelpLabel}>
              {HOME_STRINGS.GET_HELP}
            </Text>
            <MaterialCommunityIcons
              name="headphones"
              size={normalizeWidth(20)}
              color={COLORS.white}
              style={styles.helpIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Upcoming trip cards */}
        <View style={styles.upcomingList}>
          {upcomingTrips.map((t) => (
            <UpcomingTripCard
              key={t.id}
              item={t}
              onTripDetails={() =>
                navigation.navigate(TAB_ROUTES.TRIP, {
                  screen: TRIP_STACK_ROUTES.TRIP_DETAILS,
                  params: { trip: t.trip },
                })
              }
            />
          ))}
        </View>

        {/* View all */}
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.9}
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate(TAB_ROUTES.TRIP)}
        >
          <Text variant="body" weight="semiBold" style={styles.viewAllText}>
            {HOME_STRINGS.VIEW_ALL_PREFIX} {upcomingCount}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={normalizeWidth(HOME_LAYOUT.VIEW_ALL_ARROW_SIZE)} color={HOME_COLORS.VIEW_ALL_TEXT} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function UpcomingTripCard({
  item,
  onTripDetails,
}: {
  item: HomeUpcomingTrip;
  onTripDetails: () => void;
}) {
  return (
    <View style={styles.tripCardOuter}>
      <View style={styles.tripCard}>
        <View style={styles.tripTopRow}>
          <View style={styles.tripTopLeft}>
            <Text variant="caption" style={styles.tripSubText}>{item.tripNumberLabel}</Text>
            <Text variant="h5" weight="semiBold" style={styles.tripName}>{item.customerName}</Text>

            <View style={styles.statusRow}>
              <View style={styles.statusPill}>
                <Text variant="caption" weight="semiBold" style={styles.statusPillText}>
                  {item.statusLabel}
                </Text>
              </View>
              <Text variant="caption" style={styles.tripSubText}>
                {item.etaLabel}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            style={styles.callBtn}
            onPress={() => openPhoneDialer(item.trip.customerPhone)}
          >
            <MaterialCommunityIcons name="phone-outline" size={normalizeWidth(HOME_LAYOUT.CALL_ICON_SIZE)} color={HOME_COLORS.CARD_TEXT} />
          </TouchableOpacity>
        </View>

        <View style={styles.routeBlock}>
          <View style={styles.routeDotsCol}>
            <View style={[styles.routeDot, { backgroundColor: HOME_COLORS.PICKUP_DOT }]} />
            <View style={styles.routeLine} />
            <View style={[styles.routeDot, { backgroundColor: HOME_COLORS.DROP_DOT }]} />
          </View>
          <View style={styles.routeTextCol}>
            <View style={styles.routeRow}>
              <Text variant="caption" style={styles.tripSubText}>{HOME_STRINGS.FROM}</Text>
              <Text variant="body" weight="semiBold" style={styles.routeValue}>{item.fromLabel}</Text>
            </View>
            <View style={styles.routeRow}>
              <Text variant="caption" style={styles.tripSubText}>{HOME_STRINGS.TO}</Text>
              <Text variant="body" weight="semiBold" style={styles.routeValue}>{item.toLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tripDivider} />

        <View style={styles.vehicleRow}>
          <View style={styles.vehicleLeft}>
            <Text variant="caption" style={styles.tripSubText}>{item.vehicleMake}</Text>
            <Text variant="body" weight="semiBold" style={styles.vehicleTitle}>{item.vehicleLabel}</Text>

            <View style={styles.transmissionRow}>
              <MaterialCommunityIcons name="cog-outline" size={normalizeWidth(18)} color={COLORS.gray700} />
              <View>
                <Text variant="caption" style={styles.tripSubText}>{HOME_STRINGS.TRANSMISSION_TYPE}</Text>
                <Text variant="body" weight="semiBold" style={styles.vehicleTitle}>{item.transmission}</Text>
              </View>
            </View>
          </View>

          <View style={styles.vehicleRight}>
            <Image
              source={IMAGES.icon}
              resizeMode="contain"
              style={styles.carImage}
            />
          </View>
        </View>

        <View style={styles.tripDivider} />

        <View style={styles.actionRow}>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.9} style={styles.actionBtn}>
            <MaterialCommunityIcons name="navigation-variant-outline" size={normalizeWidth(HOME_LAYOUT.ACTION_ICON_SIZE)} color={HOME_COLORS.ACTION_BTN_TEXT} />
            <Text variant="body" weight="semiBold" style={styles.actionText}>{HOME_STRINGS.NAVIGATE}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.9} style={styles.actionBtn} onPress={onTripDetails}>
            <MaterialCommunityIcons name="information-outline" size={normalizeWidth(HOME_LAYOUT.ACTION_ICON_SIZE)} color={HOME_COLORS.ACTION_BTN_TEXT} />
            <Text variant="body" weight="semiBold" style={styles.actionText}>{HOME_STRINGS.TRIP_DETAILS}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.swipeWrap}>
          {/* Reuse existing SwipeButton UI */}
          <SwipeButton
            label={HOME_STRINGS.SWIPE_START_TRIP}
            onSwipeComplete={() => {}}
            height={normalizeHeight(HOME_LAYOUT.SWIPE_HEIGHT)}
            trackColor={HOME_COLORS.SWIPE_TRACK_BG}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HOME_LAYOUT.SCREEN_BG,
  },
  backgroundHalfContainer: {
    position: 'absolute',
    width: '100%',
    height: SCREEN_HEIGHT * (HOME_LAYOUT.TOP_BG_HEIGHT_PERCENT / 100),
    top: 0,
    left: 0,
    backgroundColor: HOME_COLORS.TOP_BG,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  gradientOverlay2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  patternOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    opacity: 0.6,
  },
  patternImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: normalizeWidth(HOME_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingTop: normalizeHeight(HOME_LAYOUT.CONTENT_TOP_PADDING),
  },
  brandWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: normalizeHeight(HOME_LAYOUT.BRAND_TOP_PADDING),
    paddingBottom: normalizeHeight(18),
  },
  brandText: {
    fontFamily: getFontFamily('satoshiVariable'),
    fontSize: normalizeFont(HOME_LAYOUT.BRAND_FONT_SIZE),
    fontWeight: '800',
    letterSpacing: 0,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalizeHeight(16),
    paddingHorizontal: normalizeWidth(2),
  },
  card: {
    flex: 1,
    maxWidth: normalizeWidth(172),
    height: normalizeHeight(HOME_LAYOUT.TOP_CARD_HEIGHT),
    borderRadius: normalizeWidth(HOME_LAYOUT.TOP_CARD_RADIUS),
    overflow: 'hidden',
  },
  cardFirst: {
    marginRight: normalizeWidth(6),
  },
  cardSecond: {
    marginLeft: normalizeWidth(6),
  },
  cardBlur: {
    flex: 1,
    borderRadius: normalizeWidth(HOME_LAYOUT.TOP_CARD_RADIUS),
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: normalizeWidth(16),
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: COLORS.white,
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '700',
    fontSize: normalizeFont(14),
    lineHeight: normalizeFont(14) * 1.26, // 126% line height
    letterSpacing: 0,
    marginBottom: normalizeHeight(4),
  },
  checkInHeader: {
    marginBottom: normalizeHeight(4),
  },
  statusLine: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  statusLabel: {
    color: HOME_COLORS.CARD_TEXT_MUTED,
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '500',
    fontSize: normalizeFont(14),
    lineHeight: normalizeFont(14) * 1.26,
  },
  statusValue: {
    color: COLORS.white,
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '700',
    fontSize: normalizeFont(14),
    lineHeight: normalizeFont(14) * 1.26,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalizeHeight(8),
  },
  progressPercent: {
    color: COLORS.white,
    fontSize: normalizeFont(12),
  },
  progressValue: {
    color: COLORS.white,
    fontSize: normalizeFont(12),
  },
  progressBarContainer: {
    width: normalizeWidth(139),
    height: normalizeHeight(HOME_LAYOUT.TARGET_PROGRESS_HEIGHT),
    backgroundColor: HOME_COLORS.PROGRESS_TRACK,
    borderRadius: normalizeWidth(HOME_LAYOUT.TARGET_PROGRESS_RADIUS),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: normalizeWidth(HOME_LAYOUT.TARGET_PROGRESS_RADIUS),
  },
  checkInTime: {
    color: HOME_COLORS.CARD_TEXT_MUTED,
    fontSize: normalizeFont(18),
    marginTop: normalizeHeight(2),
  },
  checkButton: {
    width: '100%',
    maxWidth: normalizeWidth(139),
    height: normalizeHeight(44),
    borderRadius: normalizeWidth(44),
    paddingHorizontal: normalizeWidth(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalizeHeight(4),
  },
  checkInButton: {
    backgroundColor: HOME_COLORS.CHECK_IN_BG,
  },
  checkOutButton: {
    backgroundColor: HOME_COLORS.CHECK_OUT_BG,
  },
  checkButtonText: {
    color: COLORS.white,
    fontSize: normalizeFont(20),
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '700',
  },

  checkoutModalContent: {
    backgroundColor: HOME_COLORS.CHECKOUT_MODAL_BG,
    borderRadius: normalizeWidth(HOME_CHECKOUT_MODAL.RADIUS),
    paddingHorizontal: normalizeWidth(HOME_CHECKOUT_MODAL.PADDING_H),
    paddingVertical: normalizeHeight(HOME_CHECKOUT_MODAL.PADDING_V),
    alignItems: 'center',
  },
  checkoutModalIcon: {
    marginBottom: normalizeHeight(HOME_CHECKOUT_MODAL.ICON_MARGIN_BOTTOM),
  },
  checkoutTitle: {
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  checkoutSubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: normalizeHeight(10),
  },
  checkoutSwipe: {
    marginTop: normalizeHeight(HOME_CHECKOUT_MODAL.SWIPE_MARGIN_TOP),
    width: '100%',
  },
  checkoutCancelBtn: {
    marginTop: normalizeHeight(HOME_CHECKOUT_MODAL.CANCEL_MARGIN_TOP),
    width: '100%',
    height: normalizeHeight(HOME_CHECKOUT_MODAL.CANCEL_HEIGHT),
    borderRadius: normalizeWidth(HOME_CHECKOUT_MODAL.CANCEL_RADIUS),
    backgroundColor: HOME_COLORS.CHECKOUT_MODAL_CANCEL_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutCancelBtnDisabled: {
    opacity: 0.6,
  },
  checkoutCancelText: {
    color: HOME_COLORS.CHECKOUT_MODAL_CANCEL_TEXT,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: normalizeHeight(24),
    paddingHorizontal: normalizeWidth(4),
  },
  upcomingTripsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingTripsLabel: {
    color: COLORS.white,
    fontSize: normalizeFont(HOME_LAYOUT.UPCOMING_TITLE_FONT_SIZE),
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '700',
    marginRight: normalizeWidth(8),
  },
  badge: {
    backgroundColor: HOME_COLORS.TOP_BADGE_BG,
    borderRadius: normalizeWidth(HOME_LAYOUT.BADGE_RADIUS),
    paddingHorizontal: normalizeWidth(8),
    paddingVertical: normalizeHeight(4),
    minWidth: normalizeWidth(HOME_LAYOUT.BADGE_SIZE),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: normalizeFont(12),
    fontWeight: '700',
  },
  getHelpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  getHelpLabel: {
    color: COLORS.white,
    fontSize: normalizeFont(14),
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '700',
    marginRight: normalizeWidth(8),
  },
  helpIcon: {
    // Icon spacing handled by marginRight on label
  },

  upcomingList: {
    marginTop: normalizeHeight(16),
    gap: normalizeHeight(HOME_LAYOUT.TRIP_CARD_GAP),
  },

  tripCardOuter: {
    borderRadius: normalizeWidth(HOME_LAYOUT.TRIP_CARD_RADIUS),
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
    }),
    ...(Platform.OS === 'android' && { elevation: 2 }),
  },
  tripCard: {
    backgroundColor: HOME_COLORS.TRIP_CARD_BG,
    borderRadius: normalizeWidth(HOME_LAYOUT.TRIP_CARD_RADIUS),
    padding: normalizeWidth(HOME_LAYOUT.TRIP_CARD_PADDING),
  },
  tripTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: normalizeWidth(12) },
  tripTopLeft: { flex: 1 },
  tripSubText: { color: HOME_COLORS.TRIP_SUBTEXT },
  tripName: { color: COLORS.textPrimary, marginTop: normalizeHeight(6) },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: normalizeWidth(10), marginTop: normalizeHeight(10) },
  statusPill: {
    height: normalizeHeight(HOME_LAYOUT.STATUS_PILL_HEIGHT),
    borderRadius: normalizeWidth(HOME_LAYOUT.STATUS_PILL_RADIUS),
    paddingHorizontal: normalizeWidth(HOME_LAYOUT.STATUS_PILL_PADDING_H),
    backgroundColor: HOME_COLORS.STATUS_UPCOMING_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPillText: { color: HOME_COLORS.STATUS_UPCOMING_TEXT, letterSpacing: 0.5 },
  callBtn: {
    width: normalizeWidth(HOME_LAYOUT.CALL_BTN_SIZE),
    height: normalizeWidth(HOME_LAYOUT.CALL_BTN_SIZE),
    borderRadius: normalizeWidth(HOME_LAYOUT.CALL_BTN_RADIUS),
    backgroundColor: HOME_COLORS.TOP_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  routeBlock: { flexDirection: 'row', gap: normalizeWidth(12), marginTop: normalizeHeight(16) },
  routeDotsCol: { width: normalizeWidth(16), alignItems: 'center' },
  routeDot: { width: normalizeWidth(HOME_LAYOUT.ROUTE_DOT_SIZE), height: normalizeWidth(HOME_LAYOUT.ROUTE_DOT_SIZE), borderRadius: normalizeWidth(HOME_LAYOUT.ROUTE_DOT_SIZE / 2) },
  routeLine: { width: normalizeWidth(HOME_LAYOUT.ROUTE_LINE_WIDTH), height: normalizeHeight(HOME_LAYOUT.ROUTE_LINE_HEIGHT), backgroundColor: HOME_COLORS.DIVIDER, marginVertical: normalizeHeight(6) },
  routeTextCol: { flex: 1, gap: normalizeHeight(14) },
  routeRow: { gap: normalizeHeight(4) },
  routeValue: { color: COLORS.textPrimary },

  tripDivider: { height: StyleSheet.hairlineWidth, backgroundColor: HOME_COLORS.DIVIDER, marginVertical: normalizeHeight(16) },

  vehicleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: normalizeWidth(12) },
  vehicleLeft: { flex: 1, gap: normalizeHeight(8) },
  vehicleTitle: { color: COLORS.textPrimary },
  transmissionRow: { flexDirection: 'row', alignItems: 'center', gap: normalizeWidth(10), marginTop: normalizeHeight(6) },
  vehicleRight: { alignItems: 'flex-end', gap: normalizeHeight(10) },
  carImage: { width: normalizeWidth(HOME_LAYOUT.CAR_IMAGE_W), height: normalizeHeight(HOME_LAYOUT.CAR_IMAGE_H), opacity: 0.8 },

  actionRow: { flexDirection: 'row', gap: normalizeWidth(14) },
  actionBtn: {
    flex: 1,
    height: normalizeHeight(HOME_LAYOUT.ACTION_BTN_HEIGHT),
    borderRadius: normalizeWidth(HOME_LAYOUT.ACTION_BTN_RADIUS),
    backgroundColor: HOME_COLORS.ACTION_BTN_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalizeWidth(10),
  },
  actionText: { color: HOME_COLORS.ACTION_BTN_TEXT },

  swipeWrap: { marginTop: normalizeHeight(14) },

  viewAllBtn: {
    marginTop: normalizeHeight(16),
    height: normalizeHeight(HOME_LAYOUT.VIEW_ALL_HEIGHT),
    borderRadius: normalizeWidth(HOME_LAYOUT.VIEW_ALL_RADIUS),
    backgroundColor: HOME_COLORS.VIEW_ALL_BG,
    paddingHorizontal: normalizeWidth(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllText: { color: HOME_COLORS.VIEW_ALL_TEXT },
});

export default HomeScreen;
