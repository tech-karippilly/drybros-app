/**
 * Main tab navigator (post-login)
 * Home, Trip, Leave, Alerts, Profile
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import {
  HomeScreen,
  AlertsScreen,
} from '../screens';
import { CustomTabBar } from './CustomTabBar';
import { TAB_ROUTES, TRIP_STACK_ROUTES } from '../constants/routes';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { LeaveStackNavigator } from './LeaveStackNavigator';
import { TripStackNavigator } from './TripStackNavigator';
import type { TripStackParamList } from './TripStackNavigator';
import type { LeaveStackParamList } from './LeaveStackNavigator';
import type { ProfileStackParamList } from './ProfileStackNavigator';

export type MainTabParamList = {
  [TAB_ROUTES.HOME]: undefined;
  [TAB_ROUTES.TRIP]: NavigatorScreenParams<TripStackParamList> | undefined;
  [TAB_ROUTES.LEAVE]: NavigatorScreenParams<LeaveStackParamList> | undefined;
  [TAB_ROUTES.ALERTS]: undefined;
  [TAB_ROUTES.PROFILE]: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName={TAB_ROUTES.HOME}
      detachInactiveScreens={false}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute',
          zIndex: 1,
        },
      }}
    >
      <Tab.Screen name={TAB_ROUTES.HOME} component={HomeScreen} />
      <Tab.Screen
        name={TAB_ROUTES.TRIP}
        component={TripStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Always bring the user to TripHome when pressing the Trip tab
            // (prevents staying on nested screens like TripStart OTP).
            e.preventDefault();
            navigation.navigate(TAB_ROUTES.TRIP, { screen: TRIP_STACK_ROUTES.TRIP_HOME });
          },
        })}
      />
      <Tab.Screen name={TAB_ROUTES.LEAVE} component={LeaveStackNavigator} />
      <Tab.Screen name={TAB_ROUTES.ALERTS} component={AlertsScreen} />
      <Tab.Screen name={TAB_ROUTES.PROFILE} component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
