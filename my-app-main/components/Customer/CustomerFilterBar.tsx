// 1. React & React Native
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import type { CustomerFilterTab } from './CustomerHeader';

interface CustomerFilterBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  activeTab: CustomerFilterTab;
  onSelectTab: (tab: CustomerFilterTab) => void;
}

const TABS: { key: CustomerFilterTab; label: string; activeColor: string }[] = [
  { key: 'all', label: 'ทั้งหมด', activeColor: '#0F172A' },
  { key: 'in_progress', label: 'กำลังดำเนินการ', activeColor: '#2563EB' },
  { key: 'pending_approval', label: 'รออนุมัติราคา', activeColor: '#EA580C' },
  { key: 'completed', label: 'เสร็จสิ้น', activeColor: '#16A34A' },
];

export default function CustomerFilterBar({
  searchQuery,
  onSearchChange,
  activeTab,
  onSelectTab,
}: CustomerFilterBarProps) {
  return (
    <View className="mb-3">
      {/* Search Bar */}
      <View className="flex-row items-center bg-white rounded-2xl px-4 py-2.5 border border-slate-200 mb-2.5 shadow-sm">
        <Ionicons name="search-outline" size={19} color="#94A3B8" />
        <TextInput
          placeholder="ค้นหาตามเลขงาน, อุปกรณ์ หรืออาการเสีย..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={onSearchChange}
          className="flex-1 ml-2 text-[14px] text-slate-800 font-body py-0"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tab Pills with 3 distinct color tones */}
      <View className="flex-row items-center gap-1.5 flex-wrap">
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => onSelectTab(tab.key)}
              className={`min-h-[40px] justify-center px-3.5 py-1.5 rounded-full border shadow-sm ${
                isSelected
                  ? 'border-transparent'
                  : 'bg-white border-slate-200 active:bg-slate-50'
              }`}
              style={{
                backgroundColor: isSelected ? tab.activeColor : '#FFFFFF',
              }}
            >
              <Text
                className={`text-xs font-heading ${
                  isSelected ? 'text-white font-bold' : 'text-slate-600 font-medium'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
