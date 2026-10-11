import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuotationEmptyStateProps {
  searchQuery: string;
  activeFilter: string;
}

export default function QuotationEmptyState({
  searchQuery,
  activeFilter,
}: QuotationEmptyStateProps) {
  return (
    <View className="items-center justify-center py-24 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
        <Ionicons name="document-text-outline" size={32} color="#94a3b8" />
      </View>
      <Text className="text-base font-bold text-slate-700 font-heading text-center">
        ไม่พบรายการใบเสนอราคา
      </Text>
      <Text className="text-xs text-slate-400 font-body text-center mt-1">
        {searchQuery || activeFilter !== 'all'
          ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ'
          : 'ยังไม่มีการสร้างใบเสนอราคาในระบบ'}
      </Text>
    </View>
  );
}
