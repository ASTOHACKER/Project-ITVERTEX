// 1. React & React Native
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface ConfirmDeleteModalProps {
  visible: boolean;
  title?: string;
  itemName?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  visible,
  title = 'ยืนยันการลบข้อมูล',
  itemName,
  message = 'การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลจะถูกลบออกจากระบบอย่างถาวร',
  confirmText = 'ลบข้อมูล',
  cancelText = 'ยกเลิก',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className="w-full max-w-[340px] bg-white rounded-2xl p-6 items-center shadow-xl shadow-black/20 elevation-10">
          {/* Danger Warning Icon Container */}
          <View className="w-14 h-14 rounded-full bg-red-50 border border-red-100 justify-center items-center mb-4">
            <Ionicons name="trash-outline" size={28} color="#EF4444" />
          </View>

          {/* Texts */}
          <Text className="text-lg font-bold text-slate-800 text-center mb-2">
            {title}
          </Text>

          {itemName && (
            <View className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full mb-3">
              <Text className="text-xs text-slate-500 font-medium text-center">
                รายการที่เลือก:
              </Text>
              <Text
                className="text-sm font-semibold text-slate-800 text-center mt-0.5"
                numberOfLines={2}
              >
                {itemName}
              </Text>
            </View>
          )}

          <Text className="text-xs text-slate-500 text-center mb-6 leading-5">
            {message}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              disabled={loading}
              className="flex-1 bg-slate-100 border border-slate-200 h-11 rounded-xl justify-center items-center active:bg-slate-200"
              onPress={onCancel}
            >
              <Text className="text-slate-700 text-sm font-semibold">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={loading}
              className="flex-1 bg-red-500 border border-red-600 h-11 rounded-xl justify-center items-center active:bg-red-600 shadow-sm shadow-red-200"
              onPress={onConfirm}
            >
              <Text className="text-white text-sm font-bold">
                {loading ? 'กำลังลบ...' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
