// 1. React & React Native
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  onClose: () => void;
  title?: string;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function DatePickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
  title = 'เลือกวันที่ต้องการกรอง',
}: DatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Calendar cells calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(year, month - 1, d),
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Trailing days from next month to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return days;
  }, [year, month]);

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isToday = (d: Date) => {
    const now = new Date();
    return isSameDay(now, d);
  };

  const handleSelectDay = (d: Date) => {
    onSelectDate(d);
    onClose();
  };

  const handleClear = () => {
    onSelectDate(null);
    onClose();
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(now);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className="w-full max-w-[360px] bg-white rounded-3xl p-5 shadow-2xl shadow-black/20 elevation-10">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar" size={20} color="#D32F2F" />
              <Text className="text-base font-bold text-slate-800">{title}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 justify-center items-center"
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-3 px-1">
            <TouchableOpacity
              onPress={prevMonth}
              className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center active:bg-slate-200"
            >
              <Ionicons name="chevron-back" size={18} color="#334155" />
            </TouchableOpacity>
            <Text className="text-sm font-bold text-slate-800">
              {THAI_MONTHS[month]} {year + 543}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center active:bg-slate-200"
            >
              <Ionicons name="chevron-forward" size={18} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View className="flex-row justify-between mb-2 px-1">
            {DAYS_SHORT.map((day, idx) => (
              <View key={idx} className="flex-1 items-center">
                <Text
                  className={`text-[12px] font-semibold ${
                    idx === 0 ? 'text-red-500' : 'text-slate-400'
                  }`}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Day Grid */}
          <View className="flex-row flex-wrap">
            {calendarDays.map((item, idx) => {
              const selected = isSameDay(selectedDate, item.date);
              const today = isToday(item.date);

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectDay(item.date)}
                  activeOpacity={0.7}
                  style={{ width: `${100 / 7}%` }}
                  className="aspect-square p-1 items-center justify-center"
                >
                  <View
                    className={`w-9 h-9 rounded-xl items-center justify-center ${
                      selected
                        ? 'bg-[#D32F2F] shadow-sm shadow-red-300'
                        : today
                        ? 'bg-red-50 border border-red-300'
                        : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        selected
                          ? 'font-bold text-white'
                          : !item.isCurrentMonth
                          ? 'text-slate-300'
                          : today
                          ? 'font-bold text-red-600'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      {item.day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Actions Footer */}
          <View className="flex-row items-center justify-between pt-4 mt-2 border-t border-slate-100">
            <TouchableOpacity
              onPress={handleClear}
              className="px-3 py-2 rounded-xl bg-slate-100 active:bg-slate-200"
            >
              <Text className="text-xs font-semibold text-slate-600">
                ล้างตัวกรอง
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToday}
              className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 active:bg-red-100"
            >
              <Text className="text-xs font-bold text-red-700">
                เลือกวันนี้
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
