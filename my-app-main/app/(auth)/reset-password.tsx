// 1. React & React Native
import { useState, useEffect } from 'react';
import {
  Text,
  View,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. Auth helpers
import { resetPassword } from '@/lib/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const token = searchParams.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'password' | 'confirmPassword' | null>(null);

  useEffect(() => {
    if (!token) {
      showAlert('ข้อผิดพลาด', 'ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน กรุณาทำการขอใหม่', () => {
        router.replace('/(auth)/forgot-password');
      });
    }
  }, [token]);

  const showAlert = (title: string, message: string, onPress?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      if (onPress) onPress();
    } else {
      Alert.alert(title, message, onPress ? [{ text: 'ตกลง', onPress }] : undefined);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      showAlert('ข้อผิดพลาด', 'กรุณากรอกรหัสผ่านใหม่ให้ครบถ้วน');
      return;
    }

    if (password.length < 6) {
      showAlert('ข้อผิดพลาด', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('ข้อผิดพลาด', 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);

      showAlert('สำเร็จ', 'เปลี่ยนรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่', () => {
        router.replace('/(auth)/login');
      });
    } catch (error: any) {
      showAlert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ Token อาจหมดอายุ');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#D32F2F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#D32F2F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#cc292b" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: '#ffffff' }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View className="bg-[#D32F2F] h-[220px] justify-center items-center relative overflow-hidden">
            <View className="absolute w-[260px] h-[260px] rounded-full bg-white/5 -top-[60px] -left-[40px]" />
            <View className="absolute w-[180px] h-[180px] rounded-full bg-white/5 -bottom-[50px] -right-[30px]" />

            <View className="items-center z-10 mt-5">
              <Text className="text-[32px] font-bold text-white tracking-widest mb-2">IT VERTEX</Text>
              <Text className="text-base text-white/80">ตั้งรหัสผ่านใหม่</Text>
            </View>
          </View>

          {/* Form Section */}
          <View className="flex-1 bg-white px-6 pt-8 pb-10 rounded-t-3xl -mt-5">
            <Text className="text-[22px] font-bold text-slate-800 text-center mb-2">กำหนดรหัสผ่านใหม่</Text>
            <Text className="text-sm text-slate-400 text-center mb-8">กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน</Text>

            {/* Password Input */}
            <View className="mb-5">
              <Text className="text-sm text-slate-500 mb-2 font-semibold">รหัสผ่านใหม่ (New Password)</Text>
              <View
                className={`flex-row items-center bg-white border rounded-xl px-4 h-[52px] ${focusedField === 'password' ? 'border-[#D32F2F]' : 'border-slate-200'}`}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" className="mr-2.5" />
                <TextInput
                  className="flex-1 h-full text-slate-800 text-base"
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-2 justify-center items-center"
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-5">
              <Text className="text-sm text-slate-500 mb-2 font-semibold">ยืนยันรหัสผ่านใหม่ (Confirm New Password)</Text>
              <View
                className={`flex-row items-center bg-white border rounded-xl px-4 h-[52px] ${focusedField === 'confirmPassword' ? 'border-[#D32F2F]' : 'border-slate-200'}`}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" className="mr-2.5" />
                <TextInput
                  className="flex-1 h-full text-slate-800 text-base"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-2 justify-center items-center"
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`bg-[#D32F2F] rounded-xl py-4 justify-center items-center mt-3 shadow-lg shadow-[#D32F2F]/20 elevation-4 ${loading ? 'opacity-80' : ''}`}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold">เปลี่ยนรหัสผ่าน</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              className="mt-5 items-center"
            >
              <Text className="text-slate-500 text-sm font-medium">ยกเลิกและกลับไปหน้าเข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
