// components/ui/CalendarPicker.tsx
import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarPickerProps {
  visible: boolean;
  initialDate?: string;
  onSelect: (dateString: string) => void;
  onClose: () => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarPicker({ visible, initialDate, onSelect, onClose }: CalendarPickerProps) {
  const init = useMemo(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [initialDate]);

  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    initialDate ? init.getDate() : null
  );

  const totalDays = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstDow }, (_, i) => i);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleConfirm = () => {
    if (selectedDay == null) return;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    onSelect(`${year}-${mm}-${dd}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={prev} style={styles.arrowBtn}>
              <Ionicons name="chevron-back" size={22} color="#334155" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {THAI_MONTHS[month]} {year + 543}
            </Text>
            <TouchableOpacity onPress={next} style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={22} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Day-of-week labels */}
          <View style={styles.row}>
            {DAYS_SHORT.map(d => (
              <View key={d} style={styles.cell}>
                <Text style={styles.dowLabel}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.grid}>
            {blanks.map(i => (
              <View key={`b-${i}`} style={styles.cell} />
            ))}
            {days.map(day => {
              const sel = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.cell, sel && styles.selectedCell]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayText, sel && styles.selectedDayText]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.confirmBtn, !selectedDay && { opacity: 0.4 }]}
              disabled={!selectedDay}
            >
              <Text style={styles.confirmText}>ยืนยัน</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CELL_SIZE = (Dimensions.get('window').width - 80) / 7;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  arrowBtn: { padding: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dowLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  dayText: { fontSize: 14, color: '#334155' },
  selectedCell: { backgroundColor: '#DC2626', borderRadius: 999 },
  selectedDayText: { color: '#fff', fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#DC2626',
  },
  confirmText: { fontSize: 14, color: '#fff', fontWeight: '700' },
});
