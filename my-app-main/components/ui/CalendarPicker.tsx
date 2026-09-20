// 1. React & React Native
import { useEffect, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface CalendarPickerProps {
  visible: boolean;
  initialDate?: string; // YYYY-MM-DD (Gregorian)
  onSelect: (dateStr: string) => void; // YYYY-MM-DD, or '' when cleared
  onClose: () => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function parseDate(str?: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((str || '').trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return { y, m, d };
}

function toDateStr(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

export default function CalendarPicker({ visible, initialDate, onSelect, onClose }: CalendarPickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11
  const [selected, setSelected] = useState<string>('');

  // Reset view every time the modal opens
  useEffect(() => {
    if (!visible) return;
    const parsed = parseDate(initialDate);
    if (parsed) {
      setViewYear(parsed.y);
      setViewMonth(parsed.m - 1);
      setSelected(toDateStr(parsed.y, parsed.m, parsed.d));
    } else {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      setSelected('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const goMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const pickDay = (day: number) => {
    const dateStr = toDateStr(viewYear, viewMonth + 1, day);
    setSelected(dateStr);
    onSelect(dateStr);
    onClose();
  };

  const handleClear = () => {
    setSelected('');
    onSelect('');
    onClose();
  };

  const handleToday = () => {
    const dateStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());
    setSelected(dateStr);
    onSelect(dateStr);
    onClose();
  };

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-lg border border-slate-200">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar" size={20} color="#DC2626" />
              <Text className="text-base font-bold text-slate-900 font-heading">เลือกวันที่</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="ปิดปฏิทิน">
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Month navigation */}
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              onPress={() => goMonth(-1)}
              className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              accessibilityLabel="เดือนก่อนหน้า"
            >
              <Ionicons name="chevron-back" size={18} color="#334155" />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToday} activeOpacity={0.7}>
              <Text className="text-sm font-bold text-slate-800 font-heading">
                {THAI_MONTHS[viewMonth]} {viewYear}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => goMonth(1)}
              className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              accessibilityLabel="เดือนถัดไป"
            >
              <Ionicons name="chevron-forward" size={18} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Weekday header */}
          <View className="flex-row mb-1">
            {WEEKDAYS.map((wd, i) => (
              <View key={i} className="flex-1 items-center py-1">
                <Text
                  className={`text-[11px] font-bold font-heading ${
                    i === 0 ? 'text-[#DC2626]' : 'text-slate-500'
                  }`}
                >
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View className="flex-row flex-wrap">
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`blank-${idx}`} className="w-[14.28%] aspect-square" />;
              }
              const dateStr = toDateStr(viewYear, viewMonth + 1, day);
              const isSelected = selected === dateStr;
              const isToday = todayStr === dateStr;
              const isSunday = new Date(viewYear, viewMonth, day).getDay() === 0;
              return (
                <View key={day} className="w-[14.28%] aspect-square items-center justify-center p-[2px]">
                  <TouchableOpacity
                    onPress={() => pickDay(day)}
                    className={`w-full h-full rounded-full items-center justify-center ${
                      isSelected ? 'bg-[#DC2626]' : isToday ? 'border border-[#DC2626]' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`text-[13px] ${
                        isSelected
                          ? 'text-white font-bold font-heading'
                          : isSunday
                            ? 'text-[#DC2626] font-body'
                            : 'text-slate-700 font-body'
                      }`}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Selected value */}
          <Text className="text-[11px] text-slate-500 font-body text-center mt-2">
            {selected ? `ที่เลือก: ${selected} (ค.ศ.)` : 'แตะวันที่เพื่อเลือก (ค.ศ. ตรงกับรูปแบบ YYYY-MM-DD)'}
          </Text>

          {/* Footer */}
          <View className="flex-row items-center gap-2 mt-3">
            <TouchableOpacity
              onPress={handleClear}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 items-center"
            >
              <Text className="text-xs font-bold text-slate-600 font-heading">ล้างค่า</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleToday}
              className="flex-1 py-2.5 rounded-xl bg-[#DC2626] items-center"
            >
              <Text className="text-xs font-bold text-white font-heading">วันนี้</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
