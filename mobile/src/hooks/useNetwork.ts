/**
 * Hook to check internet connection
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { PERMISSION_STATUS } from '../constants/permissions';

export interface NetworkState {
  isConnected: boolean | null;
  type: string | null;
  isInternetReachable: boolean | null;
  isWifiEnabled: boolean | null;
}

export const useNetwork = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: null,
    type: null,
    isInternetReachable: null,
    isWifiEnabled: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        isWifiEnabled: state.type === 'wifi',
      });
    });

    // Get initial network state
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        isWifiEnabled: state.type === 'wifi',
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...networkState,
    hasConnection: networkState.isConnected === true,
  };
};