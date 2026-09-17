// 1. React & React Native
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface SearchFilterBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onPressFilter?: () => void;
  showFilter?: boolean;
  activeFilterCount?: number;
  placeholder?: string;
}

export default function SearchFilterBar({ 
  value, 
  onChangeText, 
  onPressFilter, 
  showFilter = false,
  activeFilterCount = 0,
  placeholder = 'ค้นหารายการ...'
}: SearchFilterBarProps) {
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <View className="flex-row gap-2.5 mb-3">
      {/* ช่องค้นหา — 48px กดง่าย อ่านชัด */}
      <View className="flex-1 flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 min-h-[48px] shadow-sm shadow-black/5">
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          className="flex-1 ml-2 text-[15px] text-slate-900 py-2"
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel="ค้นหารายการซ่อม"
        />
        {value.trim().length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="ล้างคำค้น">
            <Ionicons name="close-circle" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* ปุ่มกรอง */}
      {showFilter && (
        <TouchableOpacity 
          className={`w-12 h-12 rounded-2xl justify-center items-center relative border shadow-sm ${
            hasActiveFilters 
              ? 'bg-red-50 border-[#DC2626]' 
              : 'bg-white border-slate-200'
          }`}
          onPress={onPressFilter}
          activeOpacity={0.7}
          accessibilityLabel="กรองรายการ"
        >
          <Ionicons 
            name="filter" 
            size={22} 
            color={hasActiveFilters ? '#DC2626' : '#475569'} 
          />
          {hasActiveFilters && (
            <View className="absolute -top-1.5 -right-1.5 bg-[#DC2626] rounded-full min-w-[20px] h-[20px] px-1 items-center justify-center border-2 border-white">
              <Text className="text-white text-[11px] font-bold leading-none">
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}