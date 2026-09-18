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

interface MetricCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  borderColor: string;
}

function MetricCard({ title, value, icon, color, bgColor, borderColor }: MetricCardProps) {
  return (
    <View
      className="relative mb-3 min-h-[112px] w-[48.5%] rounded-3xl border bg-white px-4 py-4"
      style={{ borderColor }}
    >
      <View
        className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full"
        style={{ backgroundColor: color }}
      />

      <View className="flex-row items-start justify-between gap-2">
        <Text
          className="flex-1 pt-1 font-heading text-xs font-medium text-slate-500"
          numberOfLines={1}
        >
          {title}
        </Text>
        <View
          className="h-9 w-9 items-center justify-center rounded-2xl border"
          style={{ backgroundColor: bgColor, borderColor }}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>
      </View>

      <Text className="mt-4 font-heading text-[27px] font-bold tracking-tight text-slate-900">
        {value}
      </Text>
    </View>
  );
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

  const metrics: MetricCardProps[] = [
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
    <View className="mx-4 flex-row flex-wrap justify-between">
      {metrics.map((item) => (
        <MetricCard key={item.title} {...item} />
      ))}
    </View>
  );
}
