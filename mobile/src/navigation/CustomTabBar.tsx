import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from '../typography';
import { TAB_BAR, TAB_LABELS, TAB_ICONS } from '../constants/tabBar';
import { TAB_ROUTES, type TabRouteKey } from '../constants/routes';
import { COLORS } from '../constants/colors';
import {
  normalizeWidth,
  normalizeHeight,
  normalizeFont,
  widthPercentage,
} from '../utils/responsive';

const ROUTE_TO_KEY: Record<string, TabRouteKey> = {
  [TAB_ROUTES.HOME]: 'HOME',
  [TAB_ROUTES.TRIP]: 'TRIP',
  [TAB_ROUTES.LEAVE]: 'LEAVE',
  [TAB_ROUTES.ALERTS]: 'ALERTS',
  [TAB_ROUTES.PROFILE]: 'PROFILE',
};

function AnimatedTabItem({
  isActive,
  children,
  style,
}: {
  isActive: boolean;
  children: React.ReactNode;
  style: object;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : TAB_BAR.INACTIVE_OPACITY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1 : 0.96,
        useNativeDriver: true,
        speed: 24,
        bounciness: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : TAB_BAR.INACTIVE_OPACITY,
        duration: TAB_BAR.ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, scaleAnim, opacityAnim]);

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      {children}
    </Animated.View>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, normalizeHeight(12));
  const barPaddingHorizontal = normalizeWidth(TAB_BAR.HORIZONTAL_MARGIN);
  const barHeight = normalizeHeight(TAB_BAR.HEIGHT);
  const barPadding = normalizeWidth(TAB_BAR.PADDING);
  const barRadius = normalizeWidth(TAB_BAR.BORDER_RADIUS);
  const activeHeight = normalizeHeight(TAB_BAR.ACTIVE_HEIGHT);
  const activePaddingV = normalizeHeight(TAB_BAR.ACTIVE_PADDING_VERTICAL);
  const activePaddingH = normalizeWidth(TAB_BAR.ACTIVE_PADDING_HORIZONTAL);
  const activeGap = normalizeWidth(TAB_BAR.ACTIVE_GAP);
  const activeRadius = normalizeWidth(TAB_BAR.ACTIVE_BORDER_RADIUS);
  const iconSize = normalizeWidth(24);
  const activeIconSize = normalizeWidth(26); // Larger icon for active tab
  const activeLabelSize = normalizeFont(14); // Larger label for active tab

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingHorizontal: barPaddingHorizontal,
          paddingBottom: bottomInset,
        },
      ]}
    >
      <BlurView
        intensity={4}
        tint="dark"
        style={[
          styles.bar,
          {
            height: barHeight,
            padding: barPadding,
            borderRadius: barRadius,
            backgroundColor: COLORS.tabBarBackground,
            overflow: 'hidden',
          },
        ]}
      >
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const isActive = state.index === index;
            const key = ROUTE_TO_KEY[route.name] ?? 'HOME';
            const label = TAB_LABELS[key];
            const iconName = TAB_ICONS[key];
            const { options } = descriptors[route.key];

            const onPress = () => {
              LayoutAnimation.configureNext({
                ...LayoutAnimation.Presets.easeInEaseOut,
                duration: TAB_BAR.ANIMATION_DURATION,
              });
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <AnimatedTabItem
                key={route.key}
                isActive={isActive}
                style={[
                  styles.tab,
                  {
                    flex: isActive ? 3 : 1,
                    height: activeHeight,
                    paddingVertical: activePaddingV,
                    paddingHorizontal: isActive ? activePaddingH : normalizeWidth(8),
                    borderRadius: activeRadius,
                    backgroundColor: isActive ? TAB_BAR.ACTIVE_BACKGROUND : 'transparent',
                  },
                ]}
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: Boolean(isActive) }}
                  accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  activeOpacity={0.7}
                  style={styles.tabTouchable}
                >
                  {isActive ? (
                    // Active tab: Show icon + label
                    <>
                      <View style={[styles.tabContent, { marginRight: activeGap }]}>
                        <MaterialCommunityIcons
                          name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={activeIconSize}
                          color={COLORS.white}
                        />
                      </View>
                      <Text
                        variant="caption"
                        weight="medium"
                        style={[styles.label, { color: COLORS.white, fontSize: activeLabelSize }]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </>
                  ) : (
                    // Inactive tab: Show only icon
                    <View style={styles.tabContent}>
                      <MaterialCommunityIcons
                        name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={iconSize}
                        color={COLORS.white}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedTabItem>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingTop: normalizeHeight(8),
    zIndex: 1,
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    }),
    ...(Platform.OS === 'android' && { elevation: 8 }),
  },
  bar: {
    width: '100%',
    maxWidth: widthPercentage(92),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  tabTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: COLORS.white,
  },
});
