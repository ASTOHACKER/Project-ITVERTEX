// 1. React & React Native
import React from 'react';
import { Text, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface MetricCardsProps {
  totalRevenue?: number;
  totalJobs?: number;
  completedJobs?: number;
  pendingJobs?: number;
}

export default function MetricCards({
  totalRevenue = 0,
  totalJobs = 0,
  completedJobs = 0,
  pendingJobs = 0,
}: MetricCardsProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  const metrics = [
    {
      title: 'รายได้รวม',
      value: formatCurrency(totalRevenue),
      icon: 'cash',
      color: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FEE2E2',
    },
    {
      title: 'งานซ่อมทั้งหมด',
      value: totalJobs.toLocaleString(),
      icon: 'cube',
      color: '#0284C7',
      bgColor: '#F0F9FF',
      borderColor: '#E0F2FE',
    },
    {
      title: 'ซ่อมสำเร็จแล้ว',
      value: completedJobs.toLocaleString(),
      icon: 'checkmark-done-circle',
      color: '#16A34A',
      bgColor: '#F0FDF4',
      borderColor: '#DCFCE7',
    },
    {
      title: 'รอดำเนินการ',
      value: pendingJobs.toLocaleString(),
      icon: 'time',
      color: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FEF3C7',
    },
  ];

  return (
    <View className="flex-row flex-wrap mx-4 justify-between">
      {metrics.map((item, index) => (
        <View
          key={index}
          className="w-[48%] bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4"
        >
          <View className="flex-row justify-between items-center mb-2.5">
            <Text className="text-xs text-slate-500 font-heading font-medium" numberOfLines={1}>
              {item.title}
            </Text>
            <View
              className="w-8 h-8 rounded-xl items-center justify-center border"
              style={{ backgroundColor: item.bgColor, borderColor: item.borderColor }}
            >
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
          </View>
          <Text className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
