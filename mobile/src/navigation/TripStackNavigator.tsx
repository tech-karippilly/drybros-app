/**
 * Trip stack navigator (nested inside Trip tab)
 * Header is hidden; screens render their own custom headers.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TripScreen, TripDetailsScreen, TripStartScreen, TripEndScreen, TripPaymentScreen } from '../screens';
import { TRIP_STACK_ROUTES } from '../constants/routes';
import type { TripItem } from '../constants/trips';

export type TripStackParamList = {
  [TRIP_STACK_ROUTES.TRIP_HOME]: undefined;
  [TRIP_STACK_ROUTES.TRIP_DETAILS]: { trip: TripItem };
  [TRIP_STACK_ROUTES.TRIP_START]: { trip: TripItem };
  [TRIP_STACK_ROUTES.TRIP_END]: { trip: TripItem };
  [TRIP_STACK_ROUTES.TRIP_PAYMENT]: { trip: TripItem; amount?: number };
};

const Stack = createNativeStackNavigator<TripStackParamList>();

export function TripStackNavigator() {
  return (
    <Stack.Navigator initialRouteName={TRIP_STACK_ROUTES.TRIP_HOME} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={TRIP_STACK_ROUTES.TRIP_HOME} component={TripScreen} />
      <Stack.Screen name={TRIP_STACK_ROUTES.TRIP_DETAILS} component={TripDetailsScreen} />
      <Stack.Screen name={TRIP_STACK_ROUTES.TRIP_START} component={TripStartScreen} />
      <Stack.Screen name={TRIP_STACK_ROUTES.TRIP_END} component={TripEndScreen} />
      <Stack.Screen name={TRIP_STACK_ROUTES.TRIP_PAYMENT} component={TripPaymentScreen} />
    </Stack.Navigator>
  );
}

export default TripStackNavigator;

