/**
 * Calendar component
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CalendarProps } from '../../types/common';
import { COLORS } from '../../constants/colors';
import { FONT_FAMILY, FONT_SIZES } from '../../constants/typography';
import { normalizeWidth, normalizeHeight, normalizeFont } from '../../utils/responsive';
import { Text } from '../../typography';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some(
      (disabledDate) =>
        date.getDate() === disabledDate.getDate() &&
        date.getMonth() === disabledDate.getMonth() &&
        date.getFullYear() === disabledDate.getFullYear()
    );
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (!isDateDisabled(newDate)) {
      onDateSelect(newDate);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text variant="h5" style={styles.monthYear}>
          {MONTHS[month]} {year}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.daysHeader}>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text variant="caption" style={styles.dayHeaderText}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {Array.from({ length: startingDayOfWeek }, (_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}
        {days.map((day) => {
          const date = new Date(year, month, day);
          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);

          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayCell, selected && styles.dayCellSelected]}
              onPress={() => handleDateSelect(day)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.dayText,
                  disabled && styles.dayTextDisabled,
                  selected && styles.dayTextSelected,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: normalizeWidth(8),
    padding: normalizeWidth(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalizeHeight(16),
  },
  navButton: {
    width: normalizeWidth(32),
    height: normalizeWidth(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: normalizeFont(FONT_SIZES['2xl']),
    color: COLORS.primary,
  },
  monthYear: {
    color: COLORS.textPrimary,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: normalizeHeight(8),
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: normalizeHeight(4),
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: normalizeWidth(20),
  },
  dayText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: normalizeFont(FONT_SIZES.base),
    color: COLORS.textPrimary,
  },
  dayTextDisabled: {
    color: COLORS.textTertiary,
  },
  dayTextSelected: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
  },
});

export default Calendar;