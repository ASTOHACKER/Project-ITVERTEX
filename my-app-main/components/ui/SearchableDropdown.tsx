// 1. React & React Native
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

export interface DropdownOption {
  label: string;
  value: string | number;
  subtitle?: string;
}

interface SearchableDropdownProps {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  value: string | number | null;
  options: DropdownOption[];
  onSelect: (value: any, option?: DropdownOption) => void;
  disabled?: boolean;
  allowCustom?: boolean;
  onCustomSelect?: (customValue: string) => void;
  error?: string;
  required?: boolean;
}

export default function SearchableDropdown({
  label,
  placeholder = 'เลือกรายการ...',
  searchPlaceholder = 'พิมพ์ค้นหา...',
  value,
  options,
  onSelect,
  disabled = false,
  allowCustom = false,
  onCustomSelect,
  error,
  required = false,
}: SearchableDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find label of selected value
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  const displayLabel = selectedOption
    ? selectedOption.label
    : value
    ? String(value)
    : '';

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const handleOpen = () => {
    if (disabled) return;
    setSearchQuery('');
    setModalVisible(true);
  };

  const handleSelect = (option: DropdownOption) => {
    onSelect(option.value, option);
    setModalVisible(false);
  };

  const handleCustom = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (onCustomSelect) {
      onCustomSelect(trimmed);
    } else {
      onSelect(trimmed);
    }
    setModalVisible(false);
  };

  return (
    <View className="w-full mb-3">
      {label && (
        <Text className="text-xs font-semibold text-slate-700 mb-1.5">
          {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
      )}

      {/* Trigger Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={handleOpen}
        className={`flex-row items-center justify-between h-11 px-3.5 bg-white border rounded-xl ${
          error
            ? 'border-red-400 bg-red-50/20'
            : disabled
            ? 'border-slate-200 bg-slate-100 opacity-60'
            : 'border-slate-300'
        }`}
      >
        <Text
          numberOfLines={1}
          className={`flex-1 text-sm ${
            displayLabel ? 'text-slate-800 font-medium' : 'text-slate-400'
          }`}
        >
          {displayLabel || placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={disabled ? '#94A3B8' : '#64748B'}
        />
      </TouchableOpacity>

      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%] flex-col p-4 shadow-2xl">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-slate-800">
                {label || 'เลือกรายการ'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-slate-100 justify-center items-center"
              >
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="flex-row items-center bg-slate-100 rounded-xl px-3 h-10 my-3 border border-slate-200">
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor="#94A3B8"
                autoFocus={false}
                returnKeyType={allowCustom ? 'done' : 'search'}
                onSubmitEditing={() => {
                  if (allowCustom && searchQuery.trim().length > 0) {
                    handleCustom();
                  }
                }}
                className="flex-1 ml-2 text-sm text-slate-800 h-full"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Custom value option if enabled */}
            {allowCustom &&
              searchQuery.trim().length > 0 &&
              !options.some(
                (o) =>
                  o.label.toLowerCase() === searchQuery.trim().toLowerCase()
              ) && (
                <TouchableOpacity
                  onPress={handleCustom}
                  className="flex-row items-center p-3 mb-2 bg-sky-50 border border-sky-200 rounded-xl"
                >
                  <Ionicons name="add-circle" size={20} color="#0284C7" />
                  <Text className="ml-2 text-xs font-medium text-sky-800">
                    ใช้ระบุเอง: &ldquo;{searchQuery.trim()}&rdquo;
                  </Text>
                </TouchableOpacity>
              )}

            {/* List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View className="py-8 items-center justify-center">
                  <Ionicons name="search-outline" size={36} color="#CBD5E1" />
                  <Text className="text-xs text-slate-400 mt-2">
                    ไม่พบรายการที่ค้นหา
                  </Text>
                  {allowCustom && searchQuery.trim().length > 0 && (
                    <Text className="text-xs text-sky-600 mt-1">
                      สามารถแตะปุ่ม &ldquo;ใช้ระบุเอง&rdquo; ด้านบน เพื่อใช้ชื่อนี้ได้
                    </Text>
                  )}
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className={`flex-row items-center justify-between py-3 px-3.5 rounded-xl mb-1 ${
                      isSelected ? 'bg-sky-50 border border-sky-100' : 'active:bg-slate-50'
                    }`}
                  >
                    <View className="flex-1 mr-2">
                      <Text
                        className={`text-sm ${
                          isSelected
                            ? 'font-bold text-sky-700'
                            : 'font-normal text-slate-700'
                        }`}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle && (
                        <Text className="text-xs text-slate-400 mt-0.5">
                          {item.subtitle}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-sharp" size={18} color="#0284C7" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
