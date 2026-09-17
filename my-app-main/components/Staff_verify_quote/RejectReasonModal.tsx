// 1. React & React Native
import { useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface RejectReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmReject: (reason: string) => void;
}

export default function RejectReasonModal({
  visible,
  onClose,
  onConfirmReject,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    const cleanReason = reason.trim();
    onConfirmReject(cleanReason || 'โปรดตรวจสอบและแก้ไขราคาใหม่');
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/55 justify-center items-center p-5">
        <View className="w-full bg-white rounded-[20px] p-5 gap-3.5 shadow-lg shadow-black/20 elevation-5">
          {/* Header */}
          <View className="flex-row justify-between items-center border-b border-slate-200 pb-3">
            <Text className="text-[17px] font-bold text-[#DC2626]">ตีกลับใบเสนอราคาให้ช่าง</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text className="text-[13px] text-slate-500 leading-[18px]">
            กรุณาระบุเหตุผลการตีกลับใบเสนอราคาเพื่อส่งแจ้งเตือนกลับไปยังช่างผู้รับผิดชอบ
          </Text>

          {/* Reason Input */}
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-slate-800">เหตุผลการตีกลับ</Text>
            <TextInput
              className="border border-slate-200 rounded-lg p-3 text-[13px] text-slate-800 h-20 text-left align-top bg-slate-50"
              value={reason}
              onChangeText={setReason}
              placeholder="เช่น ราคาอะไหล่สูงเกินไป / โปรดตรวจสอบค่าแรงซ่อมใหม่..."
              placeholderTextColor="#A0A0A0"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2.5 mt-1">
            <TouchableOpacity className="flex-1 h-11 rounded-full border border-slate-200 justify-center items-center bg-white" onPress={onClose}>
              <Text className="text-sm font-bold text-slate-800">ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-[1.2] h-11 rounded-full bg-[#DC2626] justify-center items-center" onPress={handleConfirm}>
              <Text className="text-sm font-bold text-white">ยืนยันตีกลับ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
