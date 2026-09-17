// 1. React & React Native
import { Modal, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import type { RepairItem } from './types';

interface RepairDetailsModalProps {
  visible: boolean;
  item: RepairItem | null;
  onClose: () => void;
  onOpenFullDocument?: (item: RepairItem) => void;
}

export default function RepairDetailsModal({
  visible,
  item,
  onClose,
  onOpenFullDocument,
}: RepairDetailsModalProps) {
  if (!item) return null;

  const device =
    [item.brand, item.model].filter(Boolean).join(' ') ||
    item.device ||
    item.device_type ||
    'ไม่ระบุอุปกรณ์';
  const symptom = item.symptom || item.symptoms || item.symptom_details || 'ไม่ระบุอาการเสีย';
  const status = item.status || 'รอตรวจเช็ค';
  const date = item.date || '-';
  const technician = item.technician || 'ช่างประจำศูนย์';

  const getStatusColor = (statusName: string) => {
    switch (statusName) {
      case 'รอลูกค้ารับเครื่อง':
      case 'เสร็จสิ้น':
        return '#22C55E';
      case 'ยกเลิกซ่อม':
        return '#EF4444';
      default:
        return '#BAD80A';
    }
  };

  const statusColor = getStatusColor(status);

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className="w-full bg-white rounded-2xl p-5 shadow-sm shadow-black/25 elevation-5">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-5 pb-3 border-b border-slate-200">
            <Text className="text-lg font-bold text-slate-800">รายละเอียดใบส่งซ่อม</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Details Container */}
          <View className="mb-6">
            <View className="flex-row justify-between items-start py-2">
              <Text className="text-sm text-slate-500 flex-1">เลขใบส่งซ่อม</Text>
              <Text className="text-[15px] font-bold text-[#E53E3E] flex-[2] text-right">{item.job_no}</Text>
            </View>

            <View className="flex-row justify-between items-start py-2">
              <Text className="text-sm text-slate-500 flex-1">ชื่อลูกค้า</Text>
              <Text className="text-sm text-slate-800 flex-[2] text-right">{item.customer_name}</Text>
            </View>

            <View className="flex-row justify-between items-start py-2">
              <Text className="text-sm text-slate-500 flex-1">เบอร์โทรศัพท์</Text>
              <Text className="text-sm text-slate-800 flex-[2] text-right">{item.phone}</Text>
            </View>

            <View className="h-px bg-slate-200 my-2.5" />

            <View className="flex-row justify-between items-start py-2">
              <Text className="text-sm text-slate-500 flex-1">อุปกรณ์</Text>
              <Text className="text-sm text-slate-800 flex-[2] text-right">{device}</Text>
            </View>

            <View className="flex-row justify-between items-start py-2">
              <Text className="text-sm text-slate-500 flex-1">อาการที่ลูกค้าแจ้ง</Text>
              <Text className="text-sm text-slate-700 flex-[2] text-right">{symptom}</Text>
            </View>

            {item.actual_symptom ? (
              <View className="flex-row justify-between items-start py-2 bg-amber-50/70 p-2 rounded-lg border border-amber-100 my-0.5">
                <Text className="text-sm font-bold text-amber-800 flex-1">อาการจริงหลังตรวจ</Text>
                <Text className="text-sm font-bold text-[#D32F2F] flex-[2] text-right">{item.actual_symptom}</Text>
              </View>
            ) : null}

            <View className="flex-row justify-between items-start py-2">
              <Text className="text-sm text-slate-500 flex-1">วันที่ส่งซ่อม</Text>
              <Text className="text-sm text-slate-800 flex-[2] text-right">{date}</Text>
            </View>

            <View className="h-px bg-slate-200 my-2.5" />

            <View className="flex-row justify-between items-start py-2">
              <Text className="text-sm text-slate-500 flex-1">ช่างผู้รับผิดชอบ</Text>
              <Text className="text-sm text-slate-800 flex-[2] text-right">{technician}</Text>
            </View>

            <View className="flex-row justify-between items-start py-2">
              <Text className="text-sm text-slate-500 flex-1">สถานะการทำงาน</Text>
              <View className="px-2.5 py-1 rounded-xl self-end" style={{ backgroundColor: `${statusColor}15` }}>
                <Text className="text-xs font-bold" style={{ color: statusColor }}>{status}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2.5">
            {onOpenFullDocument && (
              <TouchableOpacity
                className="flex-[1.5] bg-[#D32F2F] h-11 rounded-xl justify-center items-center shadow-sm active:opacity-90 flex-row gap-1.5"
                onPress={() => {
                  onClose();
                  onOpenFullDocument(item);
                }}
              >
                <Ionicons name="document-text-outline" size={17} color="#ffffff" />
                <Text className="text-[13px] font-bold text-white">ดูใบรับซ่อม (แก้ไขสถานะ)</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity className="flex-1 bg-slate-100 h-11 rounded-xl justify-center items-center active:opacity-80 border border-slate-200" onPress={onClose}>
              <Text className="text-sm font-semibold text-slate-700">ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
