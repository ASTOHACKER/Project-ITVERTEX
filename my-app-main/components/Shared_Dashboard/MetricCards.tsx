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

function MetricRow({ title, value, icon, color, bgColor, borderColor }: MetricCardProps) {
  return (
    <View className="flex-row items-center py-3.5">
      <View className="flex-1 flex-row items-center gap-3">
        <View
          className="h-9 w-9 items-center justify-center rounded-xl border"
          style={{ backgroundColor: bgColor, borderColor }}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text className="flex-1 font-heading text-xs font-medium text-slate-600" numberOfLines={2}>
          {title}
        </Text>
      </View>
      <Text className="font-heading text-xl font-bold tracking-tight" style={{ color }}>
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

  const [primaryMetric, ...supportingMetrics] = metrics;

  return (
    <View className="mx-4 mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <View className="bg-red-600 px-5 py-5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-heading text-xs font-medium text-red-100">
              {primaryMetric.title}
            </Text>
            <Text className="mt-1 font-heading text-[32px] font-bold tracking-tight text-white">
              {primaryMetric.value}
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Ionicons name={primaryMetric.icon} size={24} color="#FFFFFF" />
          </View>
        </View>
        <View className="mt-4 h-1 w-10 rounded-full bg-red-200" />
      </View>

      <View className="px-4">
        {supportingMetrics.map((item, index) => (
          <View
            key={item.title}
            className={index < supportingMetrics.length - 1 ? 'border-b border-slate-100' : ''}
          >
            <MetricRow {...item} />
          </View>
        ))}
      </View>
    </View>
  );
}
