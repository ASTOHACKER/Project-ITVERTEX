// 1. React & React Native
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

// 3. API helpers
import { updateStaff, getStaff, deleteStaff } from '@/lib/api';

// 4. Components
import Header from '@/components/Shared_Dashboard/Header';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import EditStaffModal from '@/components/Meneger_staff/EditStaffModal';
import StaffTable from '@/components/Meneger_staff/Table';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import CustomAlert from '@/components/ui/CustomAlert';

import type { StaffMember, StaffRoleThai } from '@/types/user';

const roleToThai = (role_id?: number | string | null): StaffRoleThai => {
  const r = Number(role_id);
  switch (r) {
    case 3: return 'ช่าง';
    case 4: return 'ลูกค้า';
    case 2:
    default: return 'พนักงาน';
  }
};

const roleToDb = (role: StaffRoleThai): number => {
  switch (role) {
    case 'ช่าง': return 3;
    case 'ลูกค้า': return 4;
    default: return 2;
  }
};

const roleFilters = ['ALL', 'พนักงาน', 'ช่าง', 'ลูกค้า'] as const;
const labelMap: Record<string, string> = {
  ALL: 'ทั้งหมด',
  'พนักงาน': 'พนักงาน',
  'ช่าง': 'ช่าง',
  'ลูกค้า': 'ลูกค้า',
};

export default function StaffScreen() {
  const [searchText, setSearchText] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | StaffRoleThai>('ALL');

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [])
  );

  const showAlert = (title: string, message: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
    });
  };

  async function fetchStaff() {
    try {
      setIsLoading(true);
      const res = await getStaff();
      if (!res.success) throw new Error(res.message);

      const staff: StaffMember[] = (res.data || [])
        .filter((p: any) => Number(p.role_id) !== 1)
        .map((p: any) => {
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          return {
            id: p.id,
            name: fullName || p.email || 'ไม่ระบุชื่อ',
            role: roleToThai(p.role_id),
            phone: p.phone || 'ไม่ระบุเบอร์',
            email: p.email || '',
            first_name: p.first_name || '',
            last_name: p.last_name || '',
          };
        });

      setStaffList(staff);
    } catch (e: any) {
      console.error('Staff fetch error:', e.message);
      showAlert('ล้มเหลว', 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน', 'danger');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredStaff = staffList.filter((member) => {
    const search = searchText.toLowerCase();
    const matchesSearch =
      member.name.toLowerCase().includes(search) ||
      (member.phone || '').includes(search) ||
      (member.email || '').toLowerCase().includes(search);
    const matchesRole = selectedRoleFilter === 'ALL' || member.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditStaff = (member: StaffMember) => {
    setEditingMember(member);
    setIsEditModalVisible(true);
  };

  const handlePromptDelete = (member: StaffMember) => {
    setIsEditModalVisible(false);
    setEditingMember(null);
    setMemberToDelete(member);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteStaff(memberToDelete.id);
      if (!res.success) throw new Error(res.message);

      setIsDeleteModalVisible(false);
      showAlert('สำเร็จ', `ลบข้อมูล "${memberToDelete.name}" เรียบร้อยแล้ว`, 'success');
      setMemberToDelete(null);
      await fetchStaff();
    } catch (e: any) {
      setIsDeleteModalVisible(false);
      showAlert('ไม่สามารถลบข้อมูลได้', e.message || 'ไม่สามารถลบข้อมูลได้', 'danger');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveStaff = async (updatedMember: StaffMember) => {
    setIsSaving(true);
    try {
      const payload = {
        first_name: updatedMember.first_name ?? '',
        last_name: updatedMember.last_name ?? '',
        role_id: roleToDb(updatedMember.role),
        phone: updatedMember.phone,
      };

      const res = await updateStaff(updatedMember.id, payload);

      if (!res.success) throw new Error(res.message);

      showAlert('สำเร็จ', 'อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว', 'success');
      setIsEditModalVisible(false);
      setEditingMember(null);
      await fetchStaff();
    } catch (e: any) {
      showAlert('ล้มเหลว', e.message || 'ไม่สามารถอัปเดตข้อมูลได้', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-bg">
      <Header title="IT VERTEX" subtitle="จัดการพนักงาน" />
      <View className="flex-1 p-4">
        <SearchFilterBar
          value={searchText}
          onChangeText={setSearchText}
          onPressFilter={() => []}
        />

        {/* Filter Chips */}
        <View className="mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8 }}>
            {roleFilters.map((r) => {
              const isActive = selectedRoleFilter === r;
              return (
                <TouchableOpacity
                  key={r}
                  className={`px-3.5 py-1.5 rounded-full border ${isActive ? 'bg-primary border-primary' : 'bg-white border-app-border'}`}
                  onPress={() => setSelectedRoleFilter(r)}
                >
                  <Text className={`text-[13px] ${isActive ? 'text-white font-bold font-heading' : 'text-text-dark font-body'}`}>
                    {labelMap[r]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#D62828" />
            <Text className="mt-3 font-body text-sm text-text-light">กำลังโหลดรายชื่อพนักงาน...</Text>
          </View>
        ) : filteredStaff.length === 0 ? (
          <View className="items-center justify-center py-[60px]">
            <Ionicons name="people-outline" size={48} color="#888888" />
            <Text className="mt-3 font-body text-sm text-text-light">ไม่พบรายชื่อพนักงาน</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
            <StaffTable
              title="รายชื่อบุคลากรและลูกค้าในระบบ" 
              data={filteredStaff}
              headerColor="#0F172A"
              onPressDetails={handleEditStaff}
              onPressDelete={handlePromptDelete}
            />
          </ScrollView>
        )}
      </View>

      {/* Modal แก้ไขข้อมูลพนักงาน */}
      <EditStaffModal
        visible={isEditModalVisible}
        item={editingMember}
        isSaving={isSaving}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingMember(null);
        }}
        onSave={handleSaveStaff}
        onDelete={handlePromptDelete}
      />

      {/* Modal ยืนยันการลบพนักงาน */}
      <ConfirmDeleteModal
        visible={isDeleteModalVisible}
        title="ยืนยันการลบผู้ใช้งาน"
        itemName={memberToDelete ? `${memberToDelete.name} (${memberToDelete.role})` : undefined}
        message="ระบบจะตรวจสอบว่าผู้ใช้งานมีหนี้สินค้างชำระ หรืองานซ่อมที่ยังดำเนินการอยู่หรือไม่ หากมีจะไม่สามารถลบได้ คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?"
        confirmText="ยืนยันการลบ"
        cancelText="ยกเลิก"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteModalVisible(false);
            setMemberToDelete(null);
          }
        }}
      />

      {/* แจ้งเตือนผลลัพธ์การทำงาน */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

