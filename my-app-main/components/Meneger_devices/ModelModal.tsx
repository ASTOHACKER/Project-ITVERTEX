// 1. React & React Native
import React, { useEffect, useMemo, useState } from 'react';
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
import type { CatalogBrand, CatalogDeviceType, CatalogModel } from '@/types/device';

interface ModelModalProps {
  visible: boolean;
  item: CatalogModel | null;
  deviceTypes: CatalogDeviceType[];
  brands: CatalogBrand[];
  initialDeviceTypeId?: number | null;
  initialBrandId?: number | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (modelName: string, brandId: number, deviceTypeId: number) => void;
}

export default function ModelModal({
  visible,
  item,
  deviceTypes,
  brands,
  initialDeviceTypeId,
  initialBrandId,
  isSaving,
  onClose,
  onSave,
}: ModelModalProps) {
  const [modelName, setModelName] = useState('');
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setModelName(item.model_name);
      setSelectedDeviceTypeId(item.device_type_id);
      setSelectedBrandId(item.brand_id);
    } else {
      setModelName('');
      const dtId = initialDeviceTypeId || deviceTypes[0]?.device_type_id || null;
      setSelectedDeviceTypeId(dtId);
      setSelectedBrandId(initialBrandId || null);
    }
    setError('');
  }, [item, visible, initialDeviceTypeId, initialBrandId, deviceTypes]);

  // Brands available for selected device type
  const availableBrands = useMemo(() => {
    if (!selectedDeviceTypeId) return brands;
    return brands.filter((b) =>
      b.device_types?.some((dt) => dt.device_type_id === selectedDeviceTypeId)
    );
  }, [brands, selectedDeviceTypeId]);

  const handleSelectDeviceType = (dtId: number) => {
    setSelectedDeviceTypeId(dtId);
    // Auto-adjust brand if not available in newly selected type
    const valid = brands.filter((b) =>
      b.device_types?.some((dt) => dt.device_type_id === dtId)
    );
    if (selectedBrandId && !valid.some((b) => b.brand_id === selectedBrandId)) {
      setSelectedBrandId(valid[0]?.brand_id || null);
    }
  };

  const handleSave = () => {
    const trimmed = modelName.trim();
    if (!trimmed) {
      setError('กรุณากรอกชื่อรุ่นอุปกรณ์');
      return;
    }
    if (!selectedDeviceTypeId) {
      setError('กรุณาเลือกประเภทอุปกรณ์');
      return;
    }
    if (!selectedBrandId) {
      setError('กรุณาเลือกยี่ห้ออุปกรณ์');
      return;
    }
    onSave(trimmed, selectedBrandId, selectedDeviceTypeId);
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
                <Ionicons name="hardware-chip" size={16} color="#DC2626" />
              </View>
              <Text className="text-base font-bold text-slate-800 font-heading">
                {item ? 'แก้ไขรุ่นอุปกรณ์' : 'เพิ่มรุ่นอุปกรณ์'}
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
            {/* 1. Device Type Selector */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 font-heading mb-1.5">
                1. เลือกประเภทอุปกรณ์ *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {deviceTypes.map((dt) => {
                  const isActive = selectedDeviceTypeId === dt.device_type_id;
                  return (
                    <TouchableOpacity
                      key={dt.device_type_id}
                      onPress={() => handleSelectDeviceType(dt.device_type_id)}
                      className={`px-3 py-1.5 rounded-full border ${
                        isActive ? 'bg-primary border-primary' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isActive ? 'text-white font-bold font-heading' : 'text-slate-700 font-body'
                        }`}
                      >
                        {dt.device_type_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Brand Selector */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 font-heading mb-1.5">
                2. เลือกยี่ห้อ (Brand) *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {availableBrands.map((b) => {
                  const isActive = selectedBrandId === b.brand_id;
                  return (
                    <TouchableOpacity
                      key={b.brand_id}
                      onPress={() => setSelectedBrandId(b.brand_id)}
                      className={`px-3 py-1.5 rounded-full border ${
                        isActive ? 'bg-slate-900 border-slate-900' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isActive ? 'text-white font-bold font-heading' : 'text-slate-700 font-body'
                        }`}
                      >
                        {b.brand_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Model Name Input */}
            <View>
              <Text className="text-xs font-semibold text-slate-700 font-heading mb-1.5">
                3. ชื่อรุ่น (Model Name) *
              </Text>
              <TextInput
                value={modelName}
                onChangeText={(text) => {
                  setModelName(text);
                  setError('');
                }}
                placeholder="เช่น ROG Strix G16, EcoTank L3250..."
                placeholderTextColor="#94A3B8"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-body"
              />
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
