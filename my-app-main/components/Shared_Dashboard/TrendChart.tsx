// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Dimensions, Text, View } from 'react-native';

// 2. Third-party / Expo
import { LineChart } from 'react-native-gifted-charts';

interface TrendChartProps {
  timeFilter: 'day' | 'month' | 'year';
  data?: { value: number; label: string }[];
  isLoading?: boolean;
}

export default function TrendChart({
  timeFilter,
  data = [],
  isLoading = false,
}: TrendChartProps) {
  const chartWidth = Dimensions.get('window').width - 84;

  // คำนวณค่าสูงสุดให้เป็นจำนวนเต็มเสมอ ป้องกันตัวเลขทศนิยม (เช่น 1.1, 0.6)
  const rawMax = data.length > 0 ? Math.max(...data.map((d) => Number(d.value) || 0)) : 0;
  const maxVal = rawMax <= 4 ? 4 : Math.ceil(rawMax / 4) * 4;
  const stepVal = Math.max(1, Math.round(maxVal / 4));

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-xl border border-app-border overflow-hidden">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-base font-bold text-text-dark font-heading">
            แนวโน้มจำนวนงานซ่อม
          </Text>
          <Text className="text-xs text-slate-400 font-medium">
            (เครื่อง / รายการ)
          </Text>
        </View>
      </View>

      <View className="-ml-2.5">
        {isLoading ? (
          <View className="h-[180px] justify-center items-center">
            <ActivityIndicator size="large" color="#D62828" />
            <Text className="mt-2 font-body text-xs text-text-light">กำลังโหลดข้อมูลแนวโน้ม...</Text>
          </View>
        ) : data.length > 0 ? (
          <LineChart
            key={timeFilter}
            isAnimated
            areaChart
            data={data}
            hideDataPoints={false}
            dataPointsColor="#D62828"
            dataPointsRadius={4}
            color="#D62828"
            thickness={3}
            startFillColor="#D62828"
            endFillColor="#D62828"
            startOpacity={0.35}
            endOpacity={0.03}
            initialSpacing={24}
            spacing={timeFilter === 'day' ? 45 : 65}
            maxValue={maxVal}
            noOfSections={4}
            stepValue={stepVal}
            roundToDigits={0}
            formatYLabel={(val) => Math.round(Number(val)).toString()}
            yAxisColor="transparent"
            xAxisColor="#E9ECEF"
            yAxisTextStyle={{ color: '#888888', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#888888', fontSize: 10 }}
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
