// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Dimensions, Text, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';

export interface TeamMemberPerformance {
  id: number | string;
  name: string;
  role_name?: string;
  total_jobs: number;
  completed_jobs: number;
  unit?: string;
}

interface TeamPerformanceChartProps {
  data?: TeamMemberPerformance[];
  isLoading?: boolean;
  deviceType?: string;
  timeFilter?: string;
}

export default function TeamPerformanceChart({
  data = [],
  isLoading = false,
  deviceType,
  timeFilter,
}: TeamPerformanceChartProps) {
  const chartWidth = Dimensions.get('window').width - 84;

  const rawMax = data.length > 0 ? Math.max(...data.map((d) => d.completed_jobs || 0)) : 0;
  const maxVal = rawMax <= 4 ? 4 : Math.ceil(rawMax / 4) * 4;
  const stepVal = Math.max(1, Math.round(maxVal / 4));

  const ROLE_COLORS: Record<string, string> = {
    Technician: '#DC2626',
    Staff: '#0284C7',
    Manager: '#7C3AED',
  };

  const barData = data.map((item) => {
    const roleKey = item.role_name || '';
    const color = ROLE_COLORS[roleKey] || '#DC2626';
    const shortName = item.name.split(' ')[0] || item.name;

    return {
      value: item.completed_jobs,
      label: shortName,
      frontColor: color,
      topLabelComponent: () => (
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569', marginBottom: 2 }}>
          {item.completed_jobs}
        </Text>
      ),
    };
  });

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 items-center justify-center">
            <Ionicons name="bar-chart" size={16} color="#DC2626" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-800 font-heading">
              ประสิทธิภาพทีมรายบุคคล
            </Text>
            {/* <Text className="text-[11px] text-slate-400 font-body">
              จำนวนงานซ่อมที่สำเร็จ (เครื่อง) • ซิงค์ตามตัวกรอง{deviceType && deviceType !== 'all' ? ` (${deviceType === 'pc' ? 'คอมพิวเตอร์' : deviceType === 'laptop' ? 'โน๊ตบุ๊ค' : 'ปริ้นเตอร์'})` : ''}
            </Text> */}
          </View>
        </View>

        <View className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          <Text className="text-xs font-bold text-slate-700 font-heading">
            {data.reduce((sum, d) => sum + (d.completed_jobs || 0), 0)} เครื่อง
          </Text>
        </View>
      </View>

      {/* Bar Chart Area */}
      <View className="-ml-2.5">
        {isLoading ? (
          <View className="h-[180px] justify-center items-center">
            <ActivityIndicator size="large" color="#DC2626" />
            <Text className="mt-2.5 font-body text-xs text-slate-400">
              กำลังประมวลผลข้อมูลทีม...
            </Text>
          </View>
        ) : data.length > 0 ? (
          <View>
            <BarChart
              data={barData}
              barWidth={26}
              spacing={data.length <= 3 ? 42 : 24}
              roundedTop
              roundedBottom={false}
              hideRules={false}
              rulesColor="#F1F5F9"
              yAxisColor="transparent"
              xAxisColor="#E2E8F0"
              yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}
              maxValue={maxVal}
              noOfSections={4}
              stepValue={stepVal}
              roundToDigits={0}
              height={180}
              width={chartWidth}
              isAnimated
            />

            {/* Member Details Breakdown List */}
            <View className="mt-4 pt-3 border-t border-slate-100 gap-2">
              {data.map((member) => {
                const roleColor = ROLE_COLORS[member.role_name || ''] || '#DC2626';
                const roleLabel =
                  member.role_name === 'Technician'
                    ? 'ช่างซ่อม'
                    : member.role_name === 'Staff'
                      ? 'พนักงาน'
                      : member.role_name || 'เจ้าหน้าที่';

                return (
                  <View
                    key={member.id}
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${roleColor}18` }}
                      >
                        <Text className="text-xs font-bold" style={{ color: roleColor }}>
                          {member.name.slice(0, 1)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-800 font-heading" numberOfLines={1}>
                          {member.name}
                        </Text>
                        <Text className="text-[10px] text-slate-400 font-body">
                          {roleLabel} • รับผิดชอบ {member.total_jobs} เครื่อง
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-xs font-bold text-slate-900 font-heading">
                        {member.completed_jobs} เครื่อง
                      </Text>
                      <Text className="text-[10px] font-semibold text-emerald-600 font-body">
                        สำเร็จแล้ว
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="h-[180px] justify-center items-center">
            <Ionicons name="people-outline" size={32} color="#CBD5E1" />
            <Text className="mt-2 font-body text-xs text-slate-400">
              ไม่มีข้อมูลทีมงานในช่วงเวลาที่เลือก
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
