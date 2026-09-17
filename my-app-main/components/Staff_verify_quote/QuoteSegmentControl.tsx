// 1. React & React Native
import { Text, TouchableOpacity, View } from 'react-native';

export type QuoteMode = 'approved' | 'cancelled';

interface QuoteSegmentControlProps {
  activeMode: QuoteMode;
  onChangeMode: (mode: QuoteMode) => void;
}

export default function QuoteSegmentControl({
  activeMode,
  onChangeMode,
}: QuoteSegmentControlProps) {
  return (
    <View className="px-4 py-3 bg-white">
      <View className="flex-row bg-slate-100 rounded-full p-1">
        {/* Approved Mode Tab */}
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-full items-center justify-center ${activeMode === 'approved' ? 'bg-[#D32F2F] shadow-md shadow-[#D32F2F]/20 elevation-3' : ''}`}
          activeOpacity={0.8}
          onPress={() => onChangeMode('approved')}
        >
          <Text
            className={`text-[13px] font-bold ${activeMode === 'approved' ? 'text-white' : 'text-slate-500'}`}
          >
            เสนอราคา(อนุมัติ)
          </Text>
        </TouchableOpacity>

        {/* Cancelled Mode Tab */}
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-full items-center justify-center ${activeMode === 'cancelled' ? 'bg-[#D32F2F] shadow-md shadow-[#D32F2F]/20 elevation-3' : ''}`}
          activeOpacity={0.8}
          onPress={() => onChangeMode('cancelled')}
        >
          <Text
            className={`text-[13px] font-bold ${activeMode === 'cancelled' ? 'text-white' : 'text-slate-500'}`}
          >
            เสนอราคา(ยกเลิก)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
