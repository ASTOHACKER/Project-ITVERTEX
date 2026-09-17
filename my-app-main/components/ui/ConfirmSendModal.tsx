// 1. React & React Native
import { Modal, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface ConfirmSendModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function ConfirmSendModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
}: ConfirmSendModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/55 justify-center items-center p-6">
        <View className="w-full bg-white rounded-[20px] p-6 items-center gap-3 shadow-lg shadow-black/20 elevation-5">
          {/* Icon Header */}
          <View className="w-[60px] h-[60px] rounded-full bg-red-50 justify-center items-center mb-1">
            <Ionicons name="paper-plane" size={28} color="#D32F2F" />
          </View>

          {/* Title & Subtitle */}
          <Text className="text-lg font-bold text-slate-800">ยืนยันส่งใบเสนอราคา</Text>
          <Text className="text-[13px] text-slate-500 text-center leading-5">
            คุณต้องการส่งใบเสนอราคาให้ลูกค้าพิจารณาใช่หรือไม่?
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-2 w-full">
            <TouchableOpacity 
              disabled={loading}
              className={`flex-1 h-11 rounded-full border border-slate-200 justify-center items-center bg-white ${loading ? 'opacity-50' : 'active:bg-slate-100'}`} 
              onPress={onClose}
            >
              <Text className="text-sm font-bold text-slate-800">ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              disabled={loading}
              className={`flex-[1.4] h-11 rounded-full bg-[#D32F2F] justify-center items-center ${loading ? 'opacity-60' : 'active:opacity-90'}`} 
              onPress={onConfirm}
            >
              <Text className="text-sm font-bold text-white">
                {loading ? 'กำลังส่ง...' : 'ยืนยันส่งให้ลูกค้า'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
