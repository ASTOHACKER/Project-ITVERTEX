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
      {/* ช่องค้นหา */}
      <View className="flex-1 flex-row items-center bg-white border border-slate-200 rounded-xl px-3 h-11 shadow-sm shadow-black/5">
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          className="flex-1 ml-2 text-sm text-slate-800 font-body h-full"
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
        />
        {value.trim().length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ปุ่มกรอง */}
      {showFilter && (
        <TouchableOpacity 
          className={`w-11 h-11 rounded-xl justify-center items-center relative border shadow-sm ${
            hasActiveFilters 
              ? 'bg-red-50 border-red-500' 
              : 'bg-white border-slate-200'
          }`}
          onPress={onPressFilter}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={hasActiveFilters ? '#DC2626' : '#475569'} 
          />
          {hasActiveFilters && (
            <View className="absolute -top-1.5 -right-1.5 bg-[#DC2626] rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center border border-white">
              <Text className="text-white text-[10px] font-bold font-heading leading-none">
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}