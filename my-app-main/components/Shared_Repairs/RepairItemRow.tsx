// 1. React & React Native
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

// 3. Types
import type { RepairItem } from './types';

interface RepairItemRowProps {
  item: RepairItem;
  statusColor?: string;
  showQuoteBtn?: boolean;
  showHandoverBtn?: boolean;
  showPaymentCheckBtn?: boolean;
  onPressDetails?: (item: RepairItem) => void;
  onPressMakeQuote?: (item: RepairItem) => void;
  onPressHandover?: (item: RepairItem) => void;
  onPressPaymentCheck?: (item: RepairItem) => void;
}

export default function RepairItemRow({
  item,
  statusColor = '#D32F2F',
  showQuoteBtn = false,
  showHandoverBtn = false,
  showPaymentCheckBtn = false,
  onPressDetails,
  onPressMakeQuote,
  onPressHandover,
  onPressPaymentCheck,
}: RepairItemRowProps) {
  const displayDevice =
    [item.brand, item.model].filter(Boolean).join(' ') ||
    item.device ||
    item.device_type ||
    'ไม่ระบุอุปกรณ์';

  const displaySymptom =
    item.actual_symptom ||
    item.symptom ||
    item.symptoms ||
    item.symptom_details ||
    'ไม่ระบุอาการเสีย';

  // Device icon helper
  const getDeviceIcon = () => {
    const type = (item.device_type || '').toLowerCase();
    if (type.includes('printer') || type.includes('พิมพ์')) {
      return 'print-outline';
    }
    if (type.includes('pc') || type.includes('desktop') || type.includes('คอม')) {
      return 'desktop-outline';
    }
    return 'laptop-outline';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPressDetails?.(item)}
      className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 shadow-sm shadow-black/5 elevation-2"
    >
      {/* Top Header: Job ID & Status Badge */}
      <View className="flex-row items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
        <View className="flex-row items-center gap-1.5">
          {/* <View className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 items-center justify-center">
            <Ionicons name="build" size={12} color="#D32F2F" />
          </View> */}
          <Text className="text-sm font-bold text-slate-800 font-heading tracking-wide">
            {item.job_no}
          </Text>
        </View>

        {/* Status Pill Badge */}
        {item.status && (
          <View
            className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
            style={{ backgroundColor: `${statusColor}15` }}
          >
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            <Text
              className="text-xs font-bold"
              style={{ color: statusColor }}
            >
              {item.status}
            </Text>
          </View>
        )}
      </View>

      {/* Main Info: Device Title */}
      <View className="flex-row items-center gap-2 mb-2">
        {/* <Ionicons name={getDeviceIcon() as any} size={18} color="#0284C7" /> */}
        <Text
          className="text-[15px] font-bold text-slate-900 flex-1 font-heading"
          numberOfLines={1}
        >
          {displayDevice}
        </Text>
      </View>

      {/* Customer Name & Phone in one clean line */}
      <View className="flex-row items-center gap-3 mb-2.5 px-0.5">
        <View className="flex-row items-center gap-1.5 flex-1">
          <Ionicons name="person-outline" size={13} color="#64748B" />
          <Text
            className={`text-xs font-body ${
              item.customer_name && item.customer_name !== 'ไม่ระบุชื่อ'
                ? 'font-medium text-slate-700'
                : 'text-slate-400 italic'
            }`}
            numberOfLines={1}
          >
            {item.customer_name && item.customer_name !== 'ไม่ระบุชื่อ'
              ? item.customer_name
              : 'ลูกค้าทั่วไป'}
          </Text>
        </View>

        {Boolean(item.phone && item.phone !== '-' && item.phone !== 'ไม่ระบุเบอร์') && (
          <View className="flex-row items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
            <Ionicons name="call-outline" size={11} color="#64748B" />
            <Text className="text-xs font-body text-slate-600">
              {item.phone}
            </Text>
          </View>
        )}
      </View>

      {/* Symptom Bubble (Easy to read at a glance) */}
      <View className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mb-3">
        <View className="flex-row items-start gap-1.5">
          <Ionicons name="alert-circle-outline" size={14} color="#D97706" style={{ marginTop: 2 }} />
          <Text
            className="text-xs text-slate-600 flex-1 leading-4 font-body"
            numberOfLines={2}
          >
            <Text className="font-bold text-slate-700 font-heading">อาการ: </Text>
            {displaySymptom}
          </Text>
        </View>
      </View>

      {/* Footer Row: Date / Price & Action Button */}
      <View className="flex-row items-center justify-between pt-1">
        {/* Left: Date or Price */}
        <View className="flex-col">
          {(item.total_amount && Number(item.total_amount) > 0) || (item.price && Number(item.price) > 0) ? (
            <View className="flex-row items-baseline gap-1">
              <Text className="text-xs text-slate-500 font-body">ยอดค่าซ่อม:</Text>
              <Text className="text-base font-bold text-[#D32F2F] font-heading">
                ฿{Number(item.total_amount || item.price).toLocaleString()}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
              <Text className="text-xs text-slate-400 font-body">
                {item.date && item.date !== '-' ? item.date : 'รอประเมินราคา'}
              </Text>
            </View>
          )}
        </View>

        {/* Right: Quick Action Buttons */}
        <View className="flex-row items-center gap-2">
          {/* Specific status actions */}
          {showHandoverBtn && (
            <TouchableOpacity
              onPress={() => onPressHandover?.(item)}
              activeOpacity={0.8}
              className="flex-row items-center gap-1 bg-amber-500 px-3 py-1.5 rounded-xl shadow-sm"
            >
              <Ionicons name="create-outline" size={13} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white font-heading">ส่งมอบ</Text>
            </TouchableOpacity>
          )}

          {showPaymentCheckBtn && (
            <TouchableOpacity
              onPress={() => onPressPaymentCheck?.(item)}
              activeOpacity={0.8}
              className="flex-row items-center gap-1 bg-emerald-600 px-3 py-1.5 rounded-xl shadow-sm"
            >
              <Ionicons name="card-outline" size={13} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white font-heading">ตรวจชำระ</Text>
            </TouchableOpacity>
          )}

          {showQuoteBtn && (
            <TouchableOpacity
              onPress={() => onPressMakeQuote?.(item)}
              activeOpacity={0.8}
              className="flex-row items-center gap-1 bg-sky-600 px-3 py-1.5 rounded-xl shadow-sm"
            >
              <Ionicons name="receipt-outline" size={13} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white font-heading">ใบเสนอราคา</Text>
            </TouchableOpacity>
          )}

          {/* Primary View Details Button */}
          <TouchableOpacity
            onPress={() => onPressDetails?.(item)}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl active:bg-red-100"
          >
            <Text className="text-xs font-bold text-[#D32F2F] font-heading">ดูรายละเอียด</Text>
            <Ionicons name="chevron-forward" size={12} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
