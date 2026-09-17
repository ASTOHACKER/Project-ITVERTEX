// 1. React & React Native
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface PartItem {
  id: string;
  name: string;
  price: number;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
}

interface TechnicianQuoteCardProps {
  deviceModel: string;
  parts: PartItem[];
  services: ServiceItem[];
  actualSymptom?: string;
  isSent: boolean;
  onForwardToCustomer: () => void;
}

export default function TechnicianQuoteCard({
  deviceModel,
  parts,
  services,
  actualSymptom,
  isSent,
  onForwardToCustomer,
}: TechnicianQuoteCardProps) {
  const partsTotal = parts.reduce((acc, item) => acc + item.price, 0);
  const servicesTotal = services.reduce((acc, item) => acc + item.price, 0);
  const grandTotal = partsTotal + servicesTotal;

  return (
    <View className="bg-white rounded-2xl overflow-hidden border border-[#FEF08A] shadow-lg shadow-black/5 elevation-2 mx-4 mt-3">
      {/* Yellow / Cream Banner Header */}
      <View className="bg-[#FEFCE8] px-4 py-3.5 border-b border-[#FEF08A]">
        <Text className="text-[15px] font-bold text-[#854D0E] mb-0.5">ใบเสนอราคาจากช่าง</Text>
        <Text className="text-xs text-[#A16207]">
          <Text className="font-bold text-[#854D0E]">{deviceModel}</Text> — ตรวจสอบก่อนส่งให้ลูกค้า
        </Text>
      </View>

      <View className="p-4 gap-3.5">
        {/* Actual Symptom Section */}
        {actualSymptom ? (
          <View className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <View className="flex-row items-center gap-1 mb-1">
              <Ionicons name="search-circle-outline" size={16} color="#b45309" />
              <Text className="text-xs font-bold text-amber-900">ผลตรวจเช็คอาการเสียจริง:</Text>
            </View>
            <Text className="text-xs text-amber-950 font-body pl-5">{actualSymptom}</Text>
          </View>
        ) : null}

        {/* Parts Section */}
        {parts.length > 0 && (
          <View className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <Text className="text-[13px] font-bold text-blue-800 mb-2">ค่าอะไหล่ (Parts)</Text>
            {parts.map((item) => (
              <View key={item.id} className="flex-row justify-between py-1">
                <Text className="text-xs text-slate-600">{item.name}</Text>
                <Text className="text-xs text-slate-800">{item.price.toLocaleString()} บ.</Text>
              </View>
            ))}
            <View className="flex-row justify-between border-t border-black/5 mt-2 pt-1.5">
              <Text className="text-xs font-bold text-blue-700">รวมค่าอะไหล่</Text>
              <Text className="text-xs font-bold text-blue-700">{partsTotal.toLocaleString()} บ.</Text>
            </View>
          </View>
        )}

        {/* Labor / Service Section */}
        <View className="bg-orange-50 rounded-xl p-3 border border-orange-100">
          <Text className="text-[13px] font-bold text-orange-700 mb-2">ค่าบริการ/ค่าแรง</Text>
          {services.map((item) => (
            <View key={item.id} className="flex-row justify-between py-1">
              <Text className="text-xs text-slate-600">{item.name}</Text>
              <Text className="text-xs text-slate-800">{item.price.toLocaleString()} บ.</Text>
            </View>
          ))}
          <View className="flex-row justify-between border-t border-black/5 mt-2 pt-1.5">
            <Text className="text-xs font-bold text-orange-700">รวมค่าบริการ</Text>
            <Text className="text-xs font-bold text-orange-700">{servicesTotal.toLocaleString()} บ.</Text>
          </View>
        </View>

        {/* Grand Total Row */}
        <View className="flex-row justify-between items-center pt-1 border-t border-slate-100">
          <Text className="text-sm font-bold text-slate-800">ยอดรวมทั้งสิ้น</Text>
          <Text className="text-base font-bold text-[#D32F2F]">{grandTotal.toLocaleString()} บาท</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="p-4 pt-0">
        {isSent ? (
          <View className="bg-green-100 h-[46px] rounded-xl flex-row items-center justify-center gap-2 border border-green-300">
            <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" />
            <Text className="text-sm font-bold text-green-700">ส่งให้ลูกค้าแล้ว (รอการอนุมัติ)</Text>
          </View>
        ) : (
          <TouchableOpacity
            className="w-full bg-[#D32F2F] h-[48px] rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-[#D32F2F]/25 elevation-3 active:opacity-90"
            activeOpacity={0.85}
            onPress={onForwardToCustomer}
          >
            <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white">ตรวจสอบแล้ว ส่งต่อให้ลูกค้า</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
