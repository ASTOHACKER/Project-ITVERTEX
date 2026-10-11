// 1. React & React Native
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// 3. Auth helpers
import { getUser, getRoleName, type User } from '@/lib/auth';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  user?: User | null;
  showProfile?: boolean;
}

export default function Header({
  title = "IT VERTEX",
  subtitle = "ภาพรวมธุรกิจ",
  user: initialUser,
  showProfile = true,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser || null);

  useEffect(() => {
    if (!initialUser) {
      getUser()
        .then((u) => {
          if (u) setCurrentUser(u);
        })
        .catch(() => {});
    } else {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  const getRoleLabel = (roleName?: string) => {
    const r = (roleName || '').toLowerCase();
    if (r.includes('manag')) return 'ผู้จัดการ';
    if (r.includes('tech')) return 'ช่างซ่อม';
    if (r.includes('staff')) return 'พนักงาน';
    if (r.includes('custom')) return 'ลูกค้า';
    return 'ผู้ใช้งาน';
  };

  const getInitials = (u: User | null) => {
    if (!u) return 'IT';
    const f = (u.first_name || '').trim();
    const l = (u.last_name || '').trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    return (u.email?.[0] || 'U').toUpperCase();
  };

  const getDisplayName = (u: User | null) => {
    if (!u) return 'กำลังเข้าสู่ระบบ';
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return fullName || u.email.split('@')[0];
  };

  const handlePressProfile = () => {
    if (!currentUser) return;
    const role = getRoleName(currentUser);
    switch (role) {
      case 'manager':
        router.push('/(meneger)/profile' as any);
        break;
      case 'tech':
        router.push('/(technicain)/profile' as any);
        break;
      case 'staff':
        router.push('/(staff)/profile' as any);
        break;
      case 'customer':
        router.push('/(customer)/profile' as any);
        break;
    }
  };

  return (
    <View
      className="bg-[#DC2626] px-5 pb-4 shadow-md z-10 rounded-b-3xl"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left: Title & Subtitle */}
        <View className="flex-1 mr-3">
          <Text className="text-white text-[22px] font-bold font-heading tracking-tight" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-white/85 text-[12px] mt-0.5 font-medium font-body" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* Right: Clean & Premium User Profile Pill */}
        {showProfile && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handlePressProfile}
            accessibilityRole="button"
            accessibilityLabel={`โปรไฟล์ ${getDisplayName(currentUser)}`}
            className="flex-row items-center gap-2.5 bg-white/15 border border-white/25 pl-3 pr-1.5 py-1.5 rounded-full shadow-sm"
          >
            <View className="items-end justify-center">
              {/* User Name */}
              <Text
                className="text-white text-[13px] font-bold font-heading max-w-[110px] leading-tight"
                numberOfLines={1}
              >
                {getDisplayName(currentUser)}
              </Text>

              {/* Status Indicator & Role */}
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <Text className="text-white/85 text-[11px] font-medium font-body leading-none">
                  {getRoleLabel(currentUser?.role_name)}
                </Text>
              </View>
            </View>

            {/* Profile Avatar Circle */}
            <View className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm border border-white/30">
              <Text className="text-[#DC2626] font-bold text-[12px] font-heading">
                {getInitials(currentUser)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}