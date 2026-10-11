// 1. React & React Native
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface StaffTableProps {
  title: string;
  data: any[];
  headerColor?: string;
  onPressDetails?: (item: any) => void;
  onPressDelete?: (item: any) => void;
}

export default function StaffTable({ title, data, headerColor = '#0F172A', onPressDetails, onPressDelete }: StaffTableProps) {
  const getRoleColors = (role: string) => {
    switch (role) {
      case 'ช่าง':
        return { bg: '#FEF3C7', text: '#B45309', icon: 'hammer-outline' };
      case 'ผู้จัดการ':
        return { bg: '#FEE2E2', text: '#B91C1C', icon: 'shield-outline' };
      case 'ลูกค้า':
        return { bg: '#DCFCE7', text: '#15803D', icon: 'person-outline' };
      case 'พนักงาน':
      default:
        return { bg: '#E0F2FE', text: '#0369A1', icon: 'briefcase-outline' };
    }
  };

  return (
    <View className="bg-white mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <View className="py-3 px-4 flex-row items-center justify-between" style={{ backgroundColor: headerColor }}>
        <Text className="text-white font-bold text-sm font-heading">{title}</Text>
        <View className="bg-white/20 px-2.5 py-0.5 rounded-full">
          <Text className="text-white text-xs font-bold font-heading">{data.length} คน</Text>
        </View>
      </View>

      <View className="flex-row bg-slate-50 py-2.5 px-4 border-b border-slate-200">
        <Text className="font-bold text-xs text-slate-600 font-heading" style={{ flex: 2 }}>
          ชื่อ-นามสกุล / การติดต่อ
        </Text>
        <Text className="font-bold text-xs text-slate-600 text-right font-heading" style={{ flex: 1.2 }}>
          ตำแหน่ง
        </Text>
        {(onPressDetails || onPressDelete) && (
          <Text className="font-bold text-xs text-slate-600 text-center w-[76px] font-heading">
            จัดการ
          </Text>
        )}
      </View>

      {data.length === 0 ? (
        <View className="py-8 items-center justify-center">
          <Ionicons name="people-outline" size={28} color="#94A3B8" />
          <Text className="text-xs text-slate-400 font-body mt-1">ไม่พบรายชื่อ</Text>
        </View>
      ) : (
        data.map((item, index) => {
          const roleConfig = getRoleColors(item.role);

          return (
            <TouchableOpacity
              key={item.id || index}
              activeOpacity={0.7}
              onPress={() => onPressDetails?.(item)}
              className={`flex-row items-center py-3 px-4 bg-white ${
                index === data.length - 1 ? '' : 'border-b border-slate-100'
              }`}
            >
              <View className="flex-row items-center gap-2.5" style={{ flex: 2 }}>
                <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
                  <Text className="text-xs font-bold text-slate-700 font-heading">
                    {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-sm text-slate-800 font-heading" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-body mt-0.5" numberOfLines={1}>
                    {[item.phone, item.email].filter(Boolean).join(' • ')}
                  </Text>
                </View>
              </View>

              <View style={{ flex: 1.2, alignItems: 'flex-end', justifyContent: 'center' }}>
                <View
                  className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
                  style={{ backgroundColor: roleConfig.bg }}
                >
                  <Ionicons name={roleConfig.icon as any} size={11} color={roleConfig.text} />
                  <Text className="font-bold text-[11px] font-heading" style={{ color: roleConfig.text }}>
                    {item.role}
                  </Text>
                </View>
              </View>

              {(onPressDetails || onPressDelete) && (
                <View className="w-[76px] flex-row items-center justify-end gap-1.5">
                  {onPressDetails && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        onPressDetails(item);
                      }}
                      className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 items-center justify-center active:bg-blue-100"
                    >
                      <Ionicons name="create-outline" size={15} color="#0284C7" />
                    </TouchableOpacity>
                  )}
                  {onPressDelete && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        onPressDelete(item);
                      }}
                      className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 items-center justify-center active:bg-red-100"
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}
