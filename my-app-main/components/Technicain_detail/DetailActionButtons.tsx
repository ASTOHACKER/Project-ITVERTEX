// 1. React & React Native
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface DetailActionButtonsProps {
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
  loading?: boolean;
}

export default function DetailActionButtons({
  onConfirm,
  onCancel,
  visible,
  loading = false,
}: DetailActionButtonsProps) {
  if (!visible) return null;

  return (
    <View className="flex-row gap-3 mt-4">
      <TouchableOpacity
        className={`flex-1 bg-[#D32F2F] h-[44px] rounded-xl justify-center items-center shadow-sm active:opacity-90 ${loading ? 'opacity-60' : ''}`}
        onPress={onConfirm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-white font-bold text-sm">ยืนยันการเปลี่ยนสถานะ</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 bg-slate-100 border border-slate-300 h-[44px] rounded-xl justify-center items-center active:opacity-80 ${loading ? 'opacity-60' : ''}`}
        onPress={onCancel}
        disabled={loading}
      >
        <Text className="text-slate-700 font-semibold text-sm">ยกเลิก</Text>
      </TouchableOpacity>
    </View>
  );
}
