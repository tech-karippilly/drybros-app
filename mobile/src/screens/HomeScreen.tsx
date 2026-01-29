/**
 * Home tab screen
 * Simple, clear layout for ease of use
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../typography';
import { COLORS, TAB_BAR_SCENE_PADDING_BOTTOM, IMAGES } from '../constants';
import { getFontFamily } from '../constants/typography';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../utils/responsive';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');


export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  const handleCheckIn = () => {
    const now = new Date();
    setIsCheckedIn(true);
    setCheckInTime(now);
    // TODO: Call API to check in
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckInTime(null);
    // TODO: Call API to check out
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: normalizeHeight(32) + TAB_BAR_SCENE_PADDING_BOTTOM }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver Logo in Center */}
        <View style={styles.iconContainer}>
          <Image
            source={IMAGES.driverLogo}
            style={styles.appIcon}
            resizeMode="contain"
          />
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
                    My target
                  </Text>
                  
                  {/* Progress Bar Header */}
                  <View style={styles.progressHeader}>
                    <Text variant="caption" style={styles.progressPercent}>
                      75%
                    </Text>
                    <Text variant="caption" style={styles.progressValue}>
                      75 / 100
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <LinearGradient
                      colors={['#5E66B7', '#8E97EA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBar, { width: '75%' }]}
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
                      Status: {isCheckedIn ? 'Check in' : 'Not check in'}
                    </Text>
                    
                    {isCheckedIn && checkInTime && (
                      <Text variant="caption" style={styles.checkInTime}>
                        {formatTime(checkInTime)}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      isCheckedIn ? styles.checkOutButton : styles.checkInButton,
                    ]}
                    onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
                    activeOpacity={0.8}
                  >
                    <Text variant="body" weight="medium" style={styles.checkButtonText}>
                      {isCheckedIn ? 'Check Out' : 'Check In'}
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
              Upcoming trips
            </Text>
            <View style={styles.badge}>
              <Text variant="caption" weight="bold" style={styles.badgeText}>
                3
              </Text>
            </View>
          </View>

          {/* Right: Get Help */}
          <TouchableOpacity style={styles.getHelpContainer} activeOpacity={0.7}>
            <Text variant="body" weight="medium" style={styles.getHelpLabel}>
              Get help
            </Text>
            <MaterialCommunityIcons
              name="headphones"
              size={normalizeWidth(20)}
              color={COLORS.white}
              style={styles.helpIcon}
            />
          </TouchableOpacity>
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
  backgroundHalfContainer: {
    position: 'absolute',
    width: '100%',
    height: SCREEN_HEIGHT * 0.5, // Half screen height
    top: 0,
    left: 0,
    backgroundColor: '#1A1B29',
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
    paddingHorizontal: normalizeWidth(24),
    paddingTop: normalizeHeight(20),
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalizeHeight(24),
  },
  appIcon: {
    width: normalizeWidth(80),
    height: normalizeWidth(80),
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: normalizeHeight(16),
    paddingHorizontal: normalizeWidth(2),
  },
  card: {
    flex: 1,
    maxWidth: normalizeWidth(171),
    height: normalizeHeight(105),
    borderRadius: normalizeWidth(15.6),
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
    borderRadius: normalizeWidth(15.6),
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
    height: normalizeHeight(11),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: normalizeWidth(5.5),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: normalizeWidth(5.5),
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
    backgroundColor: '#4FAF01',
  },
  checkOutButton: {
    backgroundColor: '#D14646',
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
    fontSize: normalizeFont(14),
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '700',
    marginRight: normalizeWidth(8),
  },
  badge: {
    backgroundColor: '#DE8509',
    borderRadius: normalizeWidth(12),
    paddingHorizontal: normalizeWidth(8),
    paddingVertical: normalizeHeight(4),
    minWidth: normalizeWidth(24),
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
});

export default HomeScreen;
