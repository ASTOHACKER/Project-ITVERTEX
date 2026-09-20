// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';

interface CategoryChartProps {
  pcCount?: number;
  laptopCount?: number;
  printerCount?: number;
  otherCount?: number;
  total?: number;
  isLoading?: boolean;
  pcPercent?: number;
  laptopPercent?: number;
  printerPercent?: number;
}

export default function CategoryChart({
  pcCount,
  laptopCount,
  printerCount,
  otherCount = 0,
  total,
  isLoading = false,
  pcPercent,
  laptopPercent,
  printerPercent,
}: CategoryChartProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

  const actualPc = pcCount ?? pcPercent ?? 0;
  const actualLaptop = laptopCount ?? laptopPercent ?? 0;
  const actualPrinter = printerCount ?? printerPercent ?? 0;

  const chartColors = {
    laptop: '#F97316',   // Orange
    pc: '#DC2626',       // Red
    printer: '#0284C7',  // Sky
    other: '#64748B',    // Slate
  };

  const calculatedTotal = total ?? (actualPc + actualLaptop + actualPrinter + otherCount);

  // Build PieChart data with clean slices without cramped overlapping text
  const pieData: { value: number; color: string }[] = [];

  if (calculatedTotal > 0) {
    if (actualLaptop > 0) {
      pieData.push({
        value: actualLaptop,
        color: chartColors.laptop,
      });
    }
    if (actualPc > 0) {
      pieData.push({
        value: actualPc,
        color: chartColors.pc,
      });
    }
    if (actualPrinter > 0) {
      pieData.push({
        value: actualPrinter,
        color: chartColors.printer,
      });
    }
    if (otherCount > 0) {
      pieData.push({
        value: otherCount,
        color: chartColors.other,
      });
    }
  } else {
    // Empty state placeholder ring
    pieData.push({ value: 1, color: '#F1F5F9' });
  }

  const getPercent = (count: number) => {
    if (calculatedTotal === 0) return 0;
    return Math.round((count / calculatedTotal) * 100);
  };

  const allCategories = [
    {
      id: 'laptop',
      label: 'โน๊ตบุ๊ค (Laptop)',
      color: chartColors.laptop,
      count: actualLaptop,
      percent: getPercent(actualLaptop),
      icon: 'laptop-outline',
    },
    {
      id: 'pc',
      label: 'คอมพิวเตอร์ (PC)',
      color: chartColors.pc,
      count: actualPc,
      percent: getPercent(actualPc),
      icon: 'desktop-outline',
    },
    {
      id: 'printer',
      label: 'ปริ้นเตอร์ (Printer)',
      color: chartColors.printer,
      count: actualPrinter,
      percent: getPercent(actualPrinter),
      icon: 'print-outline',
    },
    {
      id: 'other',
      label: 'อุปกรณ์อื่นๆ',
      color: chartColors.other,
      count: otherCount,
      percent: getPercent(otherCount),
      icon: 'hardware-chip-outline',
    },
  ];

  // Show categories with active counts, or all if empty
  const displayCategories = calculatedTotal > 0
    ? allCategories.filter((item) => item.count > 0)
    : allCategories.slice(0, 3);

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-2xl border border-slate-200 shadow-sm">
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 items-center justify-center">
            <Ionicons name="pie-chart" size={16} color="#DC2626" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-800 font-heading">
              สัดส่วนอุปกรณ์ตามประเภท
            </Text>
            <Text className="text-[11px] text-slate-400 font-body">
              จำแนกตามชนิดของอุปกรณ์ที่ส่งซ่อม
            </Text>
          </View>
        </View>

        <View className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          <Text className="text-xs font-bold text-slate-700 font-heading">
            {calculatedTotal} เครื่อง
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="h-[180px] justify-center items-center">
          <ActivityIndicator size="large" color="#DC2626" />
          <Text className="mt-2.5 font-body text-xs text-slate-400">
            กำลังประมวลผลสัดส่วน...
          </Text>
        </View>
      ) : (
        <View className={`${isWide ? 'flex-row items-center justify-between gap-6' : 'flex-col'}`}>
          {/* Donut Chart Showcase */}
          <View className={`items-center justify-center ${isWide ? 'flex-1' : 'mb-5 py-2'}`}>
            <View className="relative items-center justify-center">
              <PieChart
                donut
                data={pieData}
                radius={76}
                innerRadius={54}
                showText={false}
                focusOnPress
                centerLabelComponent={() => (
                  <View className="justify-center items-center">
                    <Text className="text-2xl font-extrabold text-slate-800 font-heading">
                      {calculatedTotal}
                    </Text>
                    <Text className="text-[10px] font-medium text-slate-400 font-body -mt-0.5">
                      {calculatedTotal > 0 ? 'เครื่องทั้งหมด' : 'ไม่มีงาน'}
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>

          {/* Clean Category Breakdown Cards */}
          <View className={`${isWide ? 'flex-1' : 'w-full'}`}>
            {displayCategories.map((item) => (
              <View
                key={item.id}
                className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5 mb-2"
              >
                <View className="flex-row items-center justify-between">
                  {/* Left: Icon & Label */}
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <View
                      className="w-6 h-6 rounded-lg items-center justify-center"
                      style={{ backgroundColor: `${item.color}18` }}
                    >
                      <Ionicons name={item.icon as any} size={13} color={item.color} />
                    </View>
                    <Text
                      className="text-xs font-bold text-slate-800 font-heading"
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </View>

                  {/* Right: Count & Percentage */}
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-xs font-bold text-slate-900 font-heading">
                      {item.count} เครื่อง
                    </Text>
                    <Text className="text-[11px] font-semibold text-slate-400 font-body min-w-[32px] text-right">
                      {item.percent}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
