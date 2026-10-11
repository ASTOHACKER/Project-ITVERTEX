import { Colors, FONTS } from '@/constants/theme';
import { getUser, getRoleRedirectPath } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

export default function ManagerLayout() {
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    checkManagerRole();
  }, []);

  async function checkManagerRole() {
    try {
      const user = await getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const userRole = (user.role_name || '').toLowerCase();
      if (userRole !== 'manager') {
        const redirectPath = getRoleRedirectPath(user) as any;
        router.replace(redirectPath);
      }
    } catch (err) {
      console.error('Role check error:', err);
      router.replace('/(auth)/login');
    } finally {
      setCheckingRole(false);
    }
  }

  if (checkingRole) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: FONTS.heading, fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ภาพรวม',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="repairs"
        options={{
          title: 'รายการซ่อม',
          tabBarIcon: ({ color }) => <Ionicons name="clipboard-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="item"
        options={{
          title: 'อะไหล่',
          tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'อุปกรณ์',
          tabBarIcon: ({ color }) => <Ionicons name="hardware-chip-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'พนักงาน',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
