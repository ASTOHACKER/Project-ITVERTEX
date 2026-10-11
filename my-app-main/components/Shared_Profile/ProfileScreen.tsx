// 1. React & React Native
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. Auth helpers & Components
import { getCurrentUser, logout, updateProfile } from '@/lib/auth';
import ConfirmLogoutModal from '@/components/ui/ConfirmLogoutModal';
import SuccessToast from '@/components/ui/SuccessToast';

// ── Role configuration type ──
export interface RoleConfig {
  /** Badge text e.g. "Technician", "Staff" */
  roleBadge: string;
  /** Thai label e.g. "ช่างซ่อม / ตรวจเช็ค (Technician)" */
  roleLabel: string;
  /** Ionicons icon name for header badge */
  roleIcon: keyof typeof Ionicons.glyphMap;
  /** Tailwind classes for role badge in info card e.g. "text-blue-600 bg-blue-50" */
  badgeColorClass: string;
  /** Fallback initial when user has no name */
  fallbackInitial: string;
  /** Fallback display name */
  fallbackName: string;
  /** Show back button (for shared/standalone profile route) */
  showBackButton?: boolean;
  /** Fallback route when back is pressed but can't go back */
  fallbackBackRoute?: string;
}

interface SharedProfileScreenProps {
  roleConfig: RoleConfig;
}

