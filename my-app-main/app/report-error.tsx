// 1. React & React Native
import { useState } from 'react';
import {
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. Auth helpers
import { getCurrentUser } from '@/lib/auth';

export default function ReportErrorScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    if (saving) return;
    if (!description.trim()) {
      showAlert('ข้อผิดพลาด', 'กรุณาระบุรายละเอียดปัญหาที่พบ');
      return;
    }

    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        showAlert('ข้อผิดพลาด', 'กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      setSubmitted(true);
      setDescription('');
    } catch (err: any) {
      showAlert('ล้มเหลว', err.message || 'ไม่สามารถส่งรายงานได้');
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-[#D32F2F]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
        <View className="flex-row items-center justify-between px-4 pb-4 bg-[#D32F2F]" style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">แจ้งปัญหาระบบ</Text>
          <View className="w-6" />
        </View>
        <View className="flex-1 bg-slate-50 justify-center items-center p-10">
          <View className="mb-6">
            <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
          </View>
          <Text className="text-2xl font-bold text-green-600 mb-3">ส่งรายงานสำเร็จ!</Text>
          <Text className="text-[15px] text-slate-500 text-center leading-[22px] mb-8">ขอบคุณที่แจ้งปัญหา ทีมพัฒนาจะตรวจสอบและดำเนินการแก้ไขโดยเร็ว</Text>
          <TouchableOpacity
            className="bg-[#D32F2F] rounded-2xl py-4 px-10 shadow-lg shadow-[#D32F2F]/30 elevation-4"
            onPress={() => router.back()}
          >
            <Text className="text-white text-base font-bold">กลับหน้าหลัก</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#D32F2F]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-4 bg-[#D32F2F]" style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">แจ้งปัญหาระบบ</Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }} bounces={false}>
          {/* Info Card */}
          <View className="flex-row items-start bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
            <Ionicons name="information-circle-outline" size={24} color="#0284c7" />
            <Text className="flex-1 text-blue-800 text-[13px] leading-5 ml-3">
              พบปัญหาการใช้งานระบบ? กรุณาอธิบายรายละเอียดปัญหาที่พบ เพื่อให้ทีมพัฒนาดำเนินการแก้ไข
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm shadow-black/5 elevation-2">
            <Text className="text-lg font-bold text-slate-800 mb-5">รายละเอียดปัญหา</Text>

            <Text className="text-[13px] text-slate-500 mb-2 font-semibold ml-1">อธิบายปัญหาที่พบ *</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl h-[180px] p-4 text-slate-800 text-[15px] mb-6"
              style={{ textAlignVertical: 'top' }}
              multiline={true}
              numberOfLines={8}
              placeholder="เช่น กดปุ่มกลับแล้วแอปค้าง, ข้อมูลไม่แสดง, หน้าจอว่างเปล่า..."
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              className={`bg-[#D32F2F] rounded-2xl py-4 flex-row items-center justify-center shadow-lg shadow-[#D32F2F]/30 elevation-4 ${saving ? 'opacity-70' : ''}`}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#fff" className="mr-2" />
                  <Text className="text-white text-base font-bold">ส่งรายงาน</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity className="rounded-2xl py-3.5 items-center justify-center mt-3 border border-slate-200 bg-white" onPress={() => router.back()}>
              <Text className="text-slate-500 text-base font-semibold">ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
