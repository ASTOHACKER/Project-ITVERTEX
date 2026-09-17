// 1. React & React Native
import { Modal, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface ReceiptPreviewModalProps {
  visible: boolean;
  jobNo: string;
  customerName: string;
  device: string;
  symptom: string;
  dateStr: string;
  onEdit: () => void;
  onConfirmAndPrint: () => void;
}

export default function ReceiptPreviewModal({
  visible,
  jobNo,
  customerName,
  device,
  symptom,
  dateStr,
  onEdit,
  onConfirmAndPrint,
}: ReceiptPreviewModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl p-5 gap-4">
          {/* Header Icon + Title */}
          <View className="flex-row items-center gap-2">
            <Ionicons name="document-text" size={24} color="#00B4D8" />
            <Text className="text-base font-bold text-slate-800">ตัวอย่างใบรับซ่อม</Text>
          </View>

          {/* Receipt Preview Card */}
          <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 items-center">
            {/* IT VERTEX Brand Title */}
            <Text className="text-xl font-bold text-[#00B4D8]">IT VERTEX</Text>
            <Text className="text-[11px] text-slate-500 mt-0.5 mb-2.5">ใบรับซ่อมอุปกรณ์ IT</Text>

            <View className="w-full h-px bg-slate-200 mb-3" />

            {/* Fields */}
            <View className="w-full flex-row justify-between py-1">
              <Text className="text-[13px] text-slate-500">เลขใบซ่อม:</Text>
              <Text className="text-[13px] font-bold text-slate-800">{jobNo}</Text>
            </View>

            <View className="w-full flex-row justify-between py-1">
              <Text className="text-[13px] text-slate-500">วันที่:</Text>
              <Text className="text-[13px] text-slate-800">{dateStr}</Text>
            </View>

            <View className="w-full flex-row justify-between py-1">
              <Text className="text-[13px] text-slate-500">ลูกค้า:</Text>
              <Text className="text-[13px] text-slate-800">{customerName}</Text>
            </View>

            <View className="w-full flex-row justify-between py-1">
              <Text className="text-[13px] text-slate-500">อุปกรณ์:</Text>
              <Text className="text-[13px] text-slate-800">{device}</Text>
            </View>

            <View className="w-full flex-row justify-between py-1">
              <Text className="text-[13px] text-slate-500">อาการ:</Text>
              <Text className="text-[13px] text-slate-800">{symptom}</Text>
            </View>
          </View>

          {/* Actions Row */}
          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity className="flex-1 h-11 border border-slate-200 rounded-full justify-center items-center bg-white" onPress={onEdit}>
              <Text className="text-sm font-bold text-slate-800">แก้ไข</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-[1.5] h-11 bg-[#00B4D8] rounded-full justify-center items-center" onPress={onConfirmAndPrint}>
              <Text className="text-sm font-bold text-white">ยืนยันและพิมพ์</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
