// 1. React & React Native
import { Text, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface RepairSummaryCardProps {
  deviceModel: string;
  jobNo: string;
  customerName: string;
  totalPrice: number;
}

export default function RepairSummaryCard({
  deviceModel,
  jobNo,
  customerName,
  totalPrice,
}: RepairSummaryCardProps) {
  return (
    <View className="bg-white p-5 mx-4 mt-4 rounded-2xl border border-slate-200 shadow-sm shadow-black/5 elevation-2 gap-2.5">
      <Text className="text-base font-bold text-slate-800 mb-1.5">สรุปการซ่อม</Text>

      <View className="flex-row justify-between items-center">
        <Text className="text-[13px] text-slate-500">อุปกรณ์</Text>
        <Text className="text-sm font-medium text-slate-800">{deviceModel}</Text>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-[13px] text-slate-500">เลขใบซ่อม</Text>
        <Text className="text-sm font-medium text-slate-800">{jobNo}</Text>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-[13px] text-slate-500">ลูกค้า</Text>
        <Text className="text-sm font-medium text-slate-800">{customerName}</Text>
      </View>

      <View className="h-px bg-slate-100 my-1" />

      <View className="flex-row justify-between items-center">
        <Text className="text-[13px] text-slate-500">ยอดชำระ</Text>
        <View className="flex-row items-center gap-1">
          <Text className="text-base font-bold text-[#00B4D8]">{totalPrice.toLocaleString()} บาท</Text>
          <Ionicons name="checkmark" size={18} color="#16A34A" />
        </View>
      </View>
    </View>
  );
}
