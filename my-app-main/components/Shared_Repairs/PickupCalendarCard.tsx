// 1. React & React Native
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface PickupCalendarCardProps {
  appointmentDate?: string | null;
  defaultExpanded?: boolean;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS_OF_WEEK = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ',
  'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
];

const DAYS_OF_WEEK_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function PickupCalendarCard({
  appointmentDate,
  defaultExpanded = false,
}: PickupCalendarCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Parse appointment date safely
  const targetDate = useMemo(() => {
    if (!appointmentDate || appointmentDate === 'null' || appointmentDate === 'undefined') {
      return null;
    }
    const d = new Date(appointmentDate);
    return isNaN(d.getTime()) ? null : d;
  }, [appointmentDate]);

  // Calendar navigation state (defaults to target date's month or current month)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (targetDate) {
      return new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = useMemo(() => new Date(), []);

  // Update currentMonth if targetDate changes
  React.useEffect(() => {
    if (targetDate) {
      setCurrentMonth(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    }
  }, [targetDate]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleResetToTarget = () => {
    if (targetDate) {
      setCurrentMonth(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    } else {
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Formatted date string in Thai
  const formattedPickupDateText = useMemo(() => {
    if (!targetDate) return 'ยังไม่ได้กำหนดวันรับเครื่อง';
    const dayName = THAI_DAYS_OF_WEEK[targetDate.getDay()];
    const dateNum = targetDate.getDate();
    const monthName = THAI_MONTHS[targetDate.getMonth()];
    const thaiYear = targetDate.getFullYear() + 543;
    return `${dayName}ที่ ${dateNum} ${monthName} ${thaiYear}`;
  }, [targetDate]);

  // Is viewing different month than the appointment?
  const isViewingDifferentMonth = targetDate && (
    currentMonth.getFullYear() !== targetDate.getFullYear() ||
    currentMonth.getMonth() !== targetDate.getMonth()
  );

  return (
    <View className="bg-white rounded-2xl mb-4 shadow-sm border border-slate-100 overflow-hidden relative z-0">
      {/* Header Bar */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsExpanded(!isExpanded)}
        className="p-4 flex-row items-center justify-between bg-slate-50/70 border-b border-slate-100"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 rounded-xl bg-red-100/70 items-center justify-center mr-3 border border-red-200">
            <Ionicons name="calendar" size={20} color="#D32F2F" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-xs text-slate-500 font-body mr-2">กำหนดวันรับเครื่อง</Text>
              <View className="bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                <Text className="text-[10px] font-bold text-red-700">ดูปฏิทิน</Text>
              </View>
            </View>
            <Text className="text-sm font-bold text-slate-800 font-heading mt-0.5" numberOfLines={1}>
              {formattedPickupDateText}
            </Text>
          </View>
        </View>

        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#64748b"
        />
      </TouchableOpacity>

      {/* Calendar Body */}
      {isExpanded && (
        <View className="p-4">
          {/* Month Navigation */}
          <View className="flex-row justify-between items-center mb-3">
            <TouchableOpacity
              onPress={handlePrevMonth}
              className="w-8 h-8 rounded-lg items-center justify-center bg-slate-100 active:bg-slate-200"
            >
              <Ionicons name="chevron-back" size={18} color="#475569" />
            </TouchableOpacity>

            <View className="items-center">
              <Text className="font-bold font-heading text-slate-800 text-sm">
                {THAI_MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
              </Text>
              {isViewingDifferentMonth && (
                <TouchableOpacity onPress={handleResetToTarget} className="mt-0.5">
                  <Text className="text-[11px] text-red-600 font-bold underline font-body">
                    กลับไปเดือนที่นัดรับเครื่อง
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handleNextMonth}
              className="w-8 h-8 rounded-lg items-center justify-center bg-slate-100 active:bg-slate-200"
            >
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View className="flex-row justify-between mb-2 pb-1 border-b border-slate-100">
            {DAYS_OF_WEEK_SHORT.map((day, idx) => (
              <View key={idx} className="w-[13%] items-center">
                <Text
                  className={`text-xs font-bold font-heading ${
                    idx === 0 ? 'text-red-500' : 'text-slate-400'
                  }`}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap justify-between">
            {calendarDays.map((date, idx) => {
              if (!date) {
                return <View key={`empty-${idx}`} className="w-[13%] aspect-square mb-1.5" />;
              }

              const isPickup = targetDate ? isSameDay(date, targetDate) : false;
              const isCurrentDay = isSameDay(date, today);
              const isSunday = date.getDay() === 0;

              return (
                <View
                  key={`day-${date.toISOString()}`}
                  className="w-[13%] aspect-square items-center justify-center mb-1.5"
                >
                  <View
                    className={`w-9 h-9 items-center justify-center rounded-xl ${
                      isPickup
                        ? 'bg-[#D32F2F] shadow-sm shadow-red-500/50'
                        : isCurrentDay
                        ? 'bg-red-50 border border-red-300'
                        : isSunday
                        ? 'bg-slate-50/50'
                        : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`font-heading text-xs ${
                        isPickup
                          ? 'text-white font-bold text-sm'
                          : isCurrentDay
                          ? 'text-red-600 font-bold'
                          : isSunday
                          ? 'text-red-400'
                          : 'text-slate-700 font-medium'
                      }`}
                    >
                      {date.getDate()}
                    </Text>
                  </View>

                  {/* Little indicator dot under pickup day */}
                  {isPickup && (
                    <View className="w-1 h-1 rounded-full bg-[#D32F2F] mt-0.5" />
                  )}
                </View>
              );
            })}
          </View>

          {/* Legend and Pickup Information Box */}
          <View className="mt-3 pt-3 border-t border-slate-100">
            {/* Color Legend */}
            <View className="flex-row items-center justify-center gap-4 mb-3">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-[#D32F2F] mr-1.5" />
                <Text className="text-[11px] text-slate-600 font-body">วันนัดรับเครื่อง</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-red-50 border border-red-300 mr-1.5" />
                <Text className="text-[11px] text-slate-600 font-body">วันนี้</Text>
              </View>
            </View>

            {/* Info Card */}
            <View className="bg-red-50/60 rounded-xl p-3 border border-red-100">
              <View className="flex-row items-start mb-1.5">
                <Ionicons name="information-circle" size={16} color="#D32F2F" style={{ marginRight: 6, marginTop: 1 }} />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-red-950 font-heading">
                    สามารถมารับเครื่องได้ในวันที่ {formattedPickupDateText}
                  </Text>
                  <Text className="text-[11px] text-red-800/80 font-body mt-0.5 leading-4">
                    เปิดให้บริการวันจันทร์ - เสาร์ เวลา 09:00 - 18:00 น. (หยุดวันอาทิตย์)
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-1 pt-1.5 border-t border-red-100/80">
                <Ionicons name="location-outline" size={13} color="#b91c1c" style={{ marginRight: 4 }} />
                <Text className="text-[11px] text-red-900 font-body">
                  สถานที่: หน้าร้าน IT Vertex Service Center
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
