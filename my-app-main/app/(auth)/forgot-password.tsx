// 1. React & React Native
import { useState } from 'react';
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
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. Auth helpers
import { forgotPassword } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'phone' | null>(null);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleVerifyIdentity = async () => {
    const trimmedEmail = email.trim();
    const digitsPhone = phone.replace(/-/g, '');

    if (!trimmedEmail || !digitsPhone) {
      showAlert('กรอกข้อมูลไม่ครบ', 'กรุณากรอกอีเมลและเบอร์โทรศัพท์ของคุณ');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showAlert('อีเมลไม่ถูกต้อง', 'กรุณาตรวจสอบรูปแบบอีเมลของคุณให้ถูกต้อง');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(trimmedEmail, digitsPhone);

      const resetToken = response?.reset_token || (response as any)?.data?.reset_token;
      if (resetToken) {
        router.push({
          pathname: '/(auth)/reset-password',
          params: { token: resetToken },
        });
      } else {
        throw new Error('ไม่พบ Token จากระบบ');
      }
    } catch (error: any) {
      showAlert('เกิดข้อผิดพลาด', error.message || 'ข้อมูลไม่ถูกต้อง หรือไม่พบผู้ใช้งาน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Clean Top Navigation Bar with Back Button */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center"
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-slate-800">ลืมรหัสผ่าน</Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: '#ffffff' }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 bg-white px-6 pt-6 pb-6">
            <View className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 items-center justify-center mb-4 self-center">
              <Ionicons name="key-outline" size={32} color="#D32F2F" />
            </View>

            <Text className="text-2xl font-black text-[#D32F2F] text-center tracking-widest mb-1">IT VERTEX</Text>
            <Text className="text-xl font-bold text-slate-800 text-center mb-1.5">
              ยืนยันตัวตนเพื่อรีเซ็ตรหัสผ่าน
            </Text>
            <Text className="text-sm text-slate-400 text-center leading-5 mb-7">
              กรุณากรอกอีเมลและเบอร์โทรศัพท์ที่ใช้ลงทะเบียน{'\n'}เพื่อทำการตั้งรหัสผ่านใหม่
            </Text>

            {/* Email Input */}
            <View className="mb-5">
              <Text className="text-sm text-slate-500 mb-2 font-semibold">
                อีเมลบัญชีผู้ใช้ (Email)
              </Text>
              <View
                className={`flex-row items-center bg-white border rounded-xl px-4 h-[52px] ${focusedField === 'email' ? 'border-[#D32F2F]' : 'border-slate-200'}`}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={focusedField === 'email' ? '#D32F2F' : '#94a3b8'}
                  className="mr-2.5"
                />
                <TextInput
                  className="flex-1 h-full text-slate-800 text-base"
                  placeholder="example@domain.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')}>
                    <Ionicons name="close-circle" size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Phone Input */}
            <View className="mb-5">
              <Text className="text-sm text-slate-500 mb-2 font-semibold">
                เบอร์โทรศัพท์ (Phone)
              </Text>
              <View
                className={`flex-row items-center bg-white border rounded-xl px-4 h-[52px] ${focusedField === 'phone' ? 'border-[#D32F2F]' : 'border-slate-200'}`}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={focusedField === 'phone' ? '#D32F2F' : '#94a3b8'}
                  className="mr-2.5"
                />
                <TextInput
                  className="flex-1 h-full text-slate-800 text-base"
                  placeholder="08X-XXX-XXXX"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
                {phone.length > 0 && (
                  <TouchableOpacity onPress={() => setPhone('')}>
                    <Ionicons name="close-circle" size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-xl h-[52px] justify-center items-center mt-4 ${(!email.trim() || !phone.trim() || loading) ? 'bg-[#DC2626]/40' : 'bg-[#DC2626] shadow-lg shadow-[#DC2626]/20 elevation-4'}`}
              onPress={handleVerifyIdentity}
              disabled={!email.trim() || !phone.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold font-heading">
                  ยืนยันข้อมูล
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 items-center py-2.5 min-h-[44px] justify-center"
              onPress={() => router.replace('/(auth)/login')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-slate-600 text-sm font-medium font-body">ยกเลิกและกลับไปหน้าเข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
