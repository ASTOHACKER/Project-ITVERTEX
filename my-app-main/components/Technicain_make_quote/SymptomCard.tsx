// 1. React & React Native
import { Text, TextInput, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface SymptomCardProps {
  initialSymptom?: string;
  actualSymptom?: string;
  onChangeActualSymptom?: (text: string) => void;
  // Backward compatibility
  symptom?: string;
  onChangeSymptom?: (text: string) => void;
}

export default function SymptomCard({
  initialSymptom,
  actualSymptom,
  onChangeActualSymptom,
  symptom,
  onChangeSymptom,
}: SymptomCardProps) {
  const currentActualSymptom = actualSymptom !== undefined ? actualSymptom : (symptom || '');
  const handleChange = onChangeActualSymptom || onChangeSymptom || (() => {});

  return (
    <View className="bg-white rounded-xl overflow-hidden mb-4 border border-slate-200 shadow-sm shadow-black/5 elevation-2">
      {/* Header */}
      <View className="py-2.5 px-4 bg-slate-100 border-b border-slate-200 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="medkit-outline" size={18} color="#D32F2F" />
          <Text className="text-[15px] font-bold text-slate-800">ผลการตรวจเช็คอาการเสีย</Text>
        </View>
        <View className="bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
          <Text className="text-[11px] font-bold text-[#D32F2F]">โดยช่างซ่อม</Text>
        </View>
      </View>

      <View className="p-4 gap-3.5">
        {/* 1. อาการที่ลูกค้าแจ้งเบื้องต้น (Read-only) */}
        {initialSymptom && (
          <View className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#64748b" />
              <Text className="text-xs font-bold text-slate-600">อาการที่ลูกค้าแจ้งเบื้องต้น:</Text>
            </View>
            <Text className="text-sm text-slate-700 font-body pl-5">{initialSymptom}</Text>
          </View>
        )}

        {/* 2. อาการจริงหลังตรวจเช็ค (ช่างกรอก) */}
        <View>
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center gap-1">
              <Ionicons name="search-circle-outline" size={16} color="#D32F2F" />
              <Text className="text-[13px] font-bold text-slate-800">
                อาการเสียจริงหลังตรวจเช็ค <Text className="text-red-500">*</Text>
              </Text>
            </View>
            <Text className="text-[11px] text-slate-400">ระบุเพื่อใช้ออกใบเสนอราคา</Text>
          </View>

          <TextInput
            className="border border-slate-200 rounded-lg p-3 text-sm text-slate-800 bg-white text-left align-top h-[95px] focus:border-red-500"
            multiline={true}
            numberOfLines={4}
            value={currentActualSymptom}
            onChangeText={handleChange}
            placeholder="ระบุอาการเสียจริงที่ตรวจพบ เช่น เมนบอร์ดช็อตบริเวณภาคจ่ายไฟ, ชิปเซ็ตเสียหาย ต้องซ่อมและเปลี่ยนอะไหล่..."
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>
    </View>
  );
}
