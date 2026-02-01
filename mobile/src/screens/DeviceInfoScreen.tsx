/**
 * Device Info Screen
 * Displays permission status, battery, and network information
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../hooks/useNetwork';
import { useBattery } from '../hooks/useBattery';
import { useLocation } from '../hooks/useLocation';
import { useCamera } from '../hooks/useCamera';
import { useNotifications } from '../hooks/useNotifications';
import { useSMS } from '../hooks/useSMS';
import { Card } from '../components/ui/Card';
import { Text } from '../typography';
import { COLORS } from '../constants/colors';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../utils/responsive';
import { PERMISSION_STATUS } from '../constants/permissions';

export const DeviceInfoScreen: React.FC = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();

  // Hooks
  const network = useNetwork();
  const battery = useBattery();
  const location = useLocation();
  const camera = useCamera();
  const notifications = useNotifications();
  const sms = useSMS();

  useEffect(() => {
    // Check all permissions on mount
    location.checkPermission();
    camera.checkPermission();
    notifications.checkPermission();
    sms.checkAvailability();
  }, [camera.checkPermission, location.checkPermission, notifications.checkPermission, sms.checkAvailability]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      location.checkPermission(),
      camera.checkPermission(),
      notifications.checkPermission(),
      sms.checkAvailability(),
    ]);
    setRefreshing(false);
  }, [camera.checkPermission, location.checkPermission, notifications.checkPermission, sms.checkAvailability]);

  const getPermissionStatus = (status: string | null) => {
    if (!status) return 'Not Checked';
    switch (status) {
      case PERMISSION_STATUS.GRANTED:
        return 'Granted';
      case PERMISSION_STATUS.DENIED:
        return 'Denied';
      case PERMISSION_STATUS.UNDETERMINED:
        return 'Not Requested';
      case PERMISSION_STATUS.RESTRICTED:
        return 'Restricted';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return COLORS.textTertiary;
    switch (status) {
      case PERMISSION_STATUS.GRANTED:
        return COLORS.success;
      case PERMISSION_STATUS.DENIED:
        return COLORS.error;
      case PERMISSION_STATUS.UNDETERMINED:
        return COLORS.warning;
      case PERMISSION_STATUS.RESTRICTED:
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getBatteryColor = () => {
    if (battery.batteryPercentage === null) return COLORS.textTertiary;
    if (battery.batteryPercentage < 20) return COLORS.error;
    if (battery.batteryPercentage < 50) return COLORS.warning;
    return COLORS.success;
  };

  const getNetworkColor = () => {
    if (network.isConnected === null) return COLORS.textTertiary;
    return network.isConnected ? COLORS.success : COLORS.error;
  };

  const InfoRow: React.FC<{ label: string; value: string | number | null; color?: string }> = ({
    label,
    value,
    color = COLORS.textPrimary,
  }) => (
    <View style={styles.infoRow}>
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
      <Text variant="body" weight="medium" style={[styles.value, { color }]}>
        {value !== null && value !== undefined ? String(value) : 'N/A'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text variant="h3" weight="bold">
            Device Information
          </Text>
          <Text variant="caption" style={styles.subtitle}>
            Pull down to refresh
          </Text>
        </View>

        {/* Network Status */}
        <Card style={styles.card}>
          <Text variant="h5" weight="semiBold" style={styles.cardTitle}>
            Network Status
          </Text>
          <View style={styles.divider} />
          <InfoRow
            label="Connection"
            value={network.isConnected ? 'Connected' : 'Disconnected'}
            color={getNetworkColor()}
          />
          <InfoRow label="Type" value={network.type || 'Unknown'} />
          <InfoRow
            label="Internet Reachable"
            value={network.isInternetReachable ? 'Yes' : 'No'}
            color={network.isInternetReachable ? COLORS.success : COLORS.error}
          />
          <InfoRow
            label="WiFi Enabled"
            value={network.isWifiEnabled ? 'Yes' : 'No'}
            color={network.isWifiEnabled ? COLORS.success : COLORS.textSecondary}
          />
        </Card>

        {/* Battery Status */}
        <Card style={styles.card}>
          <Text variant="h5" weight="semiBold" style={styles.cardTitle}>
            Battery Status
          </Text>
          <View style={styles.divider} />
          <InfoRow
            label="Battery Level"
            value={battery.batteryPercentage !== null ? `${battery.batteryPercentage}%` : 'N/A'}
            color={getBatteryColor()}
          />
          <InfoRow
            label="Charging"
            value={battery.isCharging ? 'Yes' : 'No'}
            color={battery.isCharging ? COLORS.success : COLORS.textSecondary}
          />
          <InfoRow
            label="Low Battery"
            value={battery.isLowBattery ? 'Yes' : 'No'}
            color={battery.isLowBattery ? COLORS.error : COLORS.textSecondary}
          />
          <InfoRow
            label="Low Power Mode"
            value={battery.isLowPowerModeEnabled ? 'Enabled' : 'Disabled'}
            color={battery.isLowPowerModeEnabled ? COLORS.warning : COLORS.textSecondary}
          />
        </Card>

        {/* Permissions Status */}
        <Card style={styles.card}>
          <Text variant="h5" weight="semiBold" style={styles.cardTitle}>
            Permissions Status
          </Text>
          <View style={styles.divider} />

          {/* Location Permission */}
          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Text variant="body" weight="medium" style={styles.permissionLabel}>
                Location
              </Text>
              <Text variant="caption" style={styles.permissionDescription}>
                Access device location
              </Text>
            </View>
            <View style={styles.permissionStatus}>
              <Text
                variant="caption"
                weight="medium"
                style={[styles.statusText, { color: getStatusColor(location.permissionStatus) }]}
              >
                {getPermissionStatus(location.permissionStatus)}
              </Text>
              {!location.hasPermission && (
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={location.requestPermission}
                  disabled={location.loading}
                >
                  <Text variant="caption" weight="medium" style={styles.requestButtonText}>
                    Request
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Camera Permission */}
          <View style={styles.divider} />
          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Text variant="body" weight="medium" style={styles.permissionLabel}>
                Camera
              </Text>
              <Text variant="caption" style={styles.permissionDescription}>
                Take photos and videos
              </Text>
            </View>
            <View style={styles.permissionStatus}>
              <Text
                variant="caption"
                weight="medium"
                style={[styles.statusText, { color: getStatusColor(camera.permissionStatus) }]}
              >
                {getPermissionStatus(camera.permissionStatus)}
              </Text>
              {!camera.hasPermission && (
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={camera.requestPermission}
                  disabled={camera.loading}
                >
                  <Text variant="caption" weight="medium" style={styles.requestButtonText}>
                    Request
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Notifications Permission */}
          <View style={styles.divider} />
          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Text variant="body" weight="medium" style={styles.permissionLabel}>
                Notifications
              </Text>
              <Text variant="caption" style={styles.permissionDescription}>
                Send push notifications
              </Text>
            </View>
            <View style={styles.permissionStatus}>
              <Text
                variant="caption"
                weight="medium"
                style={[styles.statusText, { color: getStatusColor(notifications.permissionStatus) }]}
              >
                {getPermissionStatus(notifications.permissionStatus)}
              </Text>
              {!notifications.hasPermission && (
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={notifications.requestPermission}
                  disabled={notifications.loading}
                >
                  <Text variant="caption" weight="medium" style={styles.requestButtonText}>
                    Request
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* SMS Availability */}
          <View style={styles.divider} />
          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Text variant="body" weight="medium" style={styles.permissionLabel}>
                SMS
              </Text>
              <Text variant="caption" style={styles.permissionDescription}>
                Send text messages
              </Text>
            </View>
            <View style={styles.permissionStatus}>
              <Text
                variant="caption"
                weight="medium"
                style={[
                  styles.statusText,
                  { color: sms.isAvailable ? COLORS.success : COLORS.textTertiary },
                ]}
              >
                {sms.isAvailable === null
                  ? 'Checking...'
                  : sms.isAvailable
                    ? 'Available'
                    : 'Not Available'}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: normalizeWidth(16),
    paddingBottom: normalizeHeight(32),
  },
  header: {
    marginBottom: normalizeHeight(24),
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginTop: normalizeHeight(4),
  },
  card: {
    marginBottom: normalizeHeight(16),
  },
  cardTitle: {
    color: COLORS.textPrimary,
    marginBottom: normalizeHeight(12),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: normalizeHeight(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalizeHeight(12),
  },
  label: {
    color: COLORS.textSecondary,
    flex: 1,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: normalizeHeight(8),
  },
  permissionInfo: {
    flex: 1,
    marginRight: normalizeWidth(12),
  },
  permissionLabel: {
    color: COLORS.textPrimary,
    marginBottom: normalizeHeight(4),
  },
  permissionDescription: {
    color: COLORS.textTertiary,
  },
  permissionStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    marginBottom: normalizeHeight(4),
  },
  requestButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: normalizeWidth(12),
    paddingVertical: normalizeHeight(6),
    borderRadius: normalizeWidth(6),
    marginTop: normalizeHeight(4),
  },
  requestButtonText: {
    color: COLORS.white,
  },
});

export default DeviceInfoScreen;