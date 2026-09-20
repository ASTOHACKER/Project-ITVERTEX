// 1. React & React Native
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';

// 3. API helpers
import { getLookupBrands, getLookupDeviceTypes, getLookupModels } from '@/lib/api';

// 4. Constants & UI
import { FONTS } from '@/constants/theme';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import CalendarPicker from '@/components/ui/CalendarPicker';

interface DeviceTypeItem {
  device_type_id: number;
  device_type_name: string;
}

interface BrandItem {
  brand_id: number;
  brand_name: string;
}

interface DeviceModelItem {
  model_id: number;
  model_name: string;
  brand_id: number;
}

interface DeviceFormCardProps {
  deviceTypeId: number | null;
  onChangeDeviceTypeId: (id: number | null, name: string) => void;
  brandId: number | null;
  brandName?: string;
  onChangeBrandId: (id: number | null, name: string) => void;
  model: string;
  onChangeModel: (text: string) => void;
  serialNumber: string;
  onChangeSerialNumber: (text: string) => void;
  importantSoftware: string;
  onChangeImportantSoftware: (text: string) => void;
  passcode: string;
  onChangePasscode: (text: string) => void;
  warrantyYear: number;
  onChangeWarrantyYear: (year: number) => void;
  warrantyEnd: string;
  onChangeWarrantyEnd: (text: string) => void;
  accessories: string;
  onChangeAccessories: (text: string) => void;
  symptomDetails: string;
  onChangeSymptomDetails: (text: string) => void;
}

