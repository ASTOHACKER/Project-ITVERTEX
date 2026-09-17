// 1. React & React Native
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Dropdown } from 'react-native-element-dropdown';

type StaffRoleThai = 'พนักงาน' | 'ช่าง' | 'ลูกค้า';

interface StaffMember {
  id: string;
  name: string;
  role: StaffRoleThai;
  phone: string;
  first_name?: string;
  last_name?: string;
}

interface EditStaffModalProps {
  visible: boolean;
  item: StaffMember | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (updatedItem: StaffMember) => void;
}

const roleData = [
  { label: 'พนักงาน (Staff)', value: 'พนักงาน' },
  { label: 'ช่าง (Technician)', value: 'ช่าง' },

  { label: 'ลูกค้า (Customer)', value: 'ลูกค้า' },
];

export default function EditStaffModal({ visible, item, isSaving, onClose, onSave }: EditStaffModalProps) {
  const [role, setRole] = useState<StaffRoleThai>('พนักงาน');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (item) {
      setRole(item.role);
      setName(item.name);
      setPhone(item.phone);
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!item) return;
    const trimmedName = name.trim();
    const spaceIndex = trimmedName.indexOf(' ');
    const firstName = spaceIndex !== -1 ? trimmedName.substring(0, spaceIndex).trim() : trimmedName;
    const lastName = spaceIndex !== -1 ? trimmedName.substring(spaceIndex + 1).trim() : '';

    onSave({
      ...item,
      role,
      name: trimmedName,
      phone,
      first_name: firstName,
      last_name: lastName,
    });
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/50 justify-center items-center p-5"
      >
        <View className="w-full bg-white rounded-2xl p-5 shadow-sm shadow-black/25 elevation-5">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-slate-800">แก้ไขข้อมูลพนักงาน</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="mb-5">
            {/* Role Dropdown */}
            <View className="mb-4">
              <Text className="text-sm text-slate-800 mb-2">บทบาท (Role) *</Text>
              <Dropdown
                style={{ height: 44, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#ffffff' }}
                selectedTextStyle={{ fontSize: 14, color: '#1E293B' }}
                itemTextStyle={{ fontSize: 14, color: '#1E293B' }}
                containerStyle={{ borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}
                data={roleData}
                maxHeight={200}
                labelField="label"
                valueField="value"
                value={role}
                onChange={(itemVal) => {
                  setRole(itemVal.value as any);
                }}
              />
            </View>

            {/* Name Input (Read-only) */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-sm text-slate-800">ชื่อ-นามสกุล</Text>
                <Text className="text-[11px] text-slate-400">(อ่านอย่างเดียว)</Text>
              </View>
              <TextInput
                className="border border-slate-200 rounded-lg px-3 h-11 bg-slate-100 text-slate-500 text-sm font-medium"
                editable={false}
                value={name}
              />
            </View>

            {/* Phone Input (Read-only) */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-sm text-slate-800">เบอร์โทรศัพท์</Text>
                <Text className="text-[11px] text-slate-400">(อ่านอย่างเดียว)</Text>
              </View>
              <TextInput
                className="border border-slate-200 rounded-lg px-3 h-11 bg-slate-100 text-slate-500 text-sm font-medium"
                editable={false}
                value={phone}
              />
              <Text className="text-[11px] text-slate-400 mt-1.5">
                * ผู้จัดการสามารถปรับเปลี่ยนได้เฉพาะบทบาทการทำงาน (Role) ของพนักงานเท่านั้น
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row gap-2.5 mt-2.5">
            <TouchableOpacity className="flex-1 h-12 rounded-xl border border-slate-200 bg-white justify-center items-center active:bg-slate-50" onPress={onClose} disabled={isSaving}>
              <Text className="text-sm font-bold text-slate-600 font-heading">ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-[1.3] h-12 rounded-xl bg-[#DC2626] justify-center items-center shadow-sm active:opacity-90 ${isSaving ? 'opacity-70' : ''}`}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className="text-sm font-bold text-white font-heading">บันทึกการแก้ไข</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
