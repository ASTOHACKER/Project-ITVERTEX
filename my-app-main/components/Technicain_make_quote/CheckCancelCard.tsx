// 1. React & React Native
import { Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface CheckCancelCardProps {
  checkServiceName: string;
  setCheckServiceName: (text: string) => void;
  checkServicePrice: string;
  setCheckServicePrice: (text: string) => void;
  onUseDefaultPrice?: () => void;
}

export default function CheckCancelCard({
  checkServiceName,
  setCheckServiceName,
  checkServicePrice,
  setCheckServicePrice,
  onUseDefaultPrice,
}: CheckCancelCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isCompactScreen = windowWidth < 420;

  return (
    <View className="bg-white rounded-xl overflow-hidden mb-4 border border-slate-200 shadow-sm shadow-black/5 elevation-2">
      <View className="py-2.5 px-4 bg-red-50">
        <Text className="text-[15px] font-bold text-red-600">
          ค่าตรวจเช็ค (กรณียกเลิกซ่อม)
        </Text>
        <Text className="text-xs text-slate-600 mt-0.5">
          เก็บค่าบริการตรวจเช็คเท่านั้น ไม่มีค่าอะไหล่
        </Text>
      </View>
      <View className="p-3.5">
        {/* Name Input */}
        <TextInput
          className="border border-slate-300 rounded-xl px-3.5 h-11 text-sm text-slate-800 bg-slate-50 w-full mb-2.5"
          placeholder="ชื่อบริการตรวจเช็ค"
          placeholderTextColor="#94A3B8"
          value={checkServiceName}
          onChangeText={setCheckServiceName}
        />
        {/* Price Row */}
        <View className={`flex-row gap-2 items-center mb-3 ${isCompactScreen ? 'flex-wrap' : ''}`}>
          <TextInput
            className="flex-1 border border-slate-300 rounded-xl px-3 h-11 text-sm text-slate-800 bg-slate-50"
            placeholder="ราคา"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={checkServicePrice}
            onChangeText={setCheckServicePrice}
          />
          <Text className="text-sm font-medium text-slate-800">บาท</Text>
          {onUseDefaultPrice && (
            <TouchableOpacity className="flex-row items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2.5 h-11" onPress={onUseDefaultPrice} activeOpacity={0.7}>
              <Ionicons name="refresh" size={14} color="#E53E3E" />
              <Text className="text-[13px] font-bold text-red-600">300</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Warning Card */}
        <View className="flex-row bg-red-50 border border-red-200 rounded-lg p-3 gap-2 items-start">
          <Ionicons name="information-circle-outline" size={20} color="#E53E3E" className="mt-0.5" />
          <Text className="flex-1 text-xs text-red-700 leading-4">
            ลูกค้าจะถูกแจ้งว่ายกเลิกซ่อมและต้องชำระค่าตรวจเช็คก่อนรับเครื่องคืน
          </Text>
        </View>
      </View>
    </View>
  );
}
