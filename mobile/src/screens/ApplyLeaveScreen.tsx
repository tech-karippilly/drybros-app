/**
 * Apply Leave screen
 * Opened from Leave tab FAB; returns back to Leave tab screen on close/cancel.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { Text } from '../typography';
import {
  COLORS,
  APPLY_LEAVE_COLORS,
  APPLY_LEAVE_LAYOUT,
  APPLY_LEAVE_STRINGS,
} from '../constants';
import { normalizeHeight, normalizeWidth } from '../utils/responsive';
import { getFontFamily } from '../constants/typography';

type ApplyLeaveNavigation = NativeStackNavigationProp<any>;

function formatDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function DateField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: Date | null;
  onPress: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text variant="body" style={styles.fieldLabel}>
        {label}
      </Text>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={onPress} style={styles.inputLike}>
        <Text
          variant="body"
          style={[styles.inputText, !value && { color: APPLY_LEAVE_COLORS.PLACEHOLDER }]}
          numberOfLines={1}
        >
          {value ? formatDDMMYYYY(value) : APPLY_LEAVE_STRINGS.DATE_PLACEHOLDER}
        </Text>
        <MaterialCommunityIcons
          name="calendar-blank-outline"
          size={normalizeWidth(APPLY_LEAVE_LAYOUT.INPUT_ICON_SIZE)}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

export function ApplyLeaveScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ApplyLeaveNavigation>();

  const [fromDate, setFromDate] = React.useState<Date | null>(null);
  const [toDate, setToDate] = React.useState<Date | null>(null);
  const [reason, setReason] = React.useState('');

  // Simple inline date selection using the existing UI date picker component behavior:
  // We reuse the platform picker via a tiny conditional render.
  const [pickerOpen, setPickerOpen] = React.useState<null | 'from' | 'to'>(null);

  const close = () => navigation.goBack();

  const submit = () => {
    // TODO: wire API call; for now return back to list.
    void fromDate;
    void toDate;
    void reason;
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <View style={styles.headerSideSpacer} />
        <Text variant="body" weight="semiBold" style={styles.headerTitle}>
          {APPLY_LEAVE_STRINGS.TITLE}
        </Text>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} onPress={close} style={styles.headerIconBtn}>
          <MaterialCommunityIcons
            name="close"
            size={normalizeWidth(APPLY_LEAVE_LAYOUT.HEADER_ICON_SIZE)}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      <View style={styles.cardWrap}>
        <View style={styles.card}>
          <DateField
            label={APPLY_LEAVE_STRINGS.FROM_DATE_LABEL}
            value={fromDate}
            onPress={() => setPickerOpen('from')}
          />
          <DateField
            label={APPLY_LEAVE_STRINGS.TO_DATE_LABEL}
            value={toDate}
            onPress={() => setPickerOpen('to')}
          />

          <View style={styles.field}>
            <Text variant="body" style={styles.fieldLabel}>
              {APPLY_LEAVE_STRINGS.REASON_LABEL}
            </Text>
            <View style={[styles.inputLike, styles.reasonBox]}>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={APPLY_LEAVE_STRINGS.REASON_PLACEHOLDER}
                placeholderTextColor={APPLY_LEAVE_COLORS.PLACEHOLDER}
                style={styles.reasonInput}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.buttonsWrap}>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.9} onPress={submit} style={styles.primaryBtn}>
              <Text variant="body" weight="semiBold" style={styles.primaryBtnText}>
                {APPLY_LEAVE_STRINGS.SUBMIT}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity accessibilityRole="button" activeOpacity={0.9} onPress={close} style={styles.secondaryBtn}>
              <Text variant="body" weight="semiBold" style={styles.secondaryBtnText}>
                {APPLY_LEAVE_STRINGS.CANCEL}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Minimal native picker */}
      {pickerOpen ? (
        <NativeDatePicker
          value={(pickerOpen === 'from' ? fromDate : toDate) ?? new Date()}
          onCancel={() => setPickerOpen(null)}
          onChange={(d) => {
            if (pickerOpen === 'from') setFromDate(d);
            else setToDate(d);
            setPickerOpen(null);
          }}
        />
      ) : null}
    </View>
  );
}

