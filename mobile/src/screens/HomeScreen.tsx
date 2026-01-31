/**
 * Home tab screen
 * Matches provided design (top cards + upcoming trips list)
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Text } from '../typography';
import { SwipeButton } from '../components/ui';
import {
  COLORS,
  TAB_BAR_SCENE_PADDING_BOTTOM,
  IMAGES,
  TAB_ROUTES,
  TRIP_STACK_ROUTES,
  HOME_COLORS,
  HOME_LAYOUT,
  HOME_MOCK,
  HOME_STRINGS,
  HOME_UPCOMING_TRIPS,
  type HomeUpcomingTrip,
} from '../constants';
import { getFontFamily } from '../constants/typography';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../utils/responsive';
import type { MainTabParamList } from '../navigation/MainTabNavigator';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(HOME_MOCK.status.isCheckedIn);

  const target = HOME_MOCK.target;
  const targetPercent = useMemo(() => {
    const p = target.total > 0 ? Math.round((target.current / target.total) * 100) : 0;
    return Math.max(0, Math.min(100, p));
  }, [target.current, target.total]);

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
                    <Text variant="body" weight="medium" style={styles.cardTitle}>
                      {HOME_STRINGS.STATUS} {isCheckedIn ? HOME_STRINGS.CHECKED_IN : HOME_STRINGS.NOT_CHECKED_IN}
                    </Text>
                    
                    {isCheckedIn ? (
                      <Text variant="caption" style={styles.checkInTime}>
                        {HOME_MOCK.status.checkedInAt}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      isCheckedIn ? styles.checkOutButton : styles.checkInButton,
                    ]}
                    onPress={() => setIsCheckedIn((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Text variant="body" weight="medium" style={styles.checkButtonText}>
                      {isCheckedIn ? HOME_STRINGS.CHECK_OUT : HOME_STRINGS.CHECK_IN}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </View>

        {/* Upcoming Trips and Get Help Section */}
        <View style={styles.bottomSection}>
          {/* Left: Upcoming Trips */}
          <View style={styles.upcomingTripsContainer}>
            <Text variant="body" weight="medium" style={styles.upcomingTripsLabel}>
              {HOME_STRINGS.UPCOMING_TRIPS}
            </Text>
            <View style={styles.badge}>
              <Text variant="caption" weight="bold" style={styles.badgeText}>
                {HOME_MOCK.upcomingCount}
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
          {HOME_UPCOMING_TRIPS.map((t) => (
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
            {HOME_STRINGS.VIEW_ALL_PREFIX} {HOME_MOCK.upcomingCount}
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

          <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} style={styles.callBtn}>
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
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.9} style={styles.watchBtn}>
              <MaterialCommunityIcons name="play-circle-outline" size={normalizeWidth(HOME_LAYOUT.WATCH_ICON_SIZE)} color={HOME_COLORS.WATCH_BTN_TEXT} />
              <Text variant="caption" weight="semiBold" style={styles.watchBtnText}>{HOME_STRINGS.WATCH_TUTORIAL}</Text>
            </TouchableOpacity>
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
    color: COLORS.white,
    fontSize: normalizeFont(9),
    opacity: 0.7,
    marginTop: normalizeHeight(2),
  },
  checkButton: {
    width: '100%',
    maxWidth: normalizeWidth(139),
    height: normalizeHeight(36),
    borderRadius: normalizeWidth(44),
    paddingTop: normalizeHeight(8),
    paddingRight: normalizeWidth(16),
    paddingBottom: normalizeHeight(8),
    paddingLeft: normalizeWidth(16),
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
    fontSize: normalizeFont(14),
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
  watchBtn: {
    height: normalizeHeight(HOME_LAYOUT.WATCH_BTN_HEIGHT),
    borderRadius: normalizeWidth(HOME_LAYOUT.WATCH_BTN_RADIUS),
    backgroundColor: HOME_COLORS.WATCH_BTN_BG,
    paddingHorizontal: normalizeWidth(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalizeWidth(8),
  },
  watchBtnText: { color: HOME_COLORS.WATCH_BTN_TEXT },

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
