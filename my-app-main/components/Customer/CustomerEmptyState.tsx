// 1. React & React Native
import React from 'react';
import { View, Text } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface CustomerEmptyStateProps {
  isFiltered: boolean;
}

export default function CustomerEmptyState({ isFiltered }: CustomerEmptyStateProps) {
  return (
    <View className="bg-white rounded-3xl p-8 items-center justify-center border border-slate-200 mt-4 shadow-xs">
      <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
        <Ionicons name="document-text-outline" size={32} color="#94A3B8" />
      </View>
      <Text className="text-base font-bold text-slate-700 font-heading mb-1">
        ไม่พบรายการซ่อม
      </Text>
      <Text className="text-xs text-slate-400 font-body text-center max-w-xs leading-4">
        {isFiltered
          ? 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองสถานะ'
          : 'เมื่อคุณส่งอุปกรณ์ซ่อมกับทางร้าน รายการจะปรากฏที่นี่แบบเรียลไทม์'}
      </Text>
    </View>
  );
}
