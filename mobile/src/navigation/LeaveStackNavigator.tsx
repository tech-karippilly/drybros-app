/**
 * Leave stack navigator (nested inside Leave tab)
 * Header is hidden; screens render their own custom headers.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeaveScreen, ApplyLeaveScreen } from '../screens';
import { LEAVE_STACK_ROUTES } from '../constants/routes';

export type LeaveStackParamList = {
  [LEAVE_STACK_ROUTES.LEAVE_HOME]: undefined;
  [LEAVE_STACK_ROUTES.APPLY_LEAVE]: undefined;
};

const Stack = createNativeStackNavigator<LeaveStackParamList>();

export function LeaveStackNavigator() {
  return (
    <Stack.Navigator initialRouteName={LEAVE_STACK_ROUTES.LEAVE_HOME} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={LEAVE_STACK_ROUTES.LEAVE_HOME} component={LeaveScreen} />
      <Stack.Screen name={LEAVE_STACK_ROUTES.APPLY_LEAVE} component={ApplyLeaveScreen} />
    </Stack.Navigator>
  );
}

export default LeaveStackNavigator;

