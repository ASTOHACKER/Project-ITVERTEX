// 1. React & React Native
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface ProfileActionsProps {
  onPressLogout?: () => void;
}

export default function ProfileActions({ onPressLogout }: ProfileActionsProps) {
  return (
    <View className="bg-white rounded-2xl px-4 py-2 mx-5 mt-4 shadow-sm border border-slate-100">
      {/* Logout */}
      <TouchableOpacity
        className="flex-row items-center justify-between py-3 px-1"
        activeOpacity={0.7}
        onPress={onPressLogout}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-red-50 justify-center items-center">
            <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          </View>
          <Text className="text-[15px] font-bold text-red-600">ออกจากระบบ</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
      </TouchableOpacity>
    </View>
  );
}
