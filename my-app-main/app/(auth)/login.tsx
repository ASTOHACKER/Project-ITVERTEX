import { login, getRoleRedirectPath, User } from '@/lib/auth';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuccessToast from '@/components/ui/SuccessToast';
import FormInput from '@/components/ui/FormInput';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();

  // ── Form state ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  // ── Toast ──
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  // ── Validation errors ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Derived ──
  const isSubmitDisabled = loading || !email || !password;

  // ════════════════════════════════════════════════════════
  // Helpers
  // ════════════════════════════════════════════════════════

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const setError = (field: string, msg: string) => {
    setErrors(prev => ({ ...prev, [field]: msg }));
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setError('email', 'กรุณากรอกอีเมล');
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setError('email', 'รูปแบบอีเมลไม่ถูกต้อง');
      return false;
    }
    clearError('email');
    return true;
  };

  // ════════════════════════════════════════════════════════
  // Business logic
  // ════════════════════════════════════════════════════════

  const handleAuthSuccess = (user: User) => {
    setToastMessage('เข้าสู่ระบบสำเร็จ');
    setPendingRedirect(getRoleRedirectPath(user));
    setShowToast(true);
  };

  async function handleLogin() {
    setErrors({});

    if (!email || !password) {
      showAlert('ข้อผิดพลาด', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    try {
      const { user } = await login(email, password);
      handleAuthSuccess(user);
    } catch (err: any) {
      showAlert('เข้าสู่ระบบล้มเหลว', err.message || 'เกิดข้อผิดพลาด');
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleGoToRegister = () => {
    router.push('/(auth)/register');
  };

  const handleToastHide = () => {
    setShowToast(false);
    if (pendingRedirect) {
      setTimeout(() => {
        router.replace(pendingRedirect as any);
      }, 100);
    }
    setPendingRedirect(null);
  };

  // ════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════

  return (
    <SafeAreaView className="flex-1 bg-[#D32F2F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#cc292b" />

      <SuccessToast
        visible={showToast}
        message={toastMessage}
        type="success"
        duration={2000}
        onHide={handleToastHide}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: '#ffffff' }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══ Red Header ═══ */}
          <View 
            className="bg-[#D32F2F] pb-10 px-6 relative overflow-hidden"
            style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 40 : 60 }}
          >
            <View className="absolute w-[250px] h-[250px] rounded-full bg-white/5 -top-[50px] -right-[80px]" />
            <View className="absolute w-[100px] h-[100px] rounded-full bg-white/10 top-[25px] -right-[5px]" />

            <View className="mt-5">
              <Text className="text-[32px] font-black text-white tracking-widest mb-2">
                IT VERTEX
              </Text>
              <Text className="text-base text-white/80">
                Repair Management System
              </Text>
            </View>
          </View>

          {/* ═══ White Form Section ═══ */}
          <View className="flex-1 bg-white px-6 pt-8 pb-5">
            <Text className="text-[22px] font-bold text-slate-800 text-center mb-2">
              ยินดีต้อนรับ
            </Text>
            <Text className="text-sm text-slate-400 text-center mb-8">
              เข้าสู่ระบบเพื่อดำเนินการต่อ
            </Text>

            <FormInput
              label="อีเมล"
              placeholder="กรอกอีเมล"
              isFocused={focusedField === 'email'}
              onFieldFocus={() => setFocusedField('email')}
              onFieldBlur={() => setFocusedField(null)}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <FormInput
              label="รหัสผ่าน (Password)"
              placeholder="กรอกรหัสผ่าน"
              isFocused={focusedField === 'password'}
              onFieldFocus={() => setFocusedField('password')}
              onFieldBlur={() => setFocusedField(null)}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-xl h-[52px] justify-center items-center mt-3 ${isSubmitDisabled ? 'bg-[#DC2626]/40' : 'bg-[#DC2626] shadow-lg shadow-[#DC2626]/20 elevation-4'}`}
              onPress={handleLogin}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold font-heading">
                  เข้าสู่ระบบ
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-3 py-2.5 items-center min-h-[44px] justify-center"
              onPress={handleForgotPassword}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-[#DC2626] text-sm font-semibold font-heading">
                ลืมรหัสผ่าน?
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="h-[1px] bg-slate-100 my-4" />

            {/* Link to Register Screen */}
            <TouchableOpacity
              className="items-center py-2.5 min-h-[44px] justify-center"
              onPress={handleGoToRegister}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-slate-600 text-sm font-body underline">
                ยังไม่มีบัญชี? สมัครสมาชิก
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View className="flex-1 justify-end items-center mt-10">
              <Text className="text-slate-400 text-xs">IT VERTEX v2.0 © 2026</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
