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
              <Text className="text-base font-bold text-[#DC2626] flex-[2] text-right font-heading">
                {item.selling_price !== undefined && item.selling_price !== null
                  ? `${Number(item.selling_price).toLocaleString()} บาท`
                  : '-'}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between gap-2.5">
            <TouchableOpacity
              className="flex-1 flex-row h-12 rounded-xl justify-center items-center border border-red-200 bg-red-50 active:bg-red-100"
              onPress={() => onDelete?.(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
              <Text className="text-[#DC2626] font-bold text-sm ml-1 font-heading">ลบ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row h-12 rounded-xl justify-center items-center border border-sky-200 bg-sky-50 active:bg-sky-100"
              onPress={() => onEdit?.(item)}
            >
              <Ionicons name="create-outline" size={18} color="#0284C7" />
              <Text className="text-[#0284C7] font-bold text-sm ml-1 font-heading">แก้ไข</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row h-12 rounded-xl justify-center items-center bg-slate-800 active:bg-slate-900 shadow-sm"
              onPress={onClose}
            >
              <Text className="text-white font-bold text-sm font-heading">ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
