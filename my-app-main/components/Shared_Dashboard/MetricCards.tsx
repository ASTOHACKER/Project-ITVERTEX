// 1. React & React Native
import React from 'react';
import { Text, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';

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
  percent?: number;
  progress?: number;
}

function MetricRow({ title, value, icon, color, bgColor, borderColor, percent, progress }: MetricCardProps) {
  return (
    <View className="py-3.5">
      <View className="flex-row items-center">
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
        {typeof percent === 'number' && (
          <Text className="ml-2 w-12 text-right font-body text-[11px] font-semibold text-slate-400">
            {percent}%
          </Text>
        )}
      </View>
      {typeof progress === 'number' && (
        <View className="ml-12 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color }}
          />
        </View>
      )}
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

  const safeTotal = Math.max(0, totalJobs);
  const safeCompleted = Math.max(0, Math.min(completedJobs, safeTotal));
  const safePending = Math.max(0, Math.min(pendingJobs, safeTotal - safeCompleted));
  const otherCount = Math.max(0, safeTotal - safeCompleted - safePending);

  const pct = (n: number) => (safeTotal > 0 ? Math.round((n / safeTotal) * 100) : 0);

  const pieData: { value: number; color: string }[] = [];
  if (safeTotal > 0) {
    if (safeCompleted > 0) pieData.push({ value: safeCompleted, color: '#16A34A' });
    if (safePending > 0) pieData.push({ value: safePending, color: '#D97706' });
    if (otherCount > 0) pieData.push({ value: otherCount, color: '#94A3B8' });
  } else {
    pieData.push({ value: 1, color: '#F1F5F9' });
  }

  const donutLegend = [
    { label: 'สำเร็จ', count: safeCompleted, color: '#16A34A' },
    { label: 'รอดำเนินการ', count: safePending, color: '#D97706' },
    ...(otherCount > 0 ? [{ label: 'ยกเลิก/อื่นๆ', count: otherCount, color: '#94A3B8' }] : []),
  ];

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
      value: `${safeTotal.toLocaleString()} เครื่อง`,
      icon: 'cube',
      color: '#0284C7',
      bgColor: '#F0F9FF',
      borderColor: '#E0F2FE',
    },
    {
      title: 'ซ่อมสำเร็จแล้ว',
      value: `${safeCompleted.toLocaleString()} เครื่อง`,
      icon: 'checkmark-done-circle',
      color: '#16A34A',
      bgColor: '#F0FDF4',
      borderColor: '#DCFCE7',
      percent: pct(safeCompleted),
      progress: safeTotal > 0 ? safeCompleted / safeTotal : 0,
    },
    {
      title: 'รอดำเนินการ',
      value: `${safePending.toLocaleString()} เครื่อง`,
      icon: 'time',
      color: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FEF3C7',
      percent: pct(safePending),
      progress: safeTotal > 0 ? safePending / safeTotal : 0,
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

      {/* กราฟโดนัทสัดส่วนงานซ่อม + รายละเอียดครบ */}
      <View className="flex-row items-center gap-4 px-4 pb-1 pt-4">
        <View className="items-center justify-center">
          <PieChart
            donut
            data={pieData}
            radius={58}
            innerRadius={40}
            showText={false}
            centerLabelComponent={() => (
              <View className="items-center justify-center">
                <Text className="font-heading text-xl font-extrabold text-slate-800">
                  {safeTotal > 0 ? `${pct(safeCompleted)}%` : '—'}
                </Text>
                <Text className="-mt-0.5 font-body text-[10px] font-medium text-slate-400">
                  สำเร็จ
                </Text>
              </View>
            )}
          />
        </View>
        <View className="flex-1">
          {donutLegend.map((item) => (
            <View key={item.label} className="mb-2 flex-row items-center justify-between">
              <View className="mr-2 flex-1 flex-row items-center gap-2">
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <Text className="font-body text-xs font-medium text-slate-600" numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              <Text className="font-heading text-xs font-bold text-slate-800">
                {item.count.toLocaleString()} เครื่อง
              </Text>
              <Text className="ml-1.5 w-9 text-right font-body text-[11px] font-semibold text-slate-400">
                {pct(item.count)}%
              </Text>
            </View>
          ))}
          <Text className="mt-0.5 font-body text-[10px] text-slate-400">
            รวมทั้งหมด {safeTotal.toLocaleString()} เครื่อง
          </Text>
        </View>
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
