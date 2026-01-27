import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
      <View
        style={[
          styles.bar,
          {
            height: barHeight,
            padding: barPadding,
            borderRadius: barRadius,
            backgroundColor: 'transparent',
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
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: Boolean(isActive) }}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.7}
                style={[
                  styles.tab,
                  {
                    flex: 1,
                    height: activeHeight,
                    paddingVertical: activePaddingV,
                    paddingHorizontal: isActive ? activePaddingH : normalizeWidth(12),
                    borderRadius: activeRadius,
                    backgroundColor: isActive ? TAB_BAR.ACTIVE_BACKGROUND : 'transparent',
                    opacity: isActive ? 1 : TAB_BAR.INACTIVE_OPACITY,
                  },
                ]}
              >
                <View style={[styles.tabContent, isActive && { marginRight: activeGap }]}>
                  <MaterialCommunityIcons
                    name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={iconSize}
                    color={COLORS.white}
                  />
                </View>
                {isActive && (
                  <Text
                    variant="caption"
                    weight="medium"
                    style={[styles.label, { color: COLORS.white, fontSize: normalizeFont(12) }]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingTop: normalizeHeight(8),
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
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: COLORS.white,
  },
});
