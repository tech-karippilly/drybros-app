/**
 * Profile tab screen
 * User account and settings – header with banner + pattern, content below
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../typography';
import { useToast, useAuth } from '../contexts';
import {
  COLORS,
  TAB_BAR_SCENE_PADDING_BOTTOM,
  IMAGES,
  LAYOUT,
  HEADER_LABEL,
  PROFILE_CIRCLE,
  PROFILE_CARD,
  PROFILE_SCREEN_GRADIENT,
  PROFILE_STRINGS,
  PROFILE_MOCK_USER,
  PROFILE_MOCK_EARNINGS,
} from '../constants';
import { PROFILE_STACK_ROUTES } from '../constants/routes';
import type { ProfileStackParamList } from '../navigation/ProfileStackNavigator';
import { getFontFamily } from '../constants/typography';
import { normalizeWidth, normalizeHeight, normalizeFont, heightPercentage } from '../utils/responsive';

/** Get first two letters of name (e.g. "John Doe" -> "JD") */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type ProfileListItemProps = {
  label: string;
  onPress?: () => void;
  showDivider?: boolean;
};

function ProfileListItem({ label, onPress, showDivider = true }: ProfileListItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.listItem, showDivider && styles.listItemDivider]}
    >
      <Text variant="body" weight="medium" style={styles.listItemLabel}>
        {label}
      </Text>
      <MaterialCommunityIcons name="chevron-right" size={normalizeWidth(22)} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { logout } = useAuth();
  const headerHeight = heightPercentage(LAYOUT.PROFILE_HEADER_HEIGHT_PERCENT);
  const outerSize = normalizeWidth(PROFILE_CIRCLE.SIZE);
  const hasProfileImage = Boolean(PROFILE_MOCK_USER.imageUri);
  const initials = getInitials(PROFILE_MOCK_USER.name);
  const innerSize = outerSize - PROFILE_CIRCLE.BORDER_WIDTH * 2;
  const initialsFontSize = normalizeFont(PROFILE_CIRCLE.INITIALS_FONT_SIZE);

  const handleLogout = async () => {
    try {
      await logout();
      showToast({ message: PROFILE_STRINGS.LOGOUT_SUCCESS, type: 'success' });
    } catch {
      showToast({ message: PROFILE_STRINGS.LOGOUT_FAILED, type: 'error' });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Screen background gradient: 180deg #ECECEC → #DBDBDB */}
      <LinearGradient
        colors={[PROFILE_SCREEN_GRADIENT.TOP, PROFILE_SCREEN_GRADIENT.BOTTOM]}
        style={styles.screenGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
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

      {/* Profile circle: circular avatar (thin light border) */}
      <View style={[styles.profileCircleWrap, { marginTop: -outerSize / 2 }]}>
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
              source={{ uri: PROFILE_MOCK_USER.imageUri! }}
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
      </View>

      {/* White card below header – rounded corners, margin left/right/bottom */}
      <View
        style={[
          styles.profileCard,
          {
            borderTopLeftRadius: normalizeWidth(PROFILE_CARD.BORDER_RADIUS_TOP),
            borderTopRightRadius: normalizeWidth(PROFILE_CARD.BORDER_RADIUS_TOP),
            borderBottomLeftRadius: normalizeWidth(PROFILE_CARD.BORDER_RADIUS_BOTTOM),
            borderBottomRightRadius: normalizeWidth(PROFILE_CARD.BORDER_RADIUS_BOTTOM),
            marginLeft: normalizeWidth(PROFILE_CARD.MARGIN_LEFT),
            marginRight: normalizeWidth(PROFILE_CARD.MARGIN_RIGHT),
            marginBottom: normalizeHeight(PROFILE_CARD.MARGIN_BOTTOM),
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: normalizeHeight(32) + TAB_BAR_SCENE_PADDING_BOTTOM }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile info: name, phone */}
          <View style={styles.profileInfo}>
            <Text variant="h5" weight="bold" style={styles.profileName}>
              {PROFILE_MOCK_USER.name}
            </Text>
            <Text variant="caption" style={styles.profilePhone}>
              {PROFILE_MOCK_USER.phone}
            </Text>
          </View>

          {/* HR: 1px gradient line (transparent → #DDDDDD → transparent) */}
          <View style={styles.hrWrap}>
            <LinearGradient
              colors={[...PROFILE_CARD.HR_GRADIENT_COLORS]}
              locations={[...PROFILE_CARD.HR_GRADIENT_LOCATIONS]}
              style={styles.hrLine}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            />
          </View>

          {/* Earnings section */}
          <Text variant="body" weight="semiBold" style={styles.sectionTitle}>
            {PROFILE_STRINGS.EARNINGS}
          </Text>
          <View style={styles.earningsRow}>
            <View style={styles.earningsBox}>
              <Text variant="body" weight="bold" style={styles.earningsAmount}>
                {PROFILE_MOCK_EARNINGS.today}
              </Text>
              <Text variant="caption" style={styles.earningsLabel}>
                {PROFILE_STRINGS.TODAY_EARNINGS}
              </Text>
            </View>
            <View style={styles.earningsBox}>
              <Text variant="body" weight="bold" style={styles.earningsAmount}>
                {PROFILE_MOCK_EARNINGS.monthly}
              </Text>
              <Text variant="caption" style={styles.earningsLabel}>
                {PROFILE_STRINGS.MONTHLY_EARNINGS}
              </Text>
            </View>
          </View>
          <View style={styles.listSection}>
            <ProfileListItem
              label={PROFILE_STRINGS.EARNINGS_HISTORY_TITLE}
              onPress={() => navigation.navigate(PROFILE_STACK_ROUTES.EARNINGS)}
            />
            <ProfileListItem
              label={PROFILE_STRINGS.COMPLAINTS_HISTORY_TITLE}
              onPress={() => navigation.navigate(PROFILE_STACK_ROUTES.COMPLAINTS)}
              showDivider={false}
            />
          </View>

          {/* Logout */}
          <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={normalizeWidth(18)} color={COLORS.textSecondary} />
            <Text variant="caption" weight="medium" style={styles.logoutText}>
              {PROFILE_STRINGS.LOGOUT}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '900',
    fontStyle: 'normal',
    letterSpacing: 0,
    fontSize: normalizeFont(HEADER_LABEL.FONT_SIZE),
    lineHeight: normalizeFont(HEADER_LABEL.FONT_SIZE) * (HEADER_LABEL.LINE_HEIGHT_PERCENT / 100),
  },
  profileCircleWrap: {
    alignSelf: 'center',
    width: normalizeWidth(PROFILE_CIRCLE.SIZE),
    height: normalizeWidth(PROFILE_CIRCLE.SIZE),
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
    fontFamily: getFontFamily('satoshiVariable'),
    fontWeight: '900',
    color: COLORS.white,
  },
  profileCard: {
    flex: 1,
    backgroundColor: PROFILE_CARD.BACKGROUND,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: normalizeWidth(24),
  },
  profileInfo: {
    alignItems: 'center',
    paddingTop: normalizeHeight(8),
    paddingBottom: normalizeHeight(20),
  },
  profileName: {
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  profilePhone: {
    color: COLORS.textSecondary,
    marginTop: normalizeHeight(4),
    textAlign: 'center',
  },
  hrWrap: {
    width: '100%',
    height: 1,
    marginVertical: normalizeHeight(16),
  },
  hrLine: {
    width: '100%',
    height: 1,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    marginBottom: normalizeHeight(12),
  },
  earningsRow: {
    flexDirection: 'row',
    gap: normalizeWidth(12),
    marginBottom: normalizeHeight(16),
  },
  earningsBox: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: normalizeWidth(12),
    padding: normalizeWidth(16),
  },
  earningsAmount: {
    color: COLORS.textPrimary,
  },
  earningsLabel: {
    color: COLORS.textSecondary,
    marginTop: normalizeHeight(4),
  },
  listSection: {
    marginTop: normalizeHeight(12),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: normalizeHeight(14),
  },
  listItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  listItemLabel: {
    color: COLORS.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalizeWidth(8),
    backgroundColor: COLORS.gray200,
    borderRadius: normalizeWidth(12),
    paddingVertical: normalizeHeight(14),
    marginTop: normalizeHeight(24),
  },
  logoutText: {
    color: COLORS.textSecondary,
  },
});

export default ProfileScreen;
