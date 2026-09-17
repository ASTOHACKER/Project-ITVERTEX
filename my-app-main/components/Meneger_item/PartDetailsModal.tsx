// 1. React & React Native
import { Modal, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface PartDetailsModalProps {
  visible: boolean;
  item: any;
  onClose: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
}

export default function PartDetailsModal({ visible, item, onClose, onEdit, onDelete }: PartDetailsModalProps) {
  if (!item) return null;

  const isPart = item.item_type_id === 1; // 1 = อะไหล่, 2 = ค่าบริการ
  const profit = (item.selling_price || 0) - (item.cost_price || 0);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className="w-full bg-white rounded-2xl p-5 shadow-sm shadow-black/25 elevation-5">
          <View className="flex-row justify-between items-center mb-5 border-b border-slate-200 pb-3">
            <Text className="text-lg font-bold text-slate-800">รายละเอียดรายการ</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View className="mb-6">
            <View className="flex-row justify-between items-start py-2.5">
              <Text className="text-sm text-slate-500 flex-1">รหัสรายการ</Text>
              <Text className="text-sm text-slate-800 flex-[2] text-right">#{item.item_id}</Text>
            </View>

            <View className="flex-row justify-between items-start py-2.5">
              <Text className="text-sm text-slate-500 flex-1">ชื่อรายการ</Text>
              <Text className="text-[15px] font-bold text-slate-800 flex-[2] text-right">{item.item_name}</Text>
            </View>

            <View className="flex-row justify-between items-start py-2.5">
              <Text className="text-sm text-slate-500 flex-1">ประเภท</Text>
              <View className="px-2.5 py-1 rounded-xl self-end" style={{ backgroundColor: isPart ? 'rgba(107, 78, 0, 0.1)' : 'rgba(0, 119, 182, 0.1)' }}>
                <Text className="text-xs font-bold" style={{ color: isPart ? '#6B4E00' : '#0077B6' }}>
                  {isPart ? 'อะไหล่' : 'ค่าบริการ'}
                </Text>
              </View>
            </View>

            <View className="h-px bg-slate-200 my-3" />

            <View className="flex-row justify-between items-start py-2.5">
              <Text className="text-sm text-slate-500 flex-1">ราคา</Text>
              <Text className="text-[16px] font-bold text-[#00B4D8] flex-[2] text-right">
                {item.selling_price !== undefined && item.selling_price !== null
                  ? `${Number(item.selling_price).toLocaleString()} บาท`
                  : '-'}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between gap-2.5">
            <TouchableOpacity
              className="flex-1 flex-row h-11 rounded-lg justify-center items-center border border-[#FFCDD2] bg-[#FFEBEE]"
              onPress={() => onDelete?.(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#D32F2F" />
              <Text className="text-[#D32F2F] font-bold text-sm ml-1">ลบ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row h-11 rounded-lg justify-center items-center border border-slate-200 bg-slate-50"
              onPress={() => onEdit?.(item)}
            >
              <Ionicons name="create-outline" size={18} color="#00B4D8" />
              <Text className="text-[#00B4D8] font-bold text-sm ml-1">แก้ไข</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row h-11 rounded-lg justify-center items-center border border-[#00B4D8] bg-[#00B4D8]"
              onPress={onClose}
            >
              <Text className="text-white font-bold text-sm">ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
