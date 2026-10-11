import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CustomerTabLayout() {
  const { colorScheme } = useColorScheme();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1e293b' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#334155' : '#e2e8f0',
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Prompt-Regular',
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'รายการซ่อม',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'แจ้งเตือน',
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
