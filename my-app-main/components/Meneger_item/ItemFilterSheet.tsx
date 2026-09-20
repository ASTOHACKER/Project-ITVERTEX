// 1. React & React Native
import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export type SortOption = 'newest' | 'name_asc' | 'price_asc' | 'price_desc' | 'popular';
export type UsageFilter = 'all' | 'used' | 'frequent' | 'unused';

export interface FilterState {
  sortBy: SortOption;
  categories: string[];
  usage: UsageFilter;
  pricePreset: string;
  minPrice: string;
  maxPrice: string;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  sortBy: 'newest',
  categories: [],
  usage: 'all',
  pricePreset: 'all',
  minPrice: '',
  maxPrice: '',
};

export const PARTS_CATEGORIES = [
  { id: 'ram', label: 'RAM' },
  { id: 'storage', label: 'SSD / Storage' },
  { id: 'psu', label: 'Power Supply' },
  { id: 'cooling', label: 'พัดลม / ซิลิโคน' },
  { id: 'display', label: 'จอแสดงผล' },
  { id: 'peripherals', label: 'แบต / คีย์บอร์ด / ชาร์จ' },
  { id: 'printer', label: 'ปริ้นเตอร์ / หมึก' },
  { id: 'network', label: 'Wi-Fi / เน็ตเวิร์ก' },
  { id: 'other', label: 'อื่นๆ' },
];

export const SERVICES_CATEGORIES = [
  { id: 'diagnostic', label: 'ตรวจเช็คสภาพเครื่อง' },
  { id: 'os', label: 'ลง OS / โปรแกรม' },
  { id: 'cleaning', label: 'ทำความสะอาด / ซิลิโคน' },
  { id: 'hardware', label: 'เปลี่ยน / ติดตั้งอุปกรณ์' },
  { id: 'display_kb', label: 'เปลี่ยนจอ / คีย์บอร์ด' },
  { id: 'board', label: 'ซ่อมเมนบอร์ด / ไฟ' },
  { id: 'printer', label: 'ล้างหัวพิมพ์ / หมึก' },
  { id: 'data_net', label: 'กู้ข้อมูล / เน็ตเวิร์ก' },
  { id: 'other', label: 'บริการอื่นๆ' },
];

export function getItemSubcategory(itemName: string, type: 'parts' | 'services'): string {
  const name = (itemName || '').toLowerCase();
  if (type === 'parts') {
    // 1. Wi-Fi / Network (must precede storage because cards have M.2/PCIe slot terms)
    if (
      name.includes('wi-fi') ||
      name.includes('wifi') ||
      name.includes('bluetooth') ||
      name.includes('ax200') ||
      name.includes('ax210') ||
      name.includes('lan') ||
      name.includes('wireless') ||
      name.includes('การ์ด wi-fi')
    ) {
      return 'network';
    }
    // 2. Power Supply (must precede cooling because of brand names like "Cooler Master PSU")
    if (
      name.includes('พาวเวอร์') ||
      name.includes('power supply') ||
      name.includes('บอร์ดจ่ายไฟ') ||
      name.includes('psu') ||
      name.includes('650w') ||
      name.includes('750w')
    ) {
      return 'psu';
    }
    // 3. Printer & Consumables
    if (
      name.includes('printer') ||
      name.includes('พิมพ์') ||
      name.includes('หมึก') ||
      name.includes('roller') ||
      name.includes('ลูกยาง') ||
      name.includes('ซับหมึก')
    ) {
      return 'printer';
    }
    // 4. Display & Monitors
    if (
      name.includes('จอแสดงผล') ||
      name.includes('display') ||
      name.includes('monitor') ||
      name.includes('ips') ||
      name.includes('panel')
    ) {
      return 'display';
    }
    // 5. Peripherals (Battery / Keyboard / Charger)
    if (
      name.includes('แบตเตอรี่') ||
      name.includes('battery') ||
      name.includes('คีย์บอร์ด') ||
      name.includes('keyboard') ||
      name.includes('อะแดปเตอร์') ||
      name.includes('adapter') ||
      name.includes('ชาร์จ')
    ) {
      return 'peripherals';
    }
    // 6. Cooling / Thermal
    if (
      name.includes('พัดลม') ||
      name.includes('cooling') ||
      name.includes('cooler') ||
      name.includes('ซิลิโคน') ||
      name.includes('ระบายความร้อน')
    ) {
      return 'cooling';
    }
    // 7. RAM
    if (name.includes('ram') || name.includes('ddr4') || name.includes('ddr5')) {
      return 'ram';
    }
    // 8. Storage (SSD / HDD)
    if (
      name.includes('ssd') ||
      name.includes('sata') ||
      name.includes('nvme') ||
      name.includes('m.2') ||
      name.includes('hdd')
    ) {
      return 'storage';
    }
    return 'other';
  } else {
    // 1. Diagnostic Fee
    if (name.includes('ตรวจเช็ค') || name.includes('diagnostic')) {
      return 'diagnostic';
    }
    // 2. OS & Basic Programs (avoid raw 'os' substring collision with 'diagnostic')
    if (
      name.includes('windows') ||
      name.includes('ไดรเวอร์') ||
      name.includes('โปรแกรม') ||
      name.includes('ระบบปฏิบัติการ')
    ) {
      return 'os';
    }
    // 3. Cleaning & Thermal paste
    if (
      name.includes('ทำความสะอาด') ||
      name.includes('ทาซิลิโคน') ||
      name.includes('ฝุ่น')
    ) {
      return 'cleaning';
    }
    // 4. Hardware Install & Replacement
    if (
      name.includes('เปลี่ยนและติดตั้ง') ||
      name.includes('ติดตั้งอุปกรณ์') ||
      name.includes('ประกอบ')
    ) {
      return 'hardware';
    }
    // 5. Display / Keyboard
    if (
      name.includes('เปลี่ยนจอ') ||
      name.includes('เปลี่ยนคีย์บอร์ด') ||
      name.includes('ทัชแพด')
    ) {
      return 'display_kb';
    }
    // 6. Board & Power IC Repair
    if (
      name.includes('เมนบอร์ด') ||
      name.includes('ระบบไฟ') ||
      name.includes('ไอซี') ||
      name.includes('ชิป') ||
      name.includes('ซ่อมบอร์ด')
    ) {
      return 'board';
    }
    // 7. Printer Service
    if (
      name.includes('ล้างหัวพิมพ์') ||
      name.includes('ซับหมึก') ||
      name.includes('กระดาษติด') ||
      name.includes('printer')
    ) {
      return 'printer';
    }
    // 8. Data Recovery & Network
    if (
      name.includes('กู้คืนข้อมูล') ||
      name.includes('data recovery') ||
      name.includes('เน็ตเวิร์ก') ||
      name.includes('แชร์เครื่องพิมพ์')
    ) {
      return 'data_net';
    }
    return 'other';
  }
}

