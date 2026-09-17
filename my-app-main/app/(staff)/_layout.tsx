import { Colors, FONTS } from '@/constants/theme';
import { getUser, getRoleRedirectPath } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function StaffLayout() {
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    checkStaffRole();
  }, []);

  async function checkStaffRole() {
    try {
      const user = await getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const userRole = (user.role_name || '').toLowerCase();
      if (userRole !== 'staff') {
        const redirectPath = getRoleRedirectPath(user) as any;
        router.replace(redirectPath);
      }
    } catch (err) {
      console.error('Staff Role check error:', err);
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
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontFamily: FONTS.heading, fontWeight: '800' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ภาพรวม',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="repairs"
        options={{
          title: 'รายการซ่อม',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="receive"
        options={{
          title: 'รับเครื่อง',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add' : 'add-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deliver"
        options={{
          title: 'ส่งมอบ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="signing" options={{ href: null }} />
    </Tabs>
  );
}
