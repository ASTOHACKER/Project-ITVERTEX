// 1. React & React Native
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

// 3. API helpers
import { updateItem, createItem } from '@/lib/api';

interface AddPartModalProps {
  visible: boolean;
  itemToEdit?: any | null; // ถ้ามีค่าแสดงว่าอยู่ในโหมดแก้ไข
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPartModal({ visible, itemToEdit, onClose, onSuccess }: AddPartModalProps) {
  const [itemType, setItemType] = useState<'parts' | 'services'>('parts');
  const [itemName, setItemName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setItemType(itemToEdit.item_type_id === 2 ? 'services' : 'parts');
      setItemName(itemToEdit.item_name || '');
      setSellingPrice(itemToEdit.selling_price ? String(itemToEdit.selling_price) : '');
    } else {
      resetForm();
    }
  }, [itemToEdit, visible]);

  const resetForm = () => {
    setItemType('parts');
    setItemName('');
    setSellingPrice('');
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSave = async () => {
    if (loading) return;
    if (!itemName.trim()) {
      showAlert('ข้อผิดพลาด', 'กรุณากรอกชื่อรายการ');
      return;
    }
    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showAlert('ข้อผิดพลาด', 'ราคาขายต้องเป็นตัวเลขและไม่เป็นค่าติดลบ');
      return;
    }

    const payload = {
      item_name: itemName.trim(),
      item_type_id: itemType === 'parts' ? 1 : 2,
      selling_price: priceNum,
    };

    setLoading(true);
    try {
      if (itemToEdit) {
        // Mode: Update
        const res = await updateItem(itemToEdit.item_id, payload);
        if (!res.success) throw new Error(res.message);
        showAlert('สำเร็จ', 'แก้ไขข้อมูลรายการเรียบร้อยแล้ว');
      } else {
        // Mode: Insert
        const res = await createItem(payload);
        if (!res.success) throw new Error(res.message);
        showAlert('สำเร็จ', 'เพิ่มรายการใหม่เรียบร้อยแล้ว');
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Save item error:', err);
      showAlert('ล้มเหลว', err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/50 justify-center items-center p-5"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="w-full bg-white rounded-2xl p-5 shadow-sm shadow-black/25 elevation-5">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-slate-800">
              {itemToEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-800 mb-2">ประเภท</Text>
            <View className="flex-row items-center py-1">
              <TouchableOpacity
                className="flex-row items-center mr-6"
                activeOpacity={0.7}
                onPress={() => setItemType('parts')}
                disabled={loading}
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${itemType === 'parts' ? 'border-[#00B4D8]' : 'border-slate-200'}`}>
                  {itemType === 'parts' && <View className="w-2.5 h-2.5 rounded-full bg-[#00B4D8]" />}
                </View>
                <Text className="text-[15px] text-slate-800">อะไหล่</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center mr-6"
                activeOpacity={0.7}
                onPress={() => setItemType('services')}
                disabled={loading}
              >
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${itemType === 'services' ? 'border-[#00B4D8]' : 'border-slate-200'}`}>
                  {itemType === 'services' && <View className="w-2.5 h-2.5 rounded-full bg-[#00B4D8]" />}
                </View>
                <Text className="text-[15px] text-slate-800">ค่าบริการ</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-800 mb-2">ชื่อรายการ</Text>
            <TextInput
              className="border border-slate-200 rounded-lg px-3 h-11 bg-slate-50 text-slate-800"
              placeholder="กรอกชื่อรายการ"
              placeholderTextColor="#94a3b8"
              value={itemName}
              onChangeText={setItemName}
              editable={!loading}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-800 mb-2">ราคาขาย (บาท)</Text>
            <TextInput
              className="border border-slate-200 rounded-lg px-3 h-11 bg-slate-50 text-slate-800"
              placeholder="กรอกราคาขาย"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
              value={sellingPrice}
              onChangeText={(text) => setSellingPrice(text.replace(/[^0-9.]/g, ''))}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            className={`bg-[#00B4D8] py-3.5 rounded-lg items-center mt-2.5 ${loading ? 'opacity-70' : ''}`}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base">
                {itemToEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
