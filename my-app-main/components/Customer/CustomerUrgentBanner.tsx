// 1. React & React Native
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import type { RepairJob } from '@/types/repair';

interface CustomerUrgentBannerProps {
  job: RepairJob;
  onPress: (jobId: string | number) => void;
}

export default function CustomerUrgentBanner({ job, onPress }: CustomerUrgentBannerProps) {
  const targetId = job.id || job.job_id || '';
  const jobNo = job.job_no || job.job_number || `REP-${targetId}`;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(targetId)}
      className="mb-3 bg-purple-900 border border-purple-400/40 p-4 rounded-2xl flex-row items-center justify-between shadow-sm"
    >
      <View className="flex-row items-center gap-3 flex-1 mr-2">
        <View className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 items-center justify-center">
          <Ionicons name="receipt" size={20} color="#E9D5FF" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 mb-0.5">
            <View className="w-2 h-2 rounded-full bg-amber-400" />
            <Text className="text-amber-300 font-bold text-xs font-heading">
              ต้องการการอนุมัติจากคุณ
            </Text>
          </View>
          <Text className="text-white text-xs font-body" numberOfLines={1}>
            งาน {jobNo} มีใบเสนอราคาพร้อมให้ตรวจสอบ
          </Text>
        </View>
      </View>
      <View className="bg-purple-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
        <Text className="text-white text-xs font-bold font-heading">ตรวจดู</Text>
        <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}
