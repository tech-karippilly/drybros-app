/**
 * Hook to monitor device battery level
 */

import { useState, useEffect } from 'react';
import * as Battery from 'expo-battery';

export interface BatteryState {
  batteryLevel: number | null;
  batteryState: Battery.BatteryState | null;
  isLowPowerModeEnabled: boolean | null;
  isCharging: boolean | null;
  isLowBattery: boolean | null;
}

export const useBattery = () => {
  const [state, setState] = useState<BatteryState>({
    batteryLevel: null,
    batteryState: null,
    isLowPowerModeEnabled: null,
    isCharging: null,
    isLowBattery: null,
  });

  useEffect(() => {
    // Get initial battery state
    const getBatteryInfo = async () => {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();
      const isLowPowerModeEnabled = await Battery.isLowPowerModeEnabledAsync();

      setState({
        batteryLevel,
        batteryState,
        isLowPowerModeEnabled,
        isCharging: batteryState === Battery.BatteryState.CHARGING,
        isLowBattery: batteryLevel < 0.2,
      });
    };

    getBatteryInfo();

    // Subscribe to battery level changes
    const batteryLevelSubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setState((prev) => ({
        ...prev,
        batteryLevel,
        isLowBattery: batteryLevel < 0.2,
      }));
    });

    // Subscribe to battery state changes (charging/not charging)
    const batteryStateSubscription = Battery.addBatteryStateListener(({ batteryState }) => {
      setState((prev) => ({
        ...prev,
        batteryState,
        isCharging: batteryState === Battery.BatteryState.CHARGING,
      }));
    });

    // Subscribe to low power mode changes (iOS)
    const lowPowerModeSubscription = Battery.addLowPowerModeListener(({ lowPowerModeEnabled }) => {
      setState((prev) => ({
        ...prev,
        isLowPowerModeEnabled: lowPowerModeEnabled,
      }));
    });

    return () => {
      batteryLevelSubscription.remove();
      batteryStateSubscription.remove();
      lowPowerModeSubscription.remove();
    };
  }, []);

  return {
    ...state,
    batteryPercentage: state.batteryLevel !== null ? Math.round(state.batteryLevel * 100) : null,
  };
};