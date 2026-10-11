// 1. React & React Native
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import type { CatalogDeviceType } from '@/types/device';

interface DeviceTypeModalProps {
  visible: boolean;
  item: CatalogDeviceType | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function DeviceTypeModal({
  visible,
  item,
  isSaving,
  onClose,
  onSave,
}: DeviceTypeModalProps) {
  const [typeName, setTypeName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setTypeName(item.device_type_name);
    } else {
      setTypeName('');
    }
    setError('');
  }, [item, visible]);

  const handleSave = () => {
    const trimmed = typeName.trim();
    if (!trimmed) {
      setError('กรุณากรอกชื่อประเภทอุปกรณ์');
      return;
    }
    onSave(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/60 justify-center items-center px-4"
      >
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                <Ionicons name="hardware-chip" size={16} color="#DC2626" />
              </View>
              <Text className="text-base font-bold text-slate-800 font-heading">
                {item ? 'แก้ไขประเภทอุปกรณ์' : 'เพิ่มประเภทอุปกรณ์'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isSaving}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-3 flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text className="text-xs text-red-600 font-body flex-1">{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="mb-5">
            <Text className="text-xs font-semibold text-slate-700 font-heading mb-1.5">
              ชื่อประเภทอุปกรณ์ *
            </Text>
            <TextInput
              value={typeName}
              onChangeText={(text) => {
                setTypeName(text);
                setError('');
              }}
              placeholder="เช่น Notebook / Laptop, จอภาพ..."
              placeholderTextColor="#94A3B8"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-body"
              autoFocus
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl border border-slate-200 items-center justify-center"
            >
              <Text className="text-sm font-semibold text-slate-600 font-heading">ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-primary items-center justify-center active:bg-red-700"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-sm font-bold text-white font-heading">บันทึก</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
