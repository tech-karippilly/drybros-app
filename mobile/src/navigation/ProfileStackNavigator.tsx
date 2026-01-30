/**
 * Profile stack navigator (nested inside Profile tab)
 * Header is hidden; screens render their own custom headers.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen, EarningScreen, ComplaintsScreen } from '../screens';
import { PROFILE_STACK_ROUTES } from '../constants/routes';

export type ProfileStackParamList = {
  [PROFILE_STACK_ROUTES.PROFILE_HOME]: undefined;
  [PROFILE_STACK_ROUTES.EARNINGS]: undefined;
  [PROFILE_STACK_ROUTES.COMPLAINTS]: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={PROFILE_STACK_ROUTES.PROFILE_HOME}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={PROFILE_STACK_ROUTES.PROFILE_HOME} component={ProfileScreen} />
      <Stack.Screen name={PROFILE_STACK_ROUTES.EARNINGS} component={EarningScreen} />
      <Stack.Screen name={PROFILE_STACK_ROUTES.COMPLAINTS} component={ComplaintsScreen} />
    </Stack.Navigator>
  );
}

export default ProfileStackNavigator;

