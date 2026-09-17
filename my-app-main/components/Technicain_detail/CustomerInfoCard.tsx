// 1. React & React Native
import { Text, View } from 'react-native';

interface CustomerInfoCardProps {
  customerName: string;
  phone: string;
  email?: string;
}

export default function CustomerInfoCard({ customerName, phone, email }: CustomerInfoCardProps) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2 ml-1">
        <View className="w-1 h-4 bg-[#D32F2F] mr-2 rounded-sm" />
        <Text className="text-sm font-bold text-[#D32F2F]">ข้อมูลลูกค้า (CUSTOMER)</Text>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/5 elevation-2">
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">ชื่อ-นามสกุล</Text>
          <Text className="text-sm text-slate-800 font-bold flex-[2] text-right">{customerName || '-'}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">เบอร์โทรศัพท์</Text>
          <Text className="text-sm text-slate-800 flex-[2] text-right">{phone || '-'}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">อีเมล</Text>
          <Text className="text-sm text-slate-800 flex-[2] text-right">{email || '-'}</Text>
        </View>
      </View>
    </View>
  );
}
