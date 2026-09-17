import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser, getRoleRedirectPath } from '@/lib/auth';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const redirectPath = getRoleRedirectPath(user);
          router.replace(redirectPath as any);
        } else {
          router.replace('/(auth)/login');
        }
      } catch (err) {
        router.replace('/(auth)/login');
      }
    }
    checkAuth();
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#D32F2F" />
    </View>
  );
}
