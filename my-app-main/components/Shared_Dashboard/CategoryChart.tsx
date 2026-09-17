// 1. React & React Native
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

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
  const actualPc = pcCount ?? pcPercent ?? 0;
  const actualLaptop = laptopCount ?? laptopPercent ?? 0;
  const actualPrinter = printerCount ?? printerPercent ?? 0;
  const chartColors = {
    pc: '#D62828',       // Red
    laptop: '#F77F00',   // Orange
    printer: '#0077B6',  // Blue
    other: '#6C757D',    // Gray
  };

  const calculatedTotal = total ?? (actualPc + actualLaptop + actualPrinter + otherCount);

  const pieData: { value: number; color: string; text?: string }[] = [];

  if (calculatedTotal > 0) {
    if (actualPc > 0) {
      pieData.push({
        value: actualPc,
        color: chartColors.pc,
        text: `${Math.round((actualPc / calculatedTotal) * 100)}%`,
      });
    }
    if (actualLaptop > 0) {
      pieData.push({
        value: actualLaptop,
        color: chartColors.laptop,
        text: `${Math.round((actualLaptop / calculatedTotal) * 100)}%`,
      });
    }
    if (actualPrinter > 0) {
      pieData.push({
        value: actualPrinter,
        color: chartColors.printer,
        text: `${Math.round((actualPrinter / calculatedTotal) * 100)}%`,
      });
    }
    if (otherCount > 0) {
      pieData.push({
        value: otherCount,
        color: chartColors.other,
        text: `${Math.round((otherCount / calculatedTotal) * 100)}%`,
      });
    }
  } else {
    // Empty state placeholder ring
    pieData.push({ value: 1, color: '#F1F5F9', text: '' });
  }

  const getPercentText = (count: number) => {
    if (calculatedTotal === 0) return '0 เครื่อง (0%)';
    const pct = Math.round((count / calculatedTotal) * 100);
    return `${count} เครื่อง (${pct}%)`;
  };

  const allCategories = [
    { label: 'คอมพิวเตอร์ (PC)', color: chartColors.pc, count: actualPc },
    { label: 'โน๊ตบุ๊ค (Laptop)', color: chartColors.laptop, count: actualLaptop },
    { label: 'ปริ้นเตอร์ (Printer)', color: chartColors.printer, count: actualPrinter },
    { label: 'อื่นๆ', color: chartColors.other, count: otherCount },
  ];

  // แสดงเฉพาะหมวดหมู่ที่มีงานจริงในระบบ (ไม่แสดง 0 เครื่อง) เพื่อไม่ให้สับสน
  const legends = allCategories.filter((item) => item.count > 0);

  return (
    <View className="bg-white p-4 mx-4 mb-4 rounded-xl border border-app-border shadow-xs">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="pie-chart-outline" size={18} color="#D62828" />
          <Text className="text-sm font-bold text-text-dark font-heading">
            สัดส่วนอุปกรณ์ตามประเภท
          </Text>
        </View>
        <Text className="text-xs text-slate-400 font-body">
          {calculatedTotal} เครื่อง
        </Text>
      </View>

      {isLoading ? (
        <View className="h-[160px] justify-center items-center">
          <ActivityIndicator size="large" color="#D62828" />
          <Text className="mt-2 font-body text-xs text-text-light">กำลังประมวลผลสัดส่วน...</Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-around py-2">
          {/* Donut Chart */}
          <View className="justify-center items-center">
            <PieChart
              donut
              data={pieData}
              radius={72}
              innerRadius={50}
              showText={calculatedTotal > 0}
              textColor="#FFFFFF"
              textSize={10}
              font="Prompt-Regular"
              focusOnPress
              centerLabelComponent={() => (
                <View className="justify-center items-center">
                  <Text className="text-lg font-heading text-text-dark font-bold">
                    {calculatedTotal}
                  </Text>
                  <Text className="text-[10px] font-body text-text-light">
                    {calculatedTotal > 0 ? 'เครื่องทั้งหมด' : 'ไม่มีข้อมูล'}
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Legends */}
          <View className="gap-2.5 max-w-[50%]">
            {legends.map((item) => (
              <View key={item.label} className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <View>
                  <Text className="text-[11px] font-bold text-text-dark font-heading">
                    {item.label}
                  </Text>
                  <Text className="text-[10px] text-slate-500 font-body">
                    {getPercentText(item.count)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
