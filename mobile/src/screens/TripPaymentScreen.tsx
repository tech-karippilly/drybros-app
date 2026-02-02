/**
 * Trip Payment screen
 * Called after end-verify. Collect payment from customer and verify to complete trip.
 *
 * Backend flow:
 * - POST /trips/:id/collect-payment
 * - POST /trips/:id/verify-payment
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Text } from '../typography';
import { Input, PrimaryButton } from '../components/ui';
import { useToast } from '../contexts';
import { COLORS, TRIP_PAYMENT_COLORS, TRIP_PAYMENT_LAYOUT, TRIP_PAYMENT_STRINGS, TRIP_STACK_ROUTES } from '../constants';
import { normalizeHeight, normalizeWidth } from '../utils/responsive';
import type { TripStackParamList } from '../navigation/TripStackNavigator';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { collectPaymentApi, verifyPaymentApi, PAYMENT_METHODS, type PaymentMethod } from '../services/api/trips';

type Props = NativeStackScreenProps<TripStackParamList, typeof TRIP_STACK_ROUTES.TRIP_PAYMENT>;

function PaymentMethodPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.methodPill, active ? styles.methodPillActive : styles.methodPillInactive]}
    >
      <Text variant="body" weight="semiBold" style={[styles.methodPillText, active ? styles.methodPillTextActive : styles.methodPillTextInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function TripPaymentScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const trip = route.params?.trip;
  const amountFromPrev = route.params?.amount;

  const [driverId, setDriverId] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHODS.CASH);
  const [upiAmountText, setUpiAmountText] = useState('');
  const [cashAmountText, setCashAmountText] = useState('');
  const [upiReference, setUpiReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadDriver = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        const parsed = raw ? (JSON.parse(raw) as { id?: string }) : null;
        const id = parsed?.id;
        if (mounted && typeof id === 'string') setDriverId(id);
      } catch {
        // ignore
      }
    };
    loadDriver();
    return () => {
      mounted = false;
    };
  }, []);

  const amountLabel = useMemo(() => {
    const n = typeof amountFromPrev === 'number' && Number.isFinite(amountFromPrev) ? amountFromPrev : undefined;
    return n !== undefined ? `${TRIP_PAYMENT_STRINGS.AMOUNT_PREFIX} ₹${n}` : TRIP_PAYMENT_STRINGS.AMOUNT_UNKNOWN;
  }, [amountFromPrev]);

  const canSubmit = useMemo(() => {
    if (!trip?.id) return false;
    if (!driverId) return false;
    if (submitting) return false;

    const upi = Number(upiAmountText);
    const cash = Number(cashAmountText);

    if (method === PAYMENT_METHODS.UPI) return Number.isFinite(upi) && upi > 0;
    if (method === PAYMENT_METHODS.CASH) return Number.isFinite(cash) && cash > 0;
    // BOTH
    return Number.isFinite(upi) && upi > 0 && Number.isFinite(cash) && cash > 0;
  }, [cashAmountText, driverId, method, submitting, trip?.id, upiAmountText]);

  const submit = useCallback(async () => {
    if (!trip?.id) {
      showToast({ message: TRIP_PAYMENT_STRINGS.ERROR_TRIP_MISSING, type: 'error', position: 'top' });
      return;
    }
    if (!driverId) {
      showToast({ message: TRIP_PAYMENT_STRINGS.ERROR_DRIVER_MISSING, type: 'error', position: 'top' });
      return;
    }
    if (submitting) return;

    const upiAmount = Number(upiAmountText);
    const cashAmount = Number(cashAmountText);

    setSubmitting(true);
    try {
      await collectPaymentApi(trip.id, {
        driverId,
        paymentMethod: method,
        upiAmount: method === PAYMENT_METHODS.UPI || method === PAYMENT_METHODS.BOTH ? upiAmount : undefined,
        cashAmount: method === PAYMENT_METHODS.CASH || method === PAYMENT_METHODS.BOTH ? cashAmount : undefined,
        upiReference: upiReference.trim() ? upiReference.trim() : undefined,
      });

      await verifyPaymentApi(trip.id, { driverId });

      showToast({ message: TRIP_PAYMENT_STRINGS.SUCCESS, type: 'success', position: 'top' });
      navigation.popToTop();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || TRIP_PAYMENT_STRINGS.ERROR_FAILED;
      showToast({ message: msg, type: 'error', position: 'top' });
    } finally {
      setSubmitting(false);
    }
  }, [cashAmountText, driverId, method, navigation, showToast, submitting, trip?.id, upiAmountText, upiReference]);

  const screenPaddingTop = insets.top;
  const screenPaddingBottom = Math.max(insets.bottom, normalizeHeight(TRIP_PAYMENT_LAYOUT.BOTTOM_PADDING));

  return (
    <View style={[styles.container, { paddingTop: screenPaddingTop }]}>
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.headerIconBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="chevron-left" size={normalizeWidth(28)} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text variant="body" weight="semiBold" style={styles.headerTitle}>
          {TRIP_PAYMENT_STRINGS.TITLE}
        </Text>
        <View style={styles.headerSideSpacer} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: screenPaddingBottom }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text variant="body" weight="semiBold" style={styles.amountText}>
            {amountLabel}
          </Text>

          <Text variant="caption" style={styles.sectionLabel}>
            {TRIP_PAYMENT_STRINGS.PAYMENT_METHOD_LABEL}
          </Text>
          <View style={styles.methodRow}>
            <PaymentMethodPill
              label={TRIP_PAYMENT_STRINGS.METHOD_UPI}
              active={method === PAYMENT_METHODS.UPI}
              onPress={() => setMethod(PAYMENT_METHODS.UPI)}
            />
            <PaymentMethodPill
              label={TRIP_PAYMENT_STRINGS.METHOD_CASH}
              active={method === PAYMENT_METHODS.CASH}
              onPress={() => setMethod(PAYMENT_METHODS.CASH)}
            />
            <PaymentMethodPill
              label={TRIP_PAYMENT_STRINGS.METHOD_BOTH}
              active={method === PAYMENT_METHODS.BOTH}
              onPress={() => setMethod(PAYMENT_METHODS.BOTH)}
            />
          </View>

          {method === PAYMENT_METHODS.UPI || method === PAYMENT_METHODS.BOTH ? (
            <>
              <Input
                label={TRIP_PAYMENT_STRINGS.UPI_AMOUNT_LABEL}
                value={upiAmountText}
                onChangeText={setUpiAmountText}
                placeholder={TRIP_PAYMENT_STRINGS.UPI_AMOUNT_PLACEHOLDER}
                helperText={TRIP_PAYMENT_STRINGS.UPI_AMOUNT_HELPER}
                keyboardType="numeric"
              />
              <Input
                label={TRIP_PAYMENT_STRINGS.UPI_REFERENCE_LABEL}
                value={upiReference}
                onChangeText={setUpiReference}
                placeholder={TRIP_PAYMENT_STRINGS.UPI_REFERENCE_PLACEHOLDER}
                helperText={TRIP_PAYMENT_STRINGS.UPI_REFERENCE_HELPER}
              />
            </>
          ) : null}

          {method === PAYMENT_METHODS.CASH || method === PAYMENT_METHODS.BOTH ? (
            <Input
              label={TRIP_PAYMENT_STRINGS.CASH_AMOUNT_LABEL}
              value={cashAmountText}
              onChangeText={setCashAmountText}
              placeholder={TRIP_PAYMENT_STRINGS.CASH_AMOUNT_PLACEHOLDER}
              helperText={TRIP_PAYMENT_STRINGS.CASH_AMOUNT_HELPER}
              keyboardType="numeric"
            />
          ) : null}

          <View style={styles.actionRow}>
            <PrimaryButton
              label={TRIP_PAYMENT_STRINGS.SUBMIT}
              onPress={submit}
              backgroundColor={TRIP_PAYMENT_COLORS.PRIMARY_BG}
              textColor={TRIP_PAYMENT_COLORS.PRIMARY_TEXT}
              height={normalizeHeight(TRIP_PAYMENT_LAYOUT.ACTION_BTN_HEIGHT)}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TRIP_PAYMENT_COLORS.SCREEN_BG },
  header: {
    height: normalizeHeight(TRIP_PAYMENT_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(TRIP_PAYMENT_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerIconBtn: { width: normalizeWidth(44), height: normalizeHeight(44), alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: normalizeWidth(TRIP_PAYMENT_LAYOUT.HEADER_TITLE_FONT_SIZE), textAlign: 'center' },
  headerSideSpacer: { width: normalizeWidth(44), height: normalizeHeight(44) },
  headerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: TRIP_PAYMENT_COLORS.BORDER },

  scrollContent: {
    paddingHorizontal: normalizeWidth(TRIP_PAYMENT_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingTop: normalizeHeight(TRIP_PAYMENT_LAYOUT.CONTENT_TOP_PADDING),
  },
  card: {
    backgroundColor: TRIP_PAYMENT_COLORS.CARD_BG,
    borderRadius: normalizeWidth(TRIP_PAYMENT_LAYOUT.CARD_RADIUS),
    padding: normalizeWidth(TRIP_PAYMENT_LAYOUT.CARD_PADDING),
    gap: normalizeHeight(TRIP_PAYMENT_LAYOUT.CONTENT_GAP),
  },
  amountText: { color: COLORS.textPrimary },
  sectionLabel: { color: TRIP_PAYMENT_COLORS.SUBTITLE },
  methodRow: { flexDirection: 'row', gap: normalizeWidth(10) },
  methodPill: {
    flex: 1,
    height: normalizeHeight(TRIP_PAYMENT_LAYOUT.METHOD_PILL_HEIGHT),
    borderRadius: normalizeWidth(TRIP_PAYMENT_LAYOUT.METHOD_PILL_RADIUS),
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodPillActive: { backgroundColor: TRIP_PAYMENT_COLORS.METHOD_ACTIVE_BG },
  methodPillInactive: { backgroundColor: TRIP_PAYMENT_COLORS.METHOD_INACTIVE_BG },
  methodPillText: {},
  methodPillTextActive: { color: TRIP_PAYMENT_COLORS.METHOD_ACTIVE_TEXT },
  methodPillTextInactive: { color: TRIP_PAYMENT_COLORS.METHOD_INACTIVE_TEXT },

  actionRow: { marginTop: normalizeHeight(4) },
});

export default TripPaymentScreen;

