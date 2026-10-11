// 1. React & React Native
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

export type CustomerFilterTab = 'all' | 'in_progress' | 'pending_approval' | 'completed';

interface CustomerHeaderProps {
  customerName: string;
  counts: {
    inProgress: number;
    pendingApproval: number;
    completed: number;
    total: number;
  };
  activeTab: CustomerFilterTab;
  onSelectTab: (tab: CustomerFilterTab) => void;
}

export default function CustomerHeader({
  customerName,
  counts,
  activeTab,
  onSelectTab,
}: CustomerHeaderProps) {
  return (
    <View className="bg-[#DC2626] px-5 pt-4 pb-6 rounded-b-[28px] shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <Text className="text-white/80 text-xs font-bold tracking-wider font-heading uppercase">
              IT VERTEX CUSTOMER
            </Text>
          </View>
          <Text className="text-white text-xl font-bold font-heading mt-0.5">
            สวัสดี, {customerName}
          </Text>
        </View>
      </View>

      {/* Quick Lifecycle Counters */}
      <View className="flex-row items-center justify-between gap-2 pt-1">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectTab('in_progress')}
          className={`flex-1 py-2 px-2 rounded-xl border ${
            activeTab === 'in_progress'
              ? 'bg-white text-slate-900 border-white'
              : 'bg-white/10 border-white/20'
          }`}
        >
          <View className="flex-row items-center justify-between mb-0.5">
            <Ionicons
              name="hammer-outline"
              size={14}
              color={activeTab === 'in_progress' ? '#DC2626' : '#FFFFFF'}
            />
            <Text
              className={`text-base font-bold font-heading ${
                activeTab === 'in_progress' ? 'text-slate-900' : 'text-white'
              }`}
            >
              {counts.inProgress}
            </Text>
          </View>
          <Text
            className={`text-[10.5px] font-body ${
              activeTab === 'in_progress' ? 'text-slate-600 font-medium' : 'text-white/80'
            }`}
            numberOfLines={1}
          >
            กำลังดำเนินการ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectTab('pending_approval')}
          className={`flex-1 py-2 px-2 rounded-xl border ${
            activeTab === 'pending_approval'
              ? 'bg-white border-white'
              : counts.pendingApproval > 0
              ? 'bg-amber-500/30 border-amber-300'
              : 'bg-white/10 border-white/20'
          }`}
        >
          <View className="flex-row items-center justify-between mb-0.5">
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={
                activeTab === 'pending_approval'
                  ? '#D97706'
                  : counts.pendingApproval > 0
                  ? '#FEF08A'
                  : '#FFFFFF'
              }
            />
            <Text
              className={`text-base font-bold font-heading ${
                activeTab === 'pending_approval'
                  ? 'text-slate-900'
                  : counts.pendingApproval > 0
                  ? 'text-amber-200'
                  : 'text-white'
              }`}
            >
              {counts.pendingApproval}
            </Text>
          </View>
          <Text
            className={`text-[10.5px] font-body ${
              activeTab === 'pending_approval'
                ? 'text-slate-600 font-medium'
                : counts.pendingApproval > 0
                ? 'text-amber-100 font-bold'
                : 'text-white/80'
            }`}
            numberOfLines={1}
          >
            รออนุมัติราคา
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSelectTab('completed')}
          className={`flex-1 py-2 px-2 rounded-xl border ${
            activeTab === 'completed'
              ? 'bg-white border-white'
              : 'bg-white/10 border-white/20'
          }`}
        >
          <View className="flex-row items-center justify-between mb-0.5">
            <Ionicons
              name="checkmark-done-outline"
              size={14}
              color={activeTab === 'completed' ? '#16A34A' : '#FFFFFF'}
            />
            <Text
              className={`text-base font-bold font-heading ${
                activeTab === 'completed' ? 'text-slate-900' : 'text-white'
              }`}
            >
              {counts.completed}
            </Text>
          </View>
          <Text
            className={`text-[10.5px] font-body ${
              activeTab === 'completed' ? 'text-slate-600 font-medium' : 'text-white/80'
            }`}
            numberOfLines={1}
          >
            เสร็จสิ้น
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
