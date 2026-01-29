/**
 * Profile tab screen
 * User account and settings – header with banner + pattern, content below
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../typography';
import { Badge } from '../components/ui';
import { COLORS, TAB_BAR_SCENE_PADDING_BOTTOM, IMAGES, LAYOUT, HEADER_LABEL, PROFILE_CIRCLE } from '../constants';
import { FONT_FAMILY } from '../constants/typography';
import { normalizeWidth, normalizeHeight, normalizeFont, heightPercentage } from '../utils/responsive';

/** Placeholder: replace with real user/driver status from API or store */
const PROFILE_STATUS = {
  label: 'Active',
  variant: 'success' as const,
};

/** Placeholder: replace with real user name and profile image from API or store */
const PROFILE_USER = {
  name: 'John Doe',
  imageUri: null as string | null,
};

/** Get first two letters of name (e.g. "John Doe" -> "JD") */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = heightPercentage(LAYOUT.PROFILE_HEADER_HEIGHT_PERCENT);
  const outerSize = normalizeWidth(PROFILE_CIRCLE.SIZE);
  const bottomSize = normalizeWidth(PROFILE_CIRCLE.BOTTOM_CIRCLE_SIZE);
  const bottomCircleRight = 0;
  const bottomCircleBottom = -bottomSize / 2;
  const hasProfileImage = Boolean(PROFILE_USER.imageUri);
  const initials = getInitials(PROFILE_USER.name);
  const innerSize = outerSize - PROFILE_CIRCLE.BORDER_WIDTH * 2;
  const initialsFontSize = normalizeFont(PROFILE_CIRCLE.INITIALS_FONT_SIZE);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header view – 20% height, banner-bg + pattern + gradient + DRYBROS label */}
      <View style={[styles.headerView, { height: headerHeight }]}>
        <Image
          source={IMAGES.bannerBg}
          style={styles.headerBackgroundImage}
          resizeMode="cover"
        />
        <View style={styles.patternOverlay}>
          <Image
            source={IMAGES.pattern}
            style={styles.patternImage}
            resizeMode="cover"
          />
        </View>
        {/* Gradient overlay: 0deg = bottom transparent → top dark */}
        <LinearGradient
          colors={['rgba(26, 27, 41, 0)', 'rgba(26, 27, 41, 0.8)']}
          locations={[0, 1]}
          style={styles.gradientOverlay}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
        {/* Centered DRYBROS label (one word): DRY = tomato red, BROS = white */}
        <View style={styles.headerLabelWrap} pointerEvents="none">
          <Text style={[styles.headerLabelPart, { color: COLORS.headerLabelBros, textAlign: 'center' }]}>
            <Text style={{ color: COLORS.tomatoRed }}>DRY</Text>BROS
          </Text>
        </View>
      </View>

      {/* Profile circle: outer circle (border 2) + profile image or initials, camera circle bottom right (zIndex) */}
      <View style={[styles.profileCircleWrap, { marginTop: -outerSize / 2 - bottomSize / 2 }]}>
        <View
          style={[
            styles.profileCircleOuter,
            {
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
              borderWidth: PROFILE_CIRCLE.BORDER_WIDTH,
              borderColor: PROFILE_CIRCLE.BORDER_COLOR,
            },
          ]}
        >
          {hasProfileImage ? (
            <Image
              source={{ uri: PROFILE_USER.imageUri! }}
              style={[
                styles.profileCircleImage,
                { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
              ]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.profileCircleInitials, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
              <Text style={[styles.profileCircleInitialsText, { fontSize: initialsFontSize }]}>{initials}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {}}
          style={[
            styles.profileCircleBottom,
            {
              width: bottomSize,
              height: bottomSize,
              borderRadius: bottomSize / 2,
              backgroundColor: PROFILE_CIRCLE.BOTTOM_CIRCLE_BACKGROUND,
              right: bottomCircleRight,
              bottom: bottomCircleBottom,
              ...(Platform.OS === 'android' && { elevation: 4 }),
            },
          ]}
        >
          <MaterialCommunityIcons
            name="camera"
            size={normalizeWidth(18)}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: normalizeHeight(32) + TAB_BAR_SCENE_PADDING_BOTTOM }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <MaterialCommunityIcons
            name="account"
            size={normalizeWidth(40)}
            color={COLORS.primary}
          />
          <Text variant="h3" weight="bold" style={styles.title}>
            Profile
          </Text>
          <Text variant="body" style={styles.subtitle}>
            Your account and settings.
          </Text>
          <View style={styles.statusRow}>
            <Text variant="caption" style={styles.statusLabel}>
              Status
            </Text>
            <Badge
              label={PROFILE_STATUS.label}
              variant={PROFILE_STATUS.variant}
              style={styles.statusBadge}
            />
          </View>
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
  headerView: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#1A1B29',
  },
  headerBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  headerLabelWrap: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabelPart: {
    fontFamily: FONT_FAMILY.satoshiVariable,
    fontWeight: '900',
    fontStyle: 'normal',
    letterSpacing: 0,
    fontSize: normalizeFont(HEADER_LABEL.FONT_SIZE),
    lineHeight: normalizeFont(HEADER_LABEL.FONT_SIZE) * (HEADER_LABEL.LINE_HEIGHT_PERCENT / 100),
  },
  profileCircleWrap: {
    alignSelf: 'center',
    width: normalizeWidth(PROFILE_CIRCLE.SIZE),
    height: normalizeWidth(PROFILE_CIRCLE.SIZE) + normalizeWidth(PROFILE_CIRCLE.BOTTOM_CIRCLE_SIZE) / 2,
  },
  profileCircleOuter: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  profileCircleImage: {
    overflow: 'hidden',
  },
  profileCircleInitials: {
    backgroundColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCircleInitialsText: {
    fontFamily: FONT_FAMILY.satoshiVariable,
    fontWeight: '900',
    color: COLORS.white,
  },
  profileCircleBottom: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    padding: normalizeWidth(24),
  },
  content: {
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalizeHeight(16),
    gap: normalizeWidth(8),
  },
  statusLabel: {
    color: COLORS.textSecondary,
  },
  statusBadge: {
    width: undefined,
    height: normalizeHeight(28),
  },
});

export default ProfileScreen;
