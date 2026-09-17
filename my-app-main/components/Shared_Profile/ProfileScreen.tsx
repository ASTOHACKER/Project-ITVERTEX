// 1. React & React Native
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. Auth helpers & Components
import { getCurrentUser, logout } from '@/lib/auth';
import ConfirmLogoutModal from '@/components/ui/ConfirmLogoutModal';

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
  const [logoutSuccess, setLogoutSuccess] = useState(false);

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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace((roleConfig.fallbackBackRoute || '/(customer)') as any);
    }
  };

  const handleLogout = () => {
    setLogoutSuccess(false);
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutSuccess(true);
      setTimeout(() => {
        router.replace('/(auth)/login');
        setTimeout(() => {
          setLogoutModalVisible(false);
          setLogoutSuccess(false);
          setLoggingOut(false);
        }, 500);
      }, 1200);
    } catch (err) {
      console.error('Logout error:', err);
      setLoggingOut(false);
      setLogoutModalVisible(false);
    }
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
            <Text className="text-base font-bold text-slate-800 mb-4">ข้อมูลส่วนตัว</Text>

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
        success={logoutSuccess}
        onConfirm={confirmLogout}
        onCancel={() => !loggingOut && !logoutSuccess && setLogoutModalVisible(false)}
      />
    </View>
  );
}
