// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Dimensions, Text, View } from 'react-native';

// 2. Third-party / Expo
import { LineChart } from 'react-native-gifted-charts';

interface TrendChartProps {
  timeFilter: 'day' | 'month' | 'year';
  deviceType?: string;
  data?: { value: number; label: string }[];
  isLoading?: boolean;
}

export default function TrendChart({
  timeFilter,
  deviceType,
  data = [],
  isLoading = false,
}: TrendChartProps) {
  const chartWidth = Dimensions.get('window').width - 84;

  // คำนวณค่าสูงสุดให้เป็นจำนวนเต็มเสมอ ป้องกันตัวเลขทศนิยม (เช่น 1.1, 0.6)
  const rawMax = data.length > 0 ? Math.max(...data.map((d) => Number(d.value) || 0)) : 0;
  const maxVal = rawMax <= 4 ? 4 : Math.ceil(rawMax / 4) * 4;
  const stepVal = Math.max(1, Math.round(maxVal / 4));

  // ปรับ spacing และขนาดจุดให้สวยงามตามจำนวนข้อมูล (เช่น 1-31 วัน หรือ 12 เดือน)
  const isMonthRange = data.length > 20;
  const spacing = isMonthRange ? 26 : data.length > 10 ? 38 : 60;
  const pointRadius = isMonthRange ? 3 : 4;

  const deviceLabel = deviceType === 'pc' ? ' • คอมพิวเตอร์' : deviceType === 'laptop' ? ' • โน๊ตบุ๊ค' : deviceType === 'printer' ? ' • ปริ้นเตอร์' : '';

  const subtitleText =
    (timeFilter === 'day'
      ? data.length > 20
        ? 'รายวัน (วันที่ 1 - 31)'
        : 'รายวัน'
      : timeFilter === 'month'
      ? 'รายเดือน (12 เดือน)'
      : 'รายปี') + deviceLabel;

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-bold text-slate-800 font-heading">
              แนวโน้มจำนวนงานซ่อม
            </Text>
            <Text className="text-xs text-slate-400 font-medium">
              (เครื่อง)
            </Text>
          </View>
          <Text className="text-[11px] text-slate-400 font-body mt-0.5">
            {subtitleText} {isMonthRange && '• เลื่อนขวาเพื่อดูวันเพิ่มเติม'}
          </Text>
        </View>

        <View className="bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
          <Text className="text-xs font-bold text-primary font-heading">
            {data.reduce((sum, d) => sum + (Number(d.value) || 0), 0)} เครื่อง
          </Text>
        </View>
      </View>

      <View className="-ml-2.5">
        {isLoading ? (
          <View className="h-[180px] justify-center items-center">
            <ActivityIndicator size="large" color="#D62828" />
            <Text className="mt-2 font-body text-xs text-slate-400">กำลังโหลดข้อมูลแนวโน้ม...</Text>
          </View>
        ) : data.length > 0 ? (
          <LineChart
            key={`${timeFilter}_${data.length}`}
            isAnimated
            areaChart
            data={data}
            hideDataPoints={false}
            dataPointsColor="#D62828"
            dataPointsRadius={pointRadius}
            color="#D62828"
            thickness={2.5}
            startFillColor="#D62828"
            endFillColor="#D62828"
            startOpacity={0.3}
            endOpacity={0.02}
            initialSpacing={16}
            spacing={spacing}
            maxValue={maxVal}
            noOfSections={4}
            stepValue={stepVal}
            roundToDigits={0}
            formatYLabel={(val) => Math.round(Number(val)).toString()}
            yAxisColor="transparent"
            xAxisColor="#E2E8F0"
            yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#64748B', fontSize: isMonthRange ? 9 : 10, fontWeight: '600' }}
            height={180}
            width={chartWidth}
          />
        ) : (
          <View className="h-[180px] justify-center items-center">
            <Text className="mt-2 font-body text-xs text-text-light">ไม่มีข้อมูลในช่วงเวลาที่เลือก</Text>
          </View>
        )}
      </View>
    </View>
  );
}
