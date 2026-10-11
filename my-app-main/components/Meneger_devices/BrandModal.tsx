// 1. React & React Native
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import type { CatalogBrand, CatalogDeviceType } from '@/types/device';

interface BrandModalProps {
  visible: boolean;
  item: CatalogBrand | null;
  deviceTypes: CatalogDeviceType[];
  initialDeviceTypeId?: number | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (brandName: string, deviceTypeIds: number[]) => void;
}

export default function BrandModal({
  visible,
  item,
  deviceTypes,
  initialDeviceTypeId,
  isSaving,
  onClose,
  onSave,
}: BrandModalProps) {
  const [brandName, setBrandName] = useState('');
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setBrandName(item.brand_name);
      setSelectedTypeIds(item.device_types?.map((dt) => dt.device_type_id) || []);
    } else {
      setBrandName('');
      setSelectedTypeIds(initialDeviceTypeId ? [initialDeviceTypeId] : []);
    }
    setError('');
  }, [item, visible, initialDeviceTypeId]);

  const toggleType = (typeId: number) => {
    setSelectedTypeIds((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const handleSave = () => {
    const trimmed = brandName.trim();
    if (!trimmed) {
      setError('กรุณากรอกชื่อยี่ห้อ (แบรนด์)');
      return;
    }
    if (selectedTypeIds.length === 0) {
      setError('กรุณาเลือกประเภทอุปกรณ์ที่เกี่ยวข้องอย่างน้อย 1 ประเภท');
      return;
    }
    onSave(trimmed, selectedTypeIds);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/60 justify-center items-center px-4"
      >
        <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                <Ionicons name="pricetag" size={16} color="#DC2626" />
              </View>
              <Text className="text-base font-bold text-slate-800 font-heading">
                {item ? 'แก้ไขยี่ห้อ (แบรนด์)' : 'เพิ่มยี่ห้อใหม่'}
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
          <ScrollView showsVerticalScrollIndicator={false} className="flex-col gap-3.5 mb-5">
            <View>
              <Text className="text-xs font-semibold text-slate-700 font-heading mb-1.5">
                ชื่อยี่ห้อ (Brand Name) *
              </Text>
              <TextInput
                value={brandName}
                onChangeText={(text) => {
                  setBrandName(text);
                  setError('');
                }}
                placeholder="เช่น ASUS, Apple, Canon, Epson..."
                placeholderTextColor="#94A3B8"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-body"
                autoFocus={!item}
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-slate-700 font-heading mb-1">
                ประเภทอุปกรณ์ที่ยี่ห้อนี้ผลิต/สังกัด * (เลือกได้มากกว่า 1)
              </Text>
              <Text className="text-[11px] text-slate-400 font-body mb-2">
                แบรนด์นี้จะแสดงให้เลือกในใบรับซ่อมเฉพาะประเภทอุปกรณ์ที่ติ๊กเลือก
              </Text>

              <View className="flex-col gap-2">
                {deviceTypes.map((dt) => {
                  const isChecked = selectedTypeIds.includes(dt.device_type_id);
                  return (
                    <TouchableOpacity
                      key={dt.device_type_id}
                      onPress={() => toggleType(dt.device_type_id)}
                      activeOpacity={0.7}
                      className={`flex-row items-center justify-between p-3 rounded-xl border ${
                        isChecked
                          ? 'bg-red-50/70 border-red-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          isChecked ? 'font-bold text-red-900 font-heading' : 'text-slate-700 font-body'
                        }`}
                      >
                        {dt.device_type_name}
                      </Text>
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isChecked ? '#DC2626' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

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
