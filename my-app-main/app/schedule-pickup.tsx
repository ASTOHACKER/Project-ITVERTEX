// 1. React & React Native
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API
import { getRepair } from '@/lib/api';

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

export default function SchedulePickupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    jobId?: string;
    id?: string;
    amount?: string;
    pickupDate?: string;
    appointmentDate?: string;
  }>();

  const targetJobId = params.jobId || params.id;
  const initialDateStr = params.pickupDate || params.appointmentDate;

  const [loading, setLoading] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<string | null>(initialDateStr || null);
  const [jobInfo, setJobInfo] = useState<any>(null);

  // Load repair job data if appointmentDate is not provided directly
  useEffect(() => {
    async function loadData() {
      if (!targetJobId) return;
      try {
        setLoading(true);
        const res = await getRepair(targetJobId);
        if (res.success && res.data) {
          setJobInfo(res.data);
          if (res.data.appointment_date) {
            setAppointmentDate(res.data.appointment_date);
          }
        }
      } catch (err) {
        console.error('Error fetching job in schedule-pickup:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetJobId]);

  // Target Date object
  const targetDate = useMemo(() => {
    if (!appointmentDate || appointmentDate === 'null' || appointmentDate === 'undefined') {
      return null;
    }
    const d = new Date(appointmentDate);
    return isNaN(d.getTime()) ? null : d;
  }, [appointmentDate]);

  const today = useMemo(() => new Date(), []);

  // Calendar month state (defaults to target date's month or current month)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (targetDate) {
      return new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
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

  const formattedPickupDateText = useMemo(() => {
    if (!targetDate) return 'ยังไม่ได้ระบุวันนัดรับเครื่อง';
    const dayName = THAI_DAYS_OF_WEEK[targetDate.getDay()];
    const dateNum = targetDate.getDate();
    const monthName = THAI_MONTHS[targetDate.getMonth()];
    const thaiYear = targetDate.getFullYear() + 543;
    return `${dayName}ที่ ${dateNum} ${monthName} ${thaiYear}`;
  }, [targetDate]);

  const isViewingDifferentMonth = targetDate && (
    currentMonth.getFullYear() !== targetDate.getFullYear() ||
    currentMonth.getMonth() !== targetDate.getMonth()
  );

  const displayJobNo = jobInfo?.job_number || (targetJobId ? `REP-${String(targetJobId).padStart(6, '0')}` : '');

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="light" backgroundColor="#D32F2F" />

      {/* Header */}
      <View className="bg-[#D32F2F] pt-4 pb-6 px-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-lg font-bold font-heading">ปฏิทินกำหนดวันรับเครื่อง</Text>
          {displayJobNo ? (
            <Text className="text-red-100 text-xs font-body">{displayJobNo}</Text>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text className="text-xs text-slate-500 font-body mt-2">กำลังโหลดข้อมูลปฏิทิน...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 -mt-4" contentContainerClassName="p-4 pb-32">
          
          {/* Main Calendar Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-base font-bold text-slate-800 font-heading">
                กำหนดวันที่สามารถมารับเครื่อง
              </Text>
              <View className="bg-red-50 px-2.5 py-1 rounded-full border border-red-200 flex-row items-center">
                <Ionicons name="calendar-outline" size={13} color="#D32F2F" style={{ marginRight: 4 }} />
                <Text className="text-xs font-bold text-[#D32F2F]">ปฏิทิน</Text>
              </View>
            </View>
            <Text className="text-xs text-slate-500 font-body mb-4">
              ลูกค้าสามารถมารับอุปกรณ์ได้ตั้งแต่วันที่ไฮไลท์เป็นต้นไป
            </Text>

            {/* Calendar Navigation */}
            <View className="flex-row justify-between items-center mb-4 bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-100">
              <TouchableOpacity
                onPress={handlePrevMonth}
                className="w-8 h-8 rounded-lg items-center justify-center bg-white shadow-xs active:bg-slate-100"
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
                className="w-8 h-8 rounded-lg items-center justify-center bg-white shadow-xs active:bg-slate-100"
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
                  return <View key={`empty-${idx}`} className="w-[13%] aspect-square mb-2" />;
                }

                const isPickup = targetDate ? isSameDay(date, targetDate) : false;
                const isCurrentDay = isSameDay(date, today);
                const isSunday = date.getDay() === 0;

                return (
                  <View
                    key={`day-${date.toISOString()}`}
                    className="w-[13%] aspect-square items-center justify-center mb-2"
                  >
                    <View
                      className={`w-10 h-10 items-center justify-center rounded-2xl ${
                        isPickup
                          ? 'bg-[#D32F2F] shadow-md shadow-red-500/40'
                          : isCurrentDay
                          ? 'bg-red-50 border-2 border-red-300'
                          : isSunday
                          ? 'bg-slate-50/60'
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

                    {/* Indicator Dot */}
                    {isPickup && (
                      <View className="w-1.5 h-1.5 rounded-full bg-[#D32F2F] mt-1" />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Color Legend */}
            <View className="flex-row items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100">
              <View className="flex-row items-center">
                <View className="w-3.5 h-3.5 rounded-md bg-[#D32F2F] mr-1.5" />
                <Text className="text-xs text-slate-600 font-body font-medium">วันนัดรับเครื่อง</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3.5 h-3.5 rounded-md bg-red-50 border border-red-300 mr-1.5" />
                <Text className="text-xs text-slate-600 font-body font-medium">วันนี้</Text>
              </View>
            </View>
          </View>

          {/* Pickup Details Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
            <Text className="text-sm font-bold text-slate-800 font-heading mb-3">
              ข้อมูลสถานที่และเวลารับเครื่อง
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-start py-2 border-b border-slate-100">
                <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center mr-3 border border-red-100 mt-0.5">
                  <Ionicons name="calendar" size={16} color="#D32F2F" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500 font-body">กำหนดวันที่รับเครื่อง</Text>
                  <Text className="text-sm font-bold text-slate-800 font-heading">
                    {formattedPickupDateText}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start py-2 border-b border-slate-100">
                <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3 border border-blue-100 mt-0.5">
                  <Ionicons name="time" size={16} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500 font-body">เวลาเปิดทำการ</Text>
                  <Text className="text-sm font-bold text-slate-800 font-heading">
                    วันจันทร์ - เสาร์ 09:00 - 18:00 น.
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-body mt-0.5">
                    (ปิดให้บริการทุกวันอาทิตย์และวันหยุดนักขัตฤกษ์)
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start py-2">
                <View className="w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center mr-3 border border-emerald-100 mt-0.5">
                  <Ionicons name="location" size={16} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-500 font-body">สถานที่รับเครื่อง</Text>
                  <Text className="text-sm font-bold text-slate-800 font-heading">
                    ศูนย์บริการ IT Vertex Service
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-body mt-0.5">
                    กรุณาติดต่อที่เคาน์เตอร์บริการเพื่อตรวจสอบสภาพเครื่องและรับเครื่องคืน
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Advice Notice */}
          <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex-row items-start">
            <Ionicons name="alert-circle" size={20} color="#d97706" style={{ marginRight: 8, marginTop: 1 }} />
            <View className="flex-1">
              <Text className="text-xs font-bold text-amber-900 font-heading">ข้อแนะนำในการรับเครื่อง</Text>
              <Text className="text-[11px] text-amber-800 font-body mt-1 leading-4">
                • นำรหัสงานซ่อม ({displayJobNo || 'REP-XXXXXX'}) มาแจ้งแก่เจ้าหน้าที่{'\n'}
                • ตรวจสอบสภาพอุปกรณ์และการทำงานร่วมกับช่างก่อนลงชื่อรับเครื่อง{'\n'}
                • หากไม่สะดวกมารับตามวันเวลาดังกล่าว สามารถติดต่อร้านล่วงหน้าได้
              </Text>
            </View>
          </View>

        </ScrollView>
      )}

      {/* Bottom Floating Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-8 flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center active:bg-slate-200"
        >
          <Text className="text-slate-700 font-bold font-heading text-sm">ย้อนกลับ</Text>
        </TouchableOpacity>

        {targetJobId && (
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/verify-payment',
                params: {
                  jobId: String(targetJobId),
                  job_no: displayJobNo,
                  amount: params.amount || String(jobInfo?.total_amount || ''),
                  pickupDate: appointmentDate || '',
                },
              });
            }}
            className="flex-1 bg-[#D32F2F] py-3.5 rounded-2xl items-center justify-center shadow-sm active:opacity-90 flex-row gap-1.5"
          >
            <Ionicons name="card-outline" size={18} color="#ffffff" />
            <Text className="text-white font-bold font-heading text-sm">แจ้งชำระเงิน</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