function NativeDatePicker({
  value,
  onCancel,
  onChange,
}: {
  value: Date;
  onCancel: () => void;
  onChange: (d: Date) => void;
}) {
  // Lazy import to avoid bundler circularities.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const DateTimePicker = require('@react-native-community/datetimepicker').default;

  return (
    <DateTimePicker
      value={value}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={(event: any, selected?: Date) => {
        if (Platform.OS === 'android') {
          if (event?.type === 'dismissed') onCancel();
          if (event?.type === 'set' && selected) onChange(selected);
          return;
        }
        // iOS fires continuously; accept selection when date exists and user closes via UI
        if (selected) onChange(selected);
      }}
      textColor={Platform.OS === 'ios' ? COLORS.textPrimary : undefined}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APPLY_LEAVE_COLORS.SCREEN_BG,
  },
  header: {
    height: normalizeHeight(APPLY_LEAVE_LAYOUT.HEADER_HEIGHT),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(APPLY_LEAVE_LAYOUT.SCREEN_HORIZONTAL_PADDING),
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: normalizeWidth(APPLY_LEAVE_LAYOUT.HEADER_TITLE_FONT_SIZE),
    textAlign: 'center',
  },
  headerSideSpacer: {
    width: normalizeWidth(44),
    height: normalizeHeight(44),
  },
  headerIconBtn: {
    width: normalizeWidth(44),
    height: normalizeHeight(44),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider,
  },
  cardWrap: {
    flex: 1,
    paddingHorizontal: normalizeWidth(APPLY_LEAVE_LAYOUT.SCREEN_HORIZONTAL_PADDING),
    paddingTop: normalizeHeight(18),
  },
  card: {
    backgroundColor: APPLY_LEAVE_COLORS.CARD_BG,
    borderRadius: normalizeWidth(APPLY_LEAVE_LAYOUT.CARD_RADIUS),
    padding: normalizeWidth(APPLY_LEAVE_LAYOUT.CARD_PADDING),
  },
  field: {
    marginBottom: normalizeHeight(APPLY_LEAVE_LAYOUT.FIELD_GAP),
  },
  fieldLabel: {
    color: APPLY_LEAVE_COLORS.LABEL,
    fontSize: normalizeWidth(APPLY_LEAVE_LAYOUT.FIELD_LABEL_FONT_SIZE),
    marginBottom: normalizeHeight(10),
  },
  inputLike: {
    height: normalizeHeight(APPLY_LEAVE_LAYOUT.INPUT_HEIGHT),
    borderRadius: normalizeWidth(APPLY_LEAVE_LAYOUT.INPUT_RADIUS),
    borderWidth: 1,
    borderColor: APPLY_LEAVE_COLORS.BORDER,
    backgroundColor: COLORS.white,
    paddingHorizontal: normalizeWidth(APPLY_LEAVE_LAYOUT.INPUT_PADDING_HORIZONTAL),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: normalizeWidth(12),
  },
  reasonBox: {
    height: normalizeHeight(APPLY_LEAVE_LAYOUT.REASON_HEIGHT),
    alignItems: 'flex-start',
    paddingVertical: normalizeHeight(14),
  },
  reasonInput: {
    flex: 1,
    width: '100%',
    color: COLORS.textPrimary,
    fontFamily: getFontFamily('regular'),
    fontSize: normalizeWidth(16),
  },
  buttonsWrap: {
    gap: normalizeHeight(APPLY_LEAVE_LAYOUT.BUTTON_GAP),
    marginTop: normalizeHeight(6),
  },
  primaryBtn: {
    height: normalizeHeight(APPLY_LEAVE_LAYOUT.BUTTON_HEIGHT),
    borderRadius: normalizeWidth(APPLY_LEAVE_LAYOUT.BUTTON_RADIUS),
    backgroundColor: APPLY_LEAVE_COLORS.PRIMARY_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: APPLY_LEAVE_COLORS.PRIMARY_TEXT,
    fontSize: normalizeWidth(APPLY_LEAVE_LAYOUT.BUTTON_FONT_SIZE),
  },
  secondaryBtn: {
    height: normalizeHeight(APPLY_LEAVE_LAYOUT.BUTTON_HEIGHT),
    borderRadius: normalizeWidth(APPLY_LEAVE_LAYOUT.BUTTON_RADIUS),
    backgroundColor: APPLY_LEAVE_COLORS.SECONDARY_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: APPLY_LEAVE_COLORS.SECONDARY_TEXT,
    fontSize: normalizeWidth(APPLY_LEAVE_LAYOUT.BUTTON_FONT_SIZE),
  },
});

export default ApplyLeaveScreen;

