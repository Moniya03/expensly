import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDateInModal, setSelectedDateInModal] = useState(value);
  const [currentMonth, setCurrentMonth] = useState(new Date(value));

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isYesterday = (date: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const handleToday = () => onChange(new Date());

  const handleYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    onChange(yesterday);
  };

  const handlePickDate = () => {
    setSelectedDateInModal(value);
    setCurrentMonth(new Date(value));
    setShowCalendar(true);
  };

  const handleConfirmDate = () => {
    onChange(selectedDateInModal);
    setShowCalendar(false);
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    const today = new Date();
    // Don't allow navigating to future months
    if (newMonth.getFullYear() > today.getFullYear() || 
        (newMonth.getFullYear() === today.getFullYear() && newMonth.getMonth() > today.getMonth())) {
      return;
    }
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(day)) return;
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDateInModal(newDate);
  };

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const monthYearString = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const formattedDate = value.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const canGoNext = () => {
    const today = new Date();
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.getFullYear() < today.getFullYear() || 
           (nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() <= today.getMonth());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Date</Text>
      
      {/* Quick option buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[
            styles.button, 
            isToday(value) && styles.buttonSelected,
            { borderColor: isToday(value) ? colors.primary : colors.outlineVariant }
          ]}
          onPress={handleToday}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.buttonText,
            isToday(value) && { color: colors.primary }
          ]}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            isYesterday(value) && styles.buttonSelected,
            { borderColor: isYesterday(value) ? colors.primary : colors.outlineVariant }
          ]}
          onPress={handleYesterday}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.buttonText,
            isYesterday(value) && { color: colors.primary }
          ]}>Yesterday</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            !isToday(value) && !isYesterday(value) && styles.buttonSelected,
            { borderColor: !isToday(value) && !isYesterday(value) ? colors.primary : colors.outlineVariant }
          ]}
          onPress={handlePickDate}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.buttonText,
            !isToday(value) && !isYesterday(value) && { color: colors.primary }
          ]}>Pick Date</Text>
        </TouchableOpacity>
      </View>
      
      {/* Selected date display */}
      <Text style={styles.selectedDate}>{formattedDate}</Text>
      
      {error && <Text style={styles.error}>{error}</Text>}

      {/* Simple Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCalendar(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthYear}>{monthYearString}</Text>
              <TouchableOpacity 
                onPress={handleNextMonth} 
                style={styles.navButton}
                disabled={!canGoNext()}
              >
                <Text style={[
                  styles.navButtonText,
                  !canGoNext() && { opacity: 0.3 }
                ]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday headers */}
            <View style={styles.weekDaysRow}>
              {weekDays.map((day, index) => (
                <View key={index} style={styles.weekDayCell}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar days grid */}
            <View style={styles.calendarGrid}>
              {days.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const isSelected = isSameDay(
                  selectedDateInModal,
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                );
                const disabled = isDateDisabled(day);

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      disabled && styles.dayCellDisabled,
                    ]}
                    onPress={() => handleSelectDay(day)}
                    disabled={disabled}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        disabled && styles.dayTextDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowCalendar(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleConfirmDate}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSelected: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
  },
  selectedDate: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurface,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  error: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },

  // Calendar header
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.sm,
  },
  navButtonText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.onSurface,
  },
  monthYear: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.onSurface,
  },

  // Weekday headers
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekDayText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
  },

  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurface,
  },
  dayTextSelected: {
    color: colors.surface,
    fontWeight: typography.fontWeight.bold,
  },
  dayTextDisabled: {
    color: colors.onSurfaceVariant,
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.onSurfaceVariant,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.surface,
  },
});