export default function SharedProfileScreen({ roleConfig }: SharedProfileScreenProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [toastUserSubtitle, setToastUserSubtitle] = useState('');

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace('/(auth)/login');
        return;
      }
      setUser(currentUser);
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenEdit = () => {
    setEditFirstName(user?.first_name || '');
    setEditLastName(user?.last_name || '');
    setEditPhone(user?.phone || '');
    setEditError('');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim()) {
      setEditError('กรุณากรอกชื่อ');
      return;
    }
    const cleanPhone = editPhone.replace(/[^0-9]/g, '');
    if (cleanPhone && (cleanPhone.length < 9 || cleanPhone.length > 10)) {
      setEditError('เบอร์โทรศัพท์ต้องมี 9-10 หลัก');
      return;
    }

    try {
      setIsSaving(true);
      setEditError('');
      const res = await updateProfile({
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: cleanPhone,
      });

      if (res?.data) {
        setUser((prev: any) => ({
          ...prev,
          ...res.data,
        }));
      } else {
        setUser((prev: any) => ({
          ...prev,
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          phone: cleanPhone,
        }));
      }

      setEditModalVisible(false);
      setShowSaveToast(true);
    } catch (err: any) {
      setEditError(err.response?.data?.message || err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };


  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace((roleConfig.fallbackBackRoute || '/(customer)') as any);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      const displayName = user
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
        : 'ผู้ใช้งาน';
      const roleText = roleConfig.roleLabel || user?.role_name || '';
      const sub = roleText ? `${displayName} • ${roleText}` : displayName;

      setToastUserSubtitle(sub);
      await logout();
      setLogoutModalVisible(false);
      setShowLogoutToast(true);
    } catch (err) {
      console.error('Logout error:', err);
      setLogoutModalVisible(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogoutToastHide = () => {
    setShowLogoutToast(false);
    router.replace('/(auth)/login');
  };

  const getInitials = () => {
    if (!user) return roleConfig.fallbackInitial;
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase() || roleConfig.fallbackInitial;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text className="mt-3 text-slate-500 text-sm">กำลังโหลดข้อมูลโปรไฟล์...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />

      <ScrollView className="flex-1" bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header Section */}
        <View className="bg-[#D32F2F] pb-10 pt-2 px-5 rounded-b-3xl">
          <SafeAreaView edges={['top']}>
            <View className="flex-row items-center justify-between mb-4">
              {roleConfig.showBackButton ? (
                <TouchableOpacity
                  onPress={handleBack}
                  activeOpacity={0.7}
                  className="flex-row items-center py-2 pr-4 self-start"
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                  <Text className="text-white text-base font-semibold ml-0.5">กลับ</Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-white text-2xl font-bold">IT VERTEX</Text>
              )}
              <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center">
                <Ionicons
                  name={roleConfig.roleIcon}
                  size={14}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
                <Text className="text-white text-xs font-bold">{roleConfig.roleBadge}</Text>
              </View>
            </View>

            <View className="items-center mt-2">
              <View className="w-20 h-20 rounded-full bg-white justify-center items-center mb-3 shadow-md shadow-black/10">
                <Text className="text-2xl font-bold text-[#D32F2F]">{getInitials()}</Text>
              </View>
              <Text className="text-xl font-bold text-white mb-1">
                {user?.first_name || roleConfig.fallbackName} {user?.last_name || ''}
              </Text>
              <Text className="text-red-100 text-sm">{user?.email || '-'}</Text>
            </View>
          </SafeAreaView>
        </View>

        {/* Profile Info Card */}
        <View className="px-5 -mt-6">
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-slate-800">ข้อมูลส่วนตัว</Text>
              <TouchableOpacity
                onPress={handleOpenEdit}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200"
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={13} color="#DC2626" />
                <Text className="text-xs font-bold text-[#DC2626]">แก้ไขข้อมูล</Text>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <View className="py-2.5 border-b border-slate-100 flex-row justify-between items-center">
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="person-outline" size={18} color="#64748b" />
                <Text className="text-sm text-slate-500">ชื่อ-นามสกุล</Text>
              </View>
              <Text className="text-sm font-semibold text-slate-800">
                {user?.first_name || '-'} {user?.last_name || ''}
              </Text>
            </View>

            {/* Role */}
            <View className="py-2.5 border-b border-slate-100 flex-row justify-between items-center">
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="shield-outline" size={18} color="#64748b" />
                <Text className="text-sm text-slate-500">บทบาท</Text>
              </View>
              <Text className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${roleConfig.badgeColorClass}`}>
                {roleConfig.roleLabel}
              </Text>
            </View>

            {/* Phone */}
            <View className="py-2.5 border-b border-slate-100 flex-row justify-between items-center">
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="call-outline" size={18} color="#64748b" />
                <Text className="text-sm text-slate-500">เบอร์โทรศัพท์</Text>
              </View>
              <Text className="text-sm font-semibold text-slate-800">
                {user?.phone || 'ไม่ระบุ'}
              </Text>
            </View>

            {/* Email */}
            <View className="py-2.5 flex-row justify-between items-center">
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="mail-outline" size={18} color="#64748b" />
                <Text className="text-sm text-slate-500">อีเมล</Text>
              </View>
              <Text className="text-sm font-semibold text-slate-800">
                {user?.email || '-'}
              </Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="w-full bg-red-50 border border-red-200 h-[52px] rounded-2xl flex-row justify-center items-center shadow-sm active:bg-red-100"
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text className="text-[#DC2626] font-bold text-base font-heading">ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isSaving && setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/50 justify-center items-center px-4"
        >
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                  <Ionicons name="person" size={16} color="#DC2626" />
                </View>
                <Text className="text-base font-bold text-slate-800">แก้ไขข้อมูลส่วนตัว</Text>
              </View>
              <TouchableOpacity
                onPress={() => !isSaving && setEditModalVisible(false)}
                disabled={isSaving}
              >
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {editError ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-xs text-red-600 flex-1">{editError}</Text>
              </View>
            ) : null}

            <View className="gap-3 mb-5">
              <View>
                <Text className="text-xs font-medium text-slate-600 mb-1">ชื่อ *</Text>
                <TextInput
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="กรอกชื่อ"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              <View>
                <Text className="text-xs font-medium text-slate-600 mb-1">นามสกุล</Text>
                <TextInput
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="กรอกนามสกุล"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>

              <View>
                <Text className="text-xs font-medium text-slate-600 mb-1">เบอร์โทรศัพท์ (9-10 หลัก)</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="0812345678"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl border border-slate-200 items-center justify-center"
              >
                <Text className="text-sm font-semibold text-slate-600">ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-[#DC2626] items-center justify-center active:bg-red-700"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-bold text-white">บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Save Success Toast */}
      <SuccessToast
        visible={showSaveToast}
        message="บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว"
        type="success"
        icon="checkmark-circle-outline"
        duration={1500}
        onHide={() => setShowSaveToast(false)}
      />

      {/* Enhanced Success Toast on Logout */}
      <SuccessToast
        visible={showLogoutToast}
        message="ออกจากระบบเสร็จสิ้น"
        subtitle={toastUserSubtitle}
        type="logout"
        icon="log-out-outline"
        duration={1500}
        showProgress={true}
        onHide={handleLogoutToastHide}
      />

      {/* Confirm Logout Modal Component */}
      <ConfirmLogoutModal
        visible={logoutModalVisible}
        userName={
          user
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
            : undefined
        }
        userRole={roleConfig.roleLabel || user?.role_name}
        loading={loggingOut}
        onConfirm={confirmLogout}
        onCancel={() => !loggingOut && setLogoutModalVisible(false)}
      />
    </View>
  );
}
