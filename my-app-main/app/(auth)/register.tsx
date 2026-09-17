import { usePasswordStrength } from '@/hooks/use-password-strength';
import { register, getRoleRedirectPath, User } from '@/lib/auth';
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
import { Ionicons } from '@expo/vector-icons';
import SuccessToast from '@/components/ui/SuccessToast';
import FormInput from '@/components/ui/FormInput';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** เบอร์โทรไทย: 0 ตามด้วยเลข 8-9 ตัว */
const PHONE_REGEX = /^0\d{8,9}$/;

export default function RegisterScreen() {
  const router = useRouter();

  // ── Form state ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'firstName' | 'lastName' | 'phone' | null>(null);

  // ── Toast ──
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  // ── Validation errors ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Password strength ──
  const { rules: passwordRules, isStrong: isPasswordStrong, ruleDefs } = usePasswordStrength(password);

  // ── Derived ──
  const isSubmitDisabled = loading
    || !email
    || !firstName
    || !lastName
    || !phone
    || !isPasswordStrong;

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

  const validatePhone = (value: string): boolean => {
    const digits = value.replace(/-/g, '');
    if (!digits) {
      setError('phone', 'กรุณากรอกเบอร์โทรศัพท์');
      return false;
    }
    if (!PHONE_REGEX.test(digits)) {
      setError('phone', 'รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)');
      return false;
    }
    clearError('phone');
    return true;
  };



  const handleAuthSuccess = (user: User) => {
    setToastMessage('ลงทะเบียนสำเร็จ');
    setPendingRedirect('/login');
    setShowToast(true);
  };

  async function handleRegister() {
    setErrors({});

    if (!validateEmail(email)) return;
    if (!validatePhone(phone)) return;
    if (!firstName || !lastName) {
      showAlert('ข้อผิดพลาด', 'กรุณากรอกชื่อและนามสกุล');
      return;
    }
    if (!isPasswordStrong) {
      showAlert(
        'รหัสผ่านไม่ปลอดภัย',
        'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และสัญลักษณ์'
      );
      return;
    }

    setLoading(true);
    try {
      const { user } = await register({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/-/g, ''),
      });
      handleAuthSuccess(user);
    } catch (err: any) {
      showAlert('ลงทะเบียนล้มเหลว', err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

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
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <SuccessToast
        visible={showToast}
        message={toastMessage}
        type="success"
        duration={2000}
        onHide={handleToastHide}
      />

      {/* Clean Top Navigation Bar with Back Button */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center"
          onPress={() => router.replace('/login')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-slate-800">สมัครสมาชิก</Text>
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
            <Text className="text-2xl font-black text-[#D32F2F] text-center tracking-widest mb-1">IT VERTEX</Text>
            <Text className="text-xl font-bold text-slate-800 text-center mb-1.5">
              ลงทะเบียนบัญชีใหม่
            </Text>
            <Text className="text-sm text-slate-400 text-center mb-7">
              กรอกข้อมูลส่วนตัวเพื่อเริ่มต้นใช้งานระบบ
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
              label="ชื่อ (First Name)"
              placeholder="กรอกชื่อจริง"
              isFocused={focusedField === 'firstName'}
              onFieldFocus={() => setFocusedField('firstName')}
              onFieldBlur={() => setFocusedField(null)}
              value={firstName}
              onChangeText={setFirstName}
            />

            <FormInput
              label="นามสกุล (Last Name)"
              placeholder="กรอกนามสกุล"
              isFocused={focusedField === 'lastName'}
              onFieldFocus={() => setFocusedField('lastName')}
              onFieldBlur={() => setFocusedField(null)}
              value={lastName}
              onChangeText={setLastName}
            />

            <FormInput
              label="เบอร์โทรศัพท์ (Phone)"
              placeholder="08X-XXX-XXXX"
              isFocused={focusedField === 'phone'}
              onFieldFocus={() => setFocusedField('phone')}
              onFieldBlur={() => setFocusedField(null)}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
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

            <PasswordStrengthIndicator
              rules={passwordRules}
              ruleDefs={ruleDefs}
            />

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 justify-center items-center mt-4 ${isSubmitDisabled ? 'bg-[#D32F2F]/40' : 'bg-[#D32F2F] shadow-lg shadow-[#D32F2F]/20 elevation-4'}`}
              onPress={handleRegister}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold">
                  ลงทะเบียน
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="h-[1px] bg-slate-100 my-5" />

            {/* Link back to Login */}
            <TouchableOpacity
              className="items-center py-2.5"
              onPress={() => router.replace('/login')}
              activeOpacity={0.7}
            >
              <Text className="text-slate-500 text-sm underline">
                มีบัญชีแล้ว? เข้าสู่ระบบ
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View className="flex-1 justify-end items-center mt-8">
              <Text className="text-slate-400 text-xs">IT VERTEX v2.0 © 2026</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
