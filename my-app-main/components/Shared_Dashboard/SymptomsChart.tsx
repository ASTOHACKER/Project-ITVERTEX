// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

export interface SymptomItem {
  label: string;
  jobs_count: number;
  unit?: string;
}

interface SymptomsChartProps {
  data?: SymptomItem[];
  isLoading?: boolean;
  deviceType?: string;
  timeFilter?: string;
}

export default function SymptomsChart({
  data = [],
  isLoading = false,
  deviceType,
  timeFilter,
}: SymptomsChartProps) {
  const totalJobs = data.reduce((sum, item) => sum + (item.jobs_count || 0), 0);
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.jobs_count || 1)) : 1;

  const BAR_COLORS = ['#DC2626', '#EA580C', '#D97706', '#0284C7', '#6366F1', '#10B981', '#8B5CF6', '#64748B'];

  const deviceLabel = deviceType === 'pc' ? ' • คอมพิวเตอร์' : deviceType === 'laptop' ? ' • โน๊ตบุ๊ค' : deviceType === 'printer' ? ' • ปริ้นเตอร์' : '';

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 items-center justify-center">
            <Ionicons name="medkit-outline" size={16} color="#D97706" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-800 font-heading">
              อาการเสียที่พบบ่อย
            </Text>
            <Text className="text-[11px] text-slate-400 font-body">
              จัดกลุ่มจากอาการที่ลูกค้าแจ้ง (เครื่อง){deviceLabel}
            </Text>
          </View>
        </View>

        <View className="bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          <Text className="text-xs font-bold text-amber-700 font-heading">
            {totalJobs} เครื่อง
          </Text>
        </View>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View className="h-[180px] justify-center items-center">
          <ActivityIndicator size="large" color="#D97706" />
          <Text className="mt-2.5 font-body text-xs text-slate-400">
            กำลังประมวลผลอาการเสีย...
          </Text>
        </View>
      ) : data.length > 0 ? (
        <View className="gap-2.5">
          {data.map((item, index) => {
            const barWidthPercent = Math.max(8, Math.round((item.jobs_count / maxCount) * 100));
            const barColor = BAR_COLORS[index % BAR_COLORS.length];
            const pct = totalJobs > 0 ? Math.round((item.jobs_count / totalJobs) * 100) : 0;

            return (
              <View key={item.label} className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-1 mr-2 flex-row items-center gap-2">
                    <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: barColor }} />
                    <Text className="text-xs font-bold text-slate-800 font-heading flex-1" numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>

                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-xs font-extrabold font-heading" style={{ color: barColor }}>
                      {item.jobs_count} เครื่อง
                    </Text>
                    <Text className="text-[11px] font-semibold text-slate-400 font-body min-w-[32px] text-right">
                      {pct}%
                    </Text>
                  </View>
                </View>

                <View className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${barWidthPercent}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View className="h-[150px] justify-center items-center">
          <Ionicons name="medkit-outline" size={32} color="#CBD5E1" />
          <Text className="mt-2 font-body text-xs text-slate-400">
            ไม่มีข้อมูลอาการเสียในช่วงเวลาที่เลือก
          </Text>
        </View>
      )}
    </View>
  );
}