interface ItemFilterSheetProps {
  visible: boolean;
  activeTab: 'parts' | 'services';
  filters: FilterState;
  matchingCount: number;
  onClose: () => void;
  onApply: (newFilters: FilterState) => void;
  onReset: () => void;
}

export default function ItemFilterSheet({
  visible,
  activeTab,
  filters,
  matchingCount,
  onClose,
  onApply,
  onReset,
}: ItemFilterSheetProps) {
  const [draft, setDraft] = useState<FilterState>(filters);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  const categoriesList = activeTab === 'parts' ? PARTS_CATEGORIES : SERVICES_CATEGORIES;

  const pricePresets = useMemo(() => {
    if (activeTab === 'parts') {
      return [
        { id: 'all', label: 'ทั้งหมด' },
        { id: 'under_700', label: '< ฿700', min: '', max: '700' },
        { id: '700_1500', label: '฿700 – 1,500', min: '700', max: '1500' },
        { id: '1500_2500', label: '฿1,500 – 2,500', min: '1500', max: '2500' },
        { id: 'above_2500', label: '> ฿2,500', min: '2500', max: '' },
      ];
    }
    return [
      { id: 'all', label: 'ทั้งหมด' },
      { id: 'under_400', label: '< ฿400', min: '', max: '400' },
      { id: '400_600', label: '฿400 – 600', min: '400', max: '600' },
      { id: 'above_600', label: '> ฿600', min: '600', max: '' },
    ];
  }, [activeTab]);

  const toggleCategory = (catId: string) => {
    setDraft((prev) => {
      const exists = prev.categories.includes(catId);
      const nextCategories = exists
        ? prev.categories.filter((c) => c !== catId)
        : [...prev.categories, catId];
      return { ...prev, categories: nextCategories };
    });
  };

  const handleSelectPricePreset = (preset: { id: string; min?: string; max?: string }) => {
    setDraft((prev) => ({
      ...prev,
      pricePreset: preset.id,
      minPrice: preset.min ?? '',
      maxPrice: preset.max ?? '',
    }));
  };

  const handleCustomMinPrice = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setDraft((prev) => ({ ...prev, minPrice: clean, pricePreset: 'custom' }));
  };

  const handleCustomMaxPrice = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setDraft((prev) => ({ ...prev, maxPrice: clean, pricePreset: 'custom' }));
  };

  const hasChanges = useMemo(() => {
    return (
      draft.sortBy !== DEFAULT_FILTER_STATE.sortBy ||
      draft.categories.length > 0 ||
      draft.usage !== DEFAULT_FILTER_STATE.usage ||
      draft.pricePreset !== 'all' ||
      draft.minPrice !== '' ||
      draft.maxPrice !== ''
    );
  }, [draft]);

  const handleReset = () => {
    setDraft(DEFAULT_FILTER_STATE);
    onReset();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <SafeAreaView edges={['bottom']} className="bg-white rounded-t-3xl max-h-[85%] flex-col overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-slate-200">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center">
                <Ionicons name="filter" size={18} color="#DC2626" />
              </View>
              <Text className="text-base font-bold text-slate-800 font-heading">
                ตัวกรอง & จัดเรียง ({activeTab === 'parts' ? 'อะไหล่' : 'ค่าบริการ'})
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

          {/* Scrollable Content */}
          <ScrollView className="flex-1 px-5 pt-3" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Section 1: จัดเรียงลำดับ */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-heading">
                จัดเรียงตาม (Sort by)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { id: 'newest', label: 'ใหม่ล่าสุด', icon: 'time-outline' },
                  { id: 'popular', label: 'ใช้บ่อยสุด', icon: 'flame-outline' },
    { id: 'price_asc', label: 'ราคา: ต่ำไปสูง', icon: 'arrow-up-outline' },
    { id: 'price_desc', label: 'ราคา: สูงไปต่ำ', icon: 'arrow-down-outline' },
                  { id: 'name_asc', label: 'ชื่อ (ก - ฮ)', icon: 'text-outline' },
                ].map((s) => {
                  const isSelected = draft.sortBy === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.7}
                      onPress={() => setDraft((p) => ({ ...p, sortBy: s.id as SortOption }))}
                      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                        isSelected ? 'bg-slate-900 border-slate-900' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Ionicons name={s.icon as any} size={14} color={isSelected ? '#FFFFFF' : '#64748B'} />
                      <Text className={`text-xs font-heading ${isSelected ? 'text-white font-bold' : 'text-slate-700'}`}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 2: หมวดหมู่ย่อย (Multi-Select) */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">
                  หมวดหมู่ย่อย (เลือกได้หลายข้อ)
                </Text>
                {draft.categories.length > 0 && (
                  <TouchableOpacity onPress={() => setDraft((p) => ({ ...p, categories: [] }))}>
                    <Text className="text-[11px] text-red-600 font-body">เลือกทั้งหมด</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-row flex-wrap gap-2">
                {categoriesList.map((cat) => {
                  const isSelected = draft.categories.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.7}
                      onPress={() => toggleCategory(cat.id)}
                      className={`px-3 py-2 rounded-xl border flex-row items-center gap-1 ${
                        isSelected ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-heading ${isSelected ? 'text-red-700 font-bold' : 'text-slate-700'}`}>
                        {cat.label}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={13} color="#DC2626" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: ประวัติการใช้งานในใบเสนอราคา */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-heading">
                การใช้งานในใบเสนอราคา
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'used', label: 'เคยใช้ทำใบเสนอราคา' },
                  { id: 'frequent', label: 'ใช้บ่อย (≥ 2 ครั้ง)' },
                  { id: 'unused', label: 'ยังไม่เคยถูกใช้' },
                ].map((u) => {
                  const isSelected = draft.usage === u.id;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      activeOpacity={0.7}
                      onPress={() => setDraft((p) => ({ ...p, usage: u.id as UsageFilter }))}
                      className={`px-3 py-2 rounded-xl border ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-heading ${isSelected ? 'text-white font-bold' : 'text-slate-700'}`}>
                        {u.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: ช่วงราคา */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-heading">
                ช่วงราคาขาย (บาท)
              </Text>

              {/* Presets */}
              <View className="flex-row flex-wrap gap-2 mb-3">
                {pricePresets.map((p) => {
                  const isSelected = draft.pricePreset === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectPricePreset(p)}
                      className={`px-3 py-2 rounded-xl border ${
                        isSelected ? 'bg-amber-600 border-amber-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-heading ${isSelected ? 'text-white font-bold' : 'text-slate-700'}`}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Min / Max Inputs */}
              <View className="flex-row items-center gap-2">
                <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10">
                  <Text className="text-xs text-slate-400 mr-1 font-body">ต่ำสุด:</Text>
                  <TextInput
                    className="flex-1 text-xs text-slate-800 font-body py-0"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={draft.minPrice}
                    onChangeText={handleCustomMinPrice}
                  />
                  <Text className="text-xs text-slate-400 font-body">฿</Text>
                </View>

                <Text className="text-slate-400 font-body">–</Text>

                <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10">
                  <Text className="text-xs text-slate-400 mr-1 font-body">สูงสุด:</Text>
                  <TextInput
                    className="flex-1 text-xs text-slate-800 font-body py-0"
                    placeholder="ไม่จำกัด"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={draft.maxPrice}
                    onChangeText={handleCustomMaxPrice}
                  />
                  <Text className="text-xs text-slate-400 font-body">฿</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Action Bar */}
          <View className="p-4 border-t border-slate-100 flex-row gap-2.5 bg-white">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              className="flex-1 h-12 bg-slate-100 border border-slate-200 rounded-xl items-center justify-center"
            >
              <Text className="text-slate-700 font-bold text-sm font-heading">ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onApply(draft)}
              className="flex-[2] h-12 bg-[#DC2626] rounded-xl items-center justify-center shadow-sm"
            >
              <Text className="text-white font-bold text-sm font-heading">
                นำตัวกรองไปใช้ ({matchingCount} รายการ)
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
