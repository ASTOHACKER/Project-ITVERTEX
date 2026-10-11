import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InvoiceSummaryCardProps {
  displayJobNo: string;
  customerName?: string;
  appointmentDate?: string | null;
  formattedAmount: string;
  formatDate: (dateStr: string | null) => string;
  isCancelled?: boolean;
}

export default function InvoiceSummaryCard({
  displayJobNo,
  customerName,
  appointmentDate,
  formattedAmount,
  formatDate,
  isCancelled = false,
}: InvoiceSummaryCardProps) {
  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-slate-800 font-bold font-heading text-base">สรุปใบแจ้งหนี้</Text>
        <View className="flex-row items-center gap-1.5">
          {isCancelled && (
            <View className="px-2.5 py-0.5 bg-amber-50 rounded-full border border-amber-200">
              <Text className="text-amber-700 font-bold text-xs font-heading">ขอยกเลิกซ่อม</Text>
            </View>
          )}
          <View className="px-2.5 py-0.5 bg-red-50 rounded-full border border-red-200">
            <Text className="text-[#D32F2F] font-bold text-xs font-heading">{displayJobNo}</Text>
          </View>
        </View>
      </View>

      {customerName ? (
        <View className="flex-row justify-between items-center py-2 border-b border-slate-100">
          <Text className="text-slate-500 text-xs font-body">ชื่อลูกค้า</Text>
          <Text className="text-slate-800 font-bold text-xs font-body">{customerName}</Text>
        </View>
      ) : null}

      <View className="flex-row justify-between items-center py-2 border-b border-slate-100">
        <Text className="text-slate-500 text-xs font-body">ประเภทรายการ</Text>
        <Text className={`font-bold text-xs font-body ${isCancelled ? 'text-amber-800' : 'text-slate-800'}`}>
          {isCancelled ? 'ค่าบริการตรวจเช็คสภาพเครื่อง (ยกเลิกซ่อม)' : 'ค่าบริการซ่อมแซมและอะไหล่'}
        </Text>
      </View>

      <View className="py-2 border-b border-slate-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-slate-500 text-xs font-body">กำหนดวันรับเครื่อง</Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
            <Text className="text-slate-800 font-bold text-xs font-body">
              {formatDate(appointmentDate ?? null)}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row justify-between items-center pt-3">
        <View>
          <Text className="text-slate-800 font-bold font-heading text-base">
            {isCancelled ? 'ยอดชำระสุทธิ (ค่าตรวจเช็ค)' : 'ยอดรวมสุทธิ'}
          </Text>
          {isCancelled && (
            <Text className="text-[10.5px] text-amber-600 font-body">
              * ชำระเฉพาะค่าตรวจเช็คตามเงื่อนไขการยกเลิกซ่อม
            </Text>
          )}
        </View>
        <Text className={`font-bold font-heading text-xl ${isCancelled ? 'text-amber-600' : 'text-red-600'}`}>
          {formattedAmount} บาท
        </Text>
      </View>
    </View>
  );
}
