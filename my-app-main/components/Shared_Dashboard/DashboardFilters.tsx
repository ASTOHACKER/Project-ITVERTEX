// 1. React & React Native
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';

// 3. Components
import DatePickerModal from '@/components/ui/DatePickerModal';

const typeData = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'คอมพิวเตอร์', value: 'pc' },
  { label: 'โน๊ตบุ๊ค', value: 'laptop' },
  { label: 'ปริ้นเตอร์', value: 'printer' },
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

function formatThaiDateDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10) + 543;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${THAI_MONTHS_SHORT[monthIdx] || ''} ${year}`;
}

function toYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DashboardFiltersProps {
  timeFilter: 'day' | 'month' | 'year';
  onChangeTimeFilter: (filter: 'day' | 'month' | 'year') => void;
  deviceType?: string;
  onChangeDeviceType?: (type: string) => void;
  dateStart?: string;
  dateEnd?: string;
  onChangeDateStart?: (val: string) => void;
  onChangeDateEnd?: (val: string) => void;
}

export default function DashboardFilters({
  timeFilter,
  onChangeTimeFilter,
  deviceType = 'all',
  onChangeDeviceType,
  dateStart = '',
  dateEnd = '',
  onChangeDateStart,
  onChangeDateEnd,
}: DashboardFiltersProps) {
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const timeButtons: { key: 'day' | 'month' | 'year'; label: string }[] = [
    { key: 'day', label: 'วัน' },
    { key: 'month', label: 'เดือน' },
    { key: 'year', label: 'ปี' },
  ];

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-xl border border-app-border">
      {/* Header & Time toggle */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="filter" size={16} color="#333333" />
          <Text className="text-sm font-bold text-text-dark font-heading">ตัวกรองกราฟแนวโน้ม</Text>
        </View>

        <View className="flex-row bg-bg rounded-lg p-0.5">
          {timeButtons.map((btn) => (
            <TouchableOpacity
              key={btn.key}
              className={`py-1 px-2.5 rounded-md ${timeFilter === btn.key ? 'bg-white shadow-sm' : ''}`}
              onPress={() => onChangeTimeFilter(btn.key)}
            >
              <Text
                className={`text-xs font-body ${timeFilter === btn.key ? 'text-text-dark font-bold font-heading' : 'text-text-light'}`}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Device type dropdown */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-xs text-text-light mb-1 font-medium font-body">ประเภทอุปกรณ์</Text>
          <Dropdown
            style={{
              height: 38,
              borderWidth: 1,
              borderColor: '#E9ECEF',
              borderRadius: 8,
              paddingHorizontal: 12,
              backgroundColor: '#F8F9FA',
            }}
            selectedTextStyle={{ fontSize: 13, color: '#333333', fontFamily: 'IBMPlexSansThai-Regular' }}
            itemTextStyle={{ fontSize: 13, color: '#333333', fontFamily: 'IBMPlexSansThai-Regular' }}
            containerStyle={{ borderRadius: 8, borderWidth: 1, borderColor: '#E9ECEF' }}
            data={typeData}
            maxHeight={200}
            labelField="label"
            valueField="value"
            value={deviceType}
            onChange={(item) => {
              onChangeDeviceType?.(item.value);
            }}
          />
        </View>
      </View>

      {/* Date range pickers */}
      <View className="mt-3">
        <Text className="text-xs text-text-light mb-1 font-medium font-body">ช่วงเวลา</Text>
        <View className="flex-row items-center justify-between">
          {/* Start Date */}
          <TouchableOpacity
            className="flex-1 flex-row items-center border border-app-border rounded-lg px-2.5 bg-bg h-[38px]"
            onPress={() => setActivePicker('start')}
          >
            <Ionicons name="calendar-outline" size={16} color="#888888" style={{ marginRight: 6 }} />
            <Text
              numberOfLines={1}
              className={`flex-1 text-[13px] font-body ${dateStart ? 'text-text-dark font-medium' : 'text-[#888888]'}`}
            >
              {dateStart ? formatThaiDateDisplay(dateStart) : 'เริ่มต้น'}
            </Text>
            {Boolean(dateStart) && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onChangeDateStart?.('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={14} color="#999999" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <Text className="mx-2.5 text-[13px] text-text-light">ถึง</Text>

          {/* End Date */}
          <TouchableOpacity
            className="flex-1 flex-row items-center border border-app-border rounded-lg px-2.5 bg-bg h-[38px]"
            onPress={() => setActivePicker('end')}
          >
            <Ionicons name="calendar-outline" size={16} color="#888888" style={{ marginRight: 6 }} />
            <Text
              numberOfLines={1}
              className={`flex-1 text-[13px] font-body ${dateEnd ? 'text-text-dark font-medium' : 'text-[#888888]'}`}
            >
              {dateEnd ? formatThaiDateDisplay(dateEnd) : 'สิ้นสุด'}
            </Text>
            {Boolean(dateEnd) && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onChangeDateEnd?.('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={14} color="#999999" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* DatePickerModal for Start Date */}
      <DatePickerModal
        visible={activePicker === 'start'}
        selectedDate={dateStart ? new Date(dateStart) : null}
        title="เลือกวันที่เริ่มต้น"
        onSelectDate={(date) => {
          if (date) {
            onChangeDateStart?.(toYYYYMMDD(date));
          } else {
            onChangeDateStart?.('');
          }
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

      {/* DatePickerModal for End Date */}
      <DatePickerModal
        visible={activePicker === 'end'}
        selectedDate={dateEnd ? new Date(dateEnd) : null}
        title="เลือกวันที่สิ้นสุด"
        onSelectDate={(date) => {
          if (date) {
            onChangeDateEnd?.(toYYYYMMDD(date));
          } else {
            onChangeDateEnd?.('');
          }
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />
    </View>
  );
}