export default function DeviceFormCard({
  deviceTypeId,
  onChangeDeviceTypeId,
  brandId,
  brandName = '',
  onChangeBrandId,
  model,
  onChangeModel,
  serialNumber,
  onChangeSerialNumber,
  importantSoftware,
  onChangeImportantSoftware,
  passcode,
  onChangePasscode,
  warrantyYear,
  onChangeWarrantyYear,
  warrantyEnd,
  onChangeWarrantyEnd,
  accessories,
  onChangeAccessories,
  symptomDetails,
  onChangeSymptomDetails,
}: DeviceFormCardProps) {
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<DeviceModelItem[]>([]);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchLookupData();
  }, []);

  useEffect(() => {
    fetchModels();
  }, [brandId, deviceTypeId]);

  const fetchLookupData = async () => {
    setLoadingLookup(true);
    try {
      const [dtRes, bRes] = await Promise.all([
        getLookupDeviceTypes().catch(() => ({ data: [] })),
        getLookupBrands().catch(() => ({ data: [] })),
      ]);

      if (dtRes?.data) setDeviceTypes(dtRes.data);
      if (bRes?.data) setBrands(bRes.data);
    } catch (err) {
      console.error('Fetch lookup error in DeviceFormCard:', err);
    } finally {
      setLoadingLookup(false);
    }
  };

  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      const res = await getLookupModels(brandId || undefined, deviceTypeId || undefined);
      if (res?.data) {
        setModels(res.data);
      }
    } catch (err) {
      console.warn('Fetch models error:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const warrantyOptions = [
    { label: 'ไม่มีประกัน / หมดประกัน', value: 0 },
    { label: '1 ปี', value: 1 },
    { label: '2 ปี', value: 2 },
    { label: '3 ปี', value: 3 },
    { label: '5 ปี', value: 5 },
  ];

  return (
    <View className="bg-white rounded-2xl overflow-hidden mb-5 border border-orange-50 shadow-sm shadow-black/5 elevation-2">
      {/* Header */}
      <View className="bg-orange-50 px-4 py-2.5 flex-row justify-between items-center">
        <Text className="text-sm font-bold text-amber-600">ข้อมูลอุปกรณ์และการรับเครื่อง</Text>
        {(loadingLookup || loadingModels) && <ActivityIndicator size="small" color="#F59E0B" />}
      </View>

      <View className="p-4 flex-col gap-3">
        {/* Device Type Dropdown */}
        <View className="flex-col gap-1">
          <Text className="text-xs text-slate-500 font-semibold">ประเภทอุปกรณ์ (Device Type) *</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            containerStyle={styles.dropdownContainer}
            itemTextStyle={styles.itemTextStyle}
            data={deviceTypes.map((dt) => ({ label: dt.device_type_name, value: dt.device_type_id }))}
            search
            maxHeight={250}
            labelField="label"
            valueField="value"
            placeholder="เลือกประเภทอุปกรณ์..."
            searchPlaceholder="ค้นหาประเภท..."
            value={deviceTypeId}
            onChange={(item) => {
              onChangeDeviceTypeId(item.value, item.label);
            }}
          />
        </View>

        {/* Brand Dropdown with SearchableDropdown */}
        <View className="flex-col gap-1">
          <SearchableDropdown
            label="ยี่ห้อ (Brand)"
            required
            placeholder={loadingLookup ? 'กำลังโหลดยี่ห้อ...' : 'เลือกยี่ห้อ หรือพิมพ์ระบุเอง...'}
            searchPlaceholder="ค้นหายี่ห้อ หรือพิมพ์ยี่ห้อใหม่..."
            value={brandId ? brandId : (brandName || null)}
            options={brands.map((b) => ({ label: b.brand_name, value: b.brand_id }))}
            onSelect={(val, opt) => {
              onChangeBrandId(Number(val), opt?.label || '');
            }}
            allowCustom={true}
            onCustomSelect={(customVal) => {
              const trimmed = customVal.trim();
              const existing = brands.find(
                (b) => b.brand_name.toLowerCase() === trimmed.toLowerCase()
              );
              if (existing) {
                onChangeBrandId(existing.brand_id, existing.brand_name);
              } else {
                onChangeBrandId(null, trimmed);
              }
            }}
          />
        </View>

        {/* Model Input with SearchableDropdown */}
        <View className="flex-col gap-1">
          <SearchableDropdown
            label="รุ่น (Model)"
            placeholder={loadingModels ? 'กำลังโหลดรุ่น...' : 'เลือกรุ่น หรือพิมพ์ระบุเอง...'}
            searchPlaceholder="ค้นหารุ่น..."
            value={model}
            options={models.map((m) => ({ label: m.model_name, value: m.model_name }))}
            onSelect={(val) => onChangeModel(String(val))}
            allowCustom={true}
            onCustomSelect={(val) => onChangeModel(val)}
          />
        </View>

        {/* Serial Number */}
        <View className="flex-col gap-1">
          <Text className="text-xs text-slate-500">Serial Number (S/N)</Text>
          <TextInput
            className="h-[42px] border border-slate-200 rounded-lg px-3 text-sm text-slate-800 bg-white"
            value={serialNumber}
            onChangeText={onChangeSerialNumber}
            placeholder="S/N ตามตัวเครื่อง"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {/* Customer Reported Symptoms (Text Area) */}
        <View className="flex-col gap-1">
          <Text className="text-xs text-slate-500 font-semibold">อาการเสียที่ลูกค้าแจ้ง (Customer Symptom) *</Text>
          <TextInput
            className="h-24 border border-slate-200 rounded-lg px-3 pt-2.5 text-sm text-slate-800 bg-white"
            style={{ textAlignVertical: 'top' }}
            value={symptomDetails}
            onChangeText={onChangeSymptomDetails}
            placeholder="ระบุอาการเสียตามที่ลูกค้าแจ้ง เช่น เปิดเครื่องไม่ติด มีเสียงดัง พัดลมไม่หมุน..."
            placeholderTextColor="#A0A0A0"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Included Accessories */}
        <View className="flex-col gap-1">
          <Text className="text-xs text-slate-500">อุปกรณ์ที่นำมาด้วย (Accessories)</Text>
          <TextInput
            className="h-[42px] border border-slate-200 rounded-lg px-3 text-sm text-slate-800 bg-white"
            value={accessories}
            onChangeText={onChangeAccessories}
            placeholder="เช่น สายชาร์จ (Adapter), สาย HDMI, กล่อง"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {/* Warranty Year Dropdown */}
        <View className="flex-col gap-1">
          <Text className="text-xs text-slate-500">ระยะเวลารับประกัน (Warranty)</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            containerStyle={styles.dropdownContainer}
            itemTextStyle={styles.itemTextStyle}
            data={warrantyOptions}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="เลือกระยะประกัน..."
            value={warrantyYear}
            onChange={(item) => {
              onChangeWarrantyYear(item.value);
            }}
          />
        </View>

        {/* Warranty End Date */}
        <View className="flex-col gap-1">
          <Text className="text-xs text-slate-500">วันที่หมดประกัน (YYYY-MM-DD)</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 h-[42px] border border-slate-200 rounded-lg px-3 text-sm text-slate-800 bg-white"
              value={warrantyEnd}
              onChangeText={onChangeWarrantyEnd}
              placeholder="เช่น 2027-12-31 (เว้นว่างได้)"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowCalendar(true)}
              activeOpacity={0.7}
              accessibilityLabel="เลือกวันที่จากปฏิทิน"
              className="w-[42px] h-[42px] rounded-lg bg-red-50 border border-red-200 items-center justify-center"
            >
              <Ionicons name="calendar-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        <CalendarPicker
          visible={showCalendar}
          initialDate={warrantyEnd}
          onSelect={onChangeWarrantyEnd}
          onClose={() => setShowCalendar(false)}
        />

        {/* Important Software */}
        <View className="flex-col gap-1">
          <Text className="text-xs text-slate-500">โปรแกรมสำคัญที่ต้องสำรองข้อมูล</Text>
          <TextInput
            className="h-[42px] border border-slate-200 rounded-lg px-3 text-sm text-slate-800 bg-white"
            value={importantSoftware}
            onChangeText={onChangeImportantSoftware}
            placeholder="เช่น บัญชี Express, ไฟล์งานหน้า Desktop (ไม่มีให้เว้นว่าง)"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {/* Passcode */}
        <View className="flex-col gap-1">
          <Text className="text-xs text-slate-500">รหัสผ่านปลดล็อคเครื่อง (Password / PIN)</Text>
          <TextInput
            className="h-[42px] border border-slate-200 rounded-lg px-3 text-sm text-slate-800 bg-white"
            value={passcode}
            onChangeText={onChangePasscode}
            placeholder="ไม่มีให้เว้นว่าง"
            placeholderTextColor="#A0A0A0"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    height: 42,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#A0A0A0',
    fontFamily: FONTS.body,
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: FONTS.body,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 8,
    fontFamily: FONTS.body,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemTextStyle: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: FONTS.body,
  },
});
