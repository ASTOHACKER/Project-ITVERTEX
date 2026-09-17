// 1. React & React Native
import { Text, View } from 'react-native';

// 2. Third-party / Expo
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface SignaturesCardProps {
  customerName?: string;
  customerSignature?: string | null;
  // Keep optional backward compatibility props so existing calls don't break
  staffName?: string;
  techInspectName?: string;
  techRepairName?: string;
  staffSignature?: string | null;
  techInspectSignature?: string | null;
  techRepairSignature?: string | null;
}

export default function SignaturesCard({
  customerName,
  customerSignature,
}: SignaturesCardProps) {
  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm shadow-black/5 elevation-2">
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className="text-sm font-bold text-slate-800">ลายเซ็นรับเครื่อง / RECEIVE SIGNATURE</Text>
        {customerSignature ? (
          <View className="flex-row items-center bg-emerald-50 px-2 py-0.5 rounded-full">
            <Ionicons name="checkmark-circle" size={13} color="#059669" style={{ marginRight: 4 }} />
            <Text className="text-[11px] font-bold text-emerald-700">เซ็นรับเครื่องแล้ว</Text>
          </View>
        ) : (
          <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-full">
            <Ionicons name="time-outline" size={13} color="#d97706" style={{ marginRight: 4 }} />
            <Text className="text-[11px] font-bold text-amber-700">ยังไม่ได้รับเครื่อง</Text>
          </View>
        )}
      </View>

      <View className="h-px bg-slate-100 mb-3" />

      {/* Customer Receive Signature Box */}
      <View className="items-center">
        {customerSignature ? (
          <View className="w-full h-[90px] bg-slate-50 border border-slate-200 rounded-xl items-center justify-center p-2">
            <Image
              source={{ uri: customerSignature }}
              style={{ width: '100%', height: 74 }}
              contentFit="contain"
            />
          </View>
        ) : (
          <View className="w-full h-[80px] bg-slate-50 border border-dashed border-slate-300 rounded-xl items-center justify-center">
            <Ionicons name="pencil-outline" size={20} color="#94a3b8" />
            <Text className="text-xs text-slate-400 mt-1 font-body">— รอลูกค้าเซ็นรับเครื่องเมื่อส่งมอบ —</Text>
          </View>
        )}
      </View>
    </View>
  );
}
