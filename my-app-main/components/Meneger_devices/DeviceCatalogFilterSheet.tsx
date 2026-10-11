// 1. React & React Native
import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CatalogBrand, CatalogDeviceType } from '@/types/device';

interface DeviceCatalogFilterSheetProps {
  visible: boolean;
  activeTab: 'types' | 'brands' | 'models';
  deviceTypes: CatalogDeviceType[];
  brands: CatalogBrand[];
  selectedTypeId: number | null;
  selectedBrandId: number | null;
  onApply: (typeId: number | null, brandId: number | null) => void;
  onClose: () => void;
  onReset: () => void;
}

export default function DeviceCatalogFilterSheet({
  visible,
  activeTab,
  deviceTypes,
  brands,
  selectedTypeId,
  selectedBrandId,
  onApply,
  onClose,
  onReset,
}: DeviceCatalogFilterSheetProps) {
  const [draftTypeId, setDraftTypeId] = useState<number | null>(selectedTypeId);
  const [draftBrandId, setDraftBrandId] = useState<number | null>(selectedBrandId);

  useEffect(() => {
    setDraftTypeId(selectedTypeId);
    setDraftBrandId(selectedBrandId);
  }, [selectedTypeId, selectedBrandId, visible]);

  // Brands available for selected device type
  const availableBrands = useMemo(() => {
    if (!draftTypeId) return brands;
    const tId = Number(draftTypeId);
    return brands.filter((b) =>
      b.device_types?.some((dt) => Number(dt.device_type_id) === tId)
    );
  }, [brands, draftTypeId]);

  const hasChanges = draftTypeId !== null || draftBrandId !== null;

  const handleSelectType = (id: number | null) => {
    setDraftTypeId(id);
    // If brand is no longer valid in new type, reset draftBrandId
    if (id && draftBrandId) {
      const tId = Number(id);
      const bId = Number(draftBrandId);
      const valid = brands.filter((b) =>
        b.device_types?.some((dt) => Number(dt.device_type_id) === tId)
      );
      if (!valid.some((b) => Number(b.brand_id) === bId)) {
        setDraftBrandId(null);
      }
    }
  };

  const handleApply = () => {
    onApply(draftTypeId, draftBrandId);
    onClose();
  };

  const handleReset = () => {
    setDraftTypeId(null);
    setDraftBrandId(null);
    onReset();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <SafeAreaView edges={['bottom']} className="bg-white rounded-t-3xl max-h-[85%] flex-col overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-slate-200">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center">
                <Ionicons name="filter" size={18} color="#DC2626" />
              </View>
              <Text className="text-base font-bold text-slate-800 font-heading">
                ตัวกรองแคตตาล็อกอุปกรณ์
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              {hasChanges && (
                <TouchableOpacity onPress={handleReset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text className="text-xs font-bold text-red-600 font-heading">ล้างทั้งหมด</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            className="flex-1 px-5 pt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* 1. Device Type Filter */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-heading">
                กรองตามประเภทอุปกรณ์
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectType(null)}
                  className={`px-3.5 py-2 rounded-xl border ${draftTypeId === null
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-50 border-slate-200'
                    }`}
                >
                  <Text
                    className={`text-xs font-heading ${draftTypeId === null ? 'text-white font-bold' : 'text-slate-700'
                      }`}
                  >
                    ทุกประเภท
                  </Text>
                </TouchableOpacity>

                {deviceTypes.map((dt) => {
                  const isSelected = draftTypeId !== null && Number(draftTypeId) === Number(dt.device_type_id);
                  return (
                    <TouchableOpacity
                      key={dt.device_type_id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectType(isSelected ? null : dt.device_type_id)}
                      className={`px-3.5 py-2 rounded-xl border ${isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <Text
                        className={`text-xs font-heading ${isSelected ? 'text-white font-bold' : 'text-slate-700'
                          }`}
                      >
                        {dt.device_type_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Brand Filter (for Models tab) */}
            {activeTab === 'models' && (
              <View className="mb-5">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-heading">
                  กรองตามยี่ห้อ (Brand)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setDraftBrandId(null)}
                    className={`px-3.5 py-2 rounded-xl border ${draftBrandId === null
                      ? 'bg-slate-900 border-slate-900'
                      : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <Text
                      className={`text-xs font-heading ${draftBrandId === null ? 'text-white font-bold' : 'text-slate-700'
                        }`}
                    >
                      ทุกยี่ห้อ
                    </Text>
                  </TouchableOpacity>

                  {availableBrands.map((b) => {
                    const isSelected = draftBrandId !== null && Number(draftBrandId) === Number(b.brand_id);
                    return (
                      <TouchableOpacity
                        key={b.brand_id}
                        activeOpacity={0.7}
                        onPress={() => setDraftBrandId(isSelected ? null : b.brand_id)}
                        className={`px-3.5 py-2 rounded-xl border ${isSelected
                          ? 'bg-sky-600 border-sky-600'
                          : 'bg-slate-50 border-slate-200'
                          }`}
                      >
                        <Text
                          className={`text-xs font-heading ${isSelected ? 'text-white font-bold' : 'text-slate-700'
                            }`}
                        >
                          {b.brand_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View className="px-5 py-4 border-t border-slate-100 flex-row gap-3 bg-white">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="flex-1 py-3 rounded-xl border border-slate-200 items-center justify-center bg-slate-50"
            >
              <Text className="text-sm font-semibold text-slate-600 font-heading">ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              activeOpacity={0.8}
              className="flex-1 py-3 rounded-xl bg-primary items-center justify-center shadow-sm"
            >
              <Text className="text-sm font-bold text-white font-heading">นำไปใช้</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
