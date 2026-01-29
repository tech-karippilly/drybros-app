/**
 * Date and Time Picker component
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerProps } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { getFontFamily, FONT_SIZES } from '../../constants/typography';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../../utils/responsive';
import { Text } from '../../typography';
import { formatDate, formatTime } from '../../utils/formatters';

export const DateTimePickerComponent: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>(mode === 'datetime' ? 'date' : mode);

  const handlePress = () => {
    if (mode === 'datetime') {
      setPickerMode('date');
    } else {
      setPickerMode(mode);
    }
    setShowPicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      if (mode === 'datetime' && pickerMode === 'date') {
        // After selecting date, show time picker
        setPickerMode('time');
        if (Platform.OS === 'ios') {
          onChange(selectedDate);
        }
      } else {
        onChange(selectedDate);
        if (Platform.OS === 'android' || pickerMode === 'time') {
          setShowPicker(false);
        }
      }
    }
  };

  const displayText = () => {
    if (mode === 'date') {
      return formatDate(value, 'long');
    } else if (mode === 'time') {
      return formatTime(value, '12h');
    } else {
      return `${formatDate(value, 'long')} ${formatTime(value, '12h')}`;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text variant="body" style={styles.text}>
          {displayText()}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          textColor={Platform.OS === 'ios' ? COLORS.textPrimary : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: normalizeHeight(16),
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: normalizeWidth(8),
    paddingHorizontal: normalizeWidth(16),
    paddingVertical: normalizeHeight(12),
    backgroundColor: COLORS.white,
    minHeight: normalizeHeight(48),
  },
  text: {
    flex: 1,
    color: COLORS.textPrimary,
  },
  arrow: {
    fontFamily: getFontFamily('regular'),
    fontSize: normalizeFont(FONT_SIZES.sm),
    color: COLORS.textSecondary,
  },
});

export default DateTimePickerComponent;