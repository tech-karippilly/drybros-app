/**
 * TripDetailsModal
 * Full-screen modal showing complete trip details with Accept / Reject actions.
 * Used for viewing trip details from the trip assignment notification.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal as RNModal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from './PrimaryButton';
import { Text } from '../../typography';
import { COLORS, TRIPS_COLORS, TRIPS_STRINGS } from '../../constants';
import { normalizeHeight, normalizeWidth } from '../../utils/responsive';
import { getTripByIdApi, type BackendTrip } from '../../services/api/trips';
import { formatTime } from '../../utils/formatters';

export type TripDetailsModalProps = {
  visible: boolean;
  tripId: string;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
};

function RouteBlock({ pickup, drop }: { pickup: string; drop: string }) {
  return (
    <View style={styles.routeBlock}>
      <View style={styles.routeDotsCol}>
        <View style={[styles.routeDot, { backgroundColor: TRIPS_COLORS.PICKUP_DOT }]} />
        <View style={styles.routeLine} />
        <View style={[styles.routeDot, { backgroundColor: TRIPS_COLORS.DROP_DOT }]} />
      </View>
      <View style={styles.routeTextCol}>
        <View style={styles.routeRow}>
          <Text variant="caption" style={styles.routeLabel}>
            {TRIPS_STRINGS.PICKUP_LOCATION_LABEL}
          </Text>
          <Text variant="body" weight="semiBold" style={styles.routeValue}>
            {pickup}
          </Text>
        </View>
        <View style={styles.routeRow}>
          <Text variant="caption" style={styles.routeLabel}>
            {TRIPS_STRINGS.DROP_LOCATION_LABEL}
          </Text>
          <Text variant="body" weight="semiBold" style={styles.routeValue}>
            {drop}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function TripDetailsModal({
  visible,
  tripId,
  onClose,
  onAccept,
  onReject,
  disabled = false,
}: TripDetailsModalProps) {
  const insets = useSafeAreaInsets();
  const [trip, setTrip] = useState<BackendTrip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTripDetails = useCallback(async () => {
    if (!tripId || !visible) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getTripByIdApi(tripId);
      setTrip(data);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to load trip details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tripId, visible]);

  useEffect(() => {
    if (visible) {
      loadTripDetails();
    } else {
      // Reset state when modal is closed
      setTrip(null);
      setError(null);
    }
  }, [visible, loadTripDetails]);

  const scheduledTime = trip?.scheduledAt ? formatTime(new Date(trip.scheduledAt)) : 'Not specified';
  const pickupAddress = trip?.pickupAddress || 'Not specified';
  const dropAddress = trip?.dropAddress || 'Not specified';
  const customerName = trip?.customerName || 'Unknown';
  const customerPhone = trip?.customerPhone || 'N/A';
  const tripType = trip?.tripType || 'Standard';

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={disabled} style={styles.backButton}>
            <MaterialCommunityIcons name="close" size={normalizeWidth(24)} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text variant="h4" weight="semiBold" style={styles.headerTitle}>
            Trip Details
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text variant="body" style={styles.loadingText}>
              Loading trip details...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={normalizeWidth(48)} color={COLORS.error} />
            <Text variant="body" style={styles.errorText}>
              {error}
            </Text>
            <TouchableOpacity onPress={loadTripDetails} style={styles.retryButton}>
              <Text variant="body" weight="semiBold" style={styles.retryText}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : trip ? (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Trip ID */}
              <View style={styles.section}>
                <Text variant="caption" style={styles.label}>
                  {TRIPS_STRINGS.TRIP_ID_LABEL}
                </Text>
                <Text variant="h4" weight="semiBold" style={styles.tripIdText}>
                  #{tripId.slice(-8).toUpperCase()}
                </Text>
              </View>

              {/* Customer Details */}
              <View style={styles.card}>
                <Text variant="body" weight="semiBold" style={styles.cardTitle}>
                  {TRIPS_STRINGS.CUSTOMER_DETAILS_TITLE}
                </Text>
                <View style={styles.cardContent}>
                  <View style={styles.row}>
                    <Text variant="caption" style={styles.label}>
                      Name
                    </Text>
                    <Text variant="body" weight="semiBold" style={styles.value}>
                      {customerName}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text variant="caption" style={styles.label}>
                      Phone
                    </Text>
                    <Text variant="body" weight="semiBold" style={styles.value}>
                      {customerPhone}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Route */}
              <View style={styles.card}>
                <Text variant="body" weight="semiBold" style={styles.cardTitle}>
                  Route Details
                </Text>
                <View style={styles.cardContent}>
                  <RouteBlock pickup={pickupAddress} drop={dropAddress} />
                </View>
              </View>

              {/* Booking Details */}
              <View style={styles.card}>
                <Text variant="body" weight="semiBold" style={styles.cardTitle}>
                  {TRIPS_STRINGS.BOOKING_DETAILS_TITLE}
                </Text>
                <View style={styles.cardContent}>
                  <View style={styles.row}>
                    <Text variant="caption" style={styles.label}>
                      {TRIPS_STRINGS.SCHEDULED_DATE_TIME_LABEL}
                    </Text>
                    <Text variant="body" weight="semiBold" style={styles.value}>
                      {scheduledTime}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text variant="caption" style={styles.label}>
                      {TRIPS_STRINGS.SERVICE_TYPE}
                    </Text>
                    <Text variant="body" weight="semiBold" style={styles.value}>
                      {tripType}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : null}

        {/* Action Buttons */}
        {!loading && !error && trip && (
          <View style={styles.actions}>
            <View style={styles.buttonRow}>
              <View style={styles.buttonFlex}>
                <PrimaryButton
                  label="Accept"
                  onPress={onAccept}
                  backgroundColor={COLORS.success}
                  textColor={COLORS.white}
                  height={normalizeHeight(58)}
                  disabled={disabled}
                />
              </View>
              <View style={styles.buttonFlex}>
                <PrimaryButton
                  label="Reject"
                  onPress={onReject}
                  backgroundColor="#FAD1D1"
                  textColor={COLORS.error}
                  height={normalizeHeight(58)}
                  disabled={disabled}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalizeWidth(16),
    paddingVertical: normalizeHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: TRIPS_COLORS.DIVIDER,
  },
  backButton: {
    padding: normalizeWidth(4),
    width: normalizeWidth(40),
  },
  headerRight: {
    width: normalizeWidth(40),
  },
  headerTitle: {
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalizeHeight(40),
  },
  loadingText: {
    marginTop: normalizeHeight(16),
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalizeHeight(40),
    paddingHorizontal: normalizeWidth(32),
  },
  errorText: {
    marginTop: normalizeHeight(16),
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: normalizeHeight(16),
    paddingHorizontal: normalizeWidth(24),
    paddingVertical: normalizeHeight(12),
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: normalizeWidth(16),
    gap: normalizeHeight(16),
  },
  section: {
    marginBottom: normalizeHeight(8),
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: normalizeWidth(16),
    borderWidth: 1,
    borderColor: TRIPS_COLORS.DIVIDER,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    marginBottom: normalizeHeight(12),
  },
  cardContent: {
    gap: normalizeHeight(12),
  },
  row: {
    gap: normalizeHeight(4),
  },
  label: {
    color: TRIPS_COLORS.SUBTEXT,
  },
  value: {
    color: COLORS.textPrimary,
  },
  tripIdText: {
    color: COLORS.primary,
  },
  routeBlock: {
    flexDirection: 'row',
    gap: normalizeWidth(12),
  },
  routeDotsCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: normalizeHeight(4),
  },
  routeDot: {
    width: normalizeWidth(12),
    height: normalizeWidth(12),
    borderRadius: normalizeWidth(6),
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: TRIPS_COLORS.DIVIDER,
    marginVertical: normalizeHeight(4),
  },
  routeTextCol: {
    flex: 1,
    justifyContent: 'space-between',
    gap: normalizeHeight(24),
  },
  routeRow: {
    gap: normalizeHeight(4),
  },
  routeLabel: {
    color: TRIPS_COLORS.SUBTEXT,
  },
  routeValue: {
    color: COLORS.textPrimary,
  },
  actions: {
    padding: normalizeWidth(16),
    borderTopWidth: 1,
    borderTopColor: TRIPS_COLORS.DIVIDER,
    backgroundColor: COLORS.white,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: normalizeWidth(14),
  },
  buttonFlex: {
    flex: 1,
  },
});
