/**
 * Main tab navigator (post-login)
 * Home, Trip, Leave, Alerts, Profile
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  HomeScreen,
  TripScreen,
  LeaveScreen,
  AlertsScreen,
} from '../screens';
import { CustomTabBar } from './CustomTabBar';
import { TAB_ROUTES } from '../constants/routes';
import { ProfileStackNavigator } from './ProfileStackNavigator';

export type MainTabParamList = {
  [TAB_ROUTES.HOME]: undefined;
  [TAB_ROUTES.TRIP]: undefined;
  [TAB_ROUTES.LEAVE]: undefined;
  [TAB_ROUTES.ALERTS]: undefined;
  [TAB_ROUTES.PROFILE]: undefined;
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
      <Tab.Screen name={TAB_ROUTES.TRIP} component={TripScreen} />
      <Tab.Screen name={TAB_ROUTES.LEAVE} component={LeaveScreen} />
      <Tab.Screen name={TAB_ROUTES.ALERTS} component={AlertsScreen} />
      <Tab.Screen name={TAB_ROUTES.PROFILE} component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
