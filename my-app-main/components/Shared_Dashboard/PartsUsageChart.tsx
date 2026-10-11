// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

export interface PartUsageItem {
  item_id: number | string;
  item_name: string;
  total_quantity: number;
  jobs_count: number;
  total_cost: number;
  unit?: string;
}

interface PartsUsageChartProps {
  data?: PartUsageItem[];
  isLoading?: boolean;
  deviceType?: string;
  timeFilter?: string;
}

export default function PartsUsageChart({
  data = [],
  isLoading = false,
  deviceType,
  timeFilter,
}: PartsUsageChartProps) {
  const totalPartsUsed = data.reduce((sum, item) => sum + (item.total_quantity || 0), 0);
  const maxQty = data.length > 0 ? Math.max(...data.map((d) => d.total_quantity || 1)) : 1;

  const BAR_COLORS = ['#DC2626', '#EA580C', '#D97706', '#0284C7', '#6366F1', '#10B981'];

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 items-center justify-center">
            <Ionicons name="hardware-chip" size={16} color="#EA580C" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-800 font-heading">
              สถิติการใช้อะไหล่
            </Text>
            <Text className="text-[11px] text-slate-400 font-body">
              จำนวนอะไหล่ที่ใช้ไปในงานซ่อม (ชิ้น) • ซิงค์ตามตัวกรอง{deviceType && deviceType !== 'all' ? ` (${deviceType === 'pc' ? 'คอมพิวเตอร์' : deviceType === 'laptop' ? 'โน๊ตบุ๊ค' : 'ปริ้นเตอร์'})` : ''}
            </Text>
          </View>
        </View>

        <View className="bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
          <Text className="text-xs font-bold text-orange-700 font-heading">
            {totalPartsUsed} ชิ้น
          </Text>
        </View>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View className="h-[180px] justify-center items-center">
          <ActivityIndicator size="large" color="#EA580C" />
          <Text className="mt-2.5 font-body text-xs text-slate-400">
            กำลังประมวลผลข้อมูลการใช้อะไหล่...
          </Text>
        </View>
      ) : data.length > 0 ? (
        <View className="gap-3">
          {data.map((item, index) => {
            const barWidthPercent = Math.max(10, Math.round((item.total_quantity / maxQty) * 100));
            const barColor = BAR_COLORS[index % BAR_COLORS.length];

            return (
              <View key={item.item_id} className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                {/* Part Name & Quantity */}
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-bold text-slate-800 font-heading" numberOfLines={1}>
                      {item.item_name}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-body mt-0.5">
                      ใช้ในงานซ่อม {item.jobs_count} เครื่อง • มูลค่ารวม ฿{item.total_cost.toLocaleString()}
                    </Text>
                  </View>

                  <View className="items-end bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <Text className="text-xs font-extrabold font-heading" style={{ color: barColor }}>
                      {item.total_quantity} ชิ้น
                    </Text>
                  </View>
                </View>

                {/* Progress Bar Track */}
                {/* <View className="w-full h-2 rounded-full bg-slate-200/70 overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${barWidthPercent}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </View> */}
              </View>
            );
          })}
        </View>
      ) : (
        <View className="h-[150px] justify-center items-center">
          <Ionicons name="construct-outline" size={32} color="#CBD5E1" />
          <Text className="mt-2 font-body text-xs text-slate-400">
            ไม่มีการใช้อะไหล่ในช่วงเวลาที่เลือก
          </Text>
        </View>
      )}
    </View>
  );
}
