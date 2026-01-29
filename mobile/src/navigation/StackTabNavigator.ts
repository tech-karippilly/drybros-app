/**
 * Reusable native-stack navigator wrapper.
 * Intentionally does NOT register any screens here.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';

/**
 * Add your route names + params when you start using this navigator.
 * Keeping it generic for now.
 */
export type StackTabParamList = ParamListBase;

const Stack = createNativeStackNavigator<StackTabParamList>();

export type StackTabNavigatorProps = {
  children: React.ReactNode;
};

export function StackTabNavigator({ children }: StackTabNavigatorProps) {
  // Note: This file is .ts (not .tsx), so we avoid JSX intentionally.
  return React.createElement(Stack.Navigator as any, { screenOptions: { headerShown: false }, children });
}

export default StackTabNavigator;
