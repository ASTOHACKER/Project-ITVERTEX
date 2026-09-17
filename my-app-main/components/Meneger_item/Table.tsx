// 1. React & React Native
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import {
  getItemSubcategory,
  PARTS_CATEGORIES,
  SERVICES_CATEGORIES,
} from './ItemFilterSheet';

interface PartTableProps {
  title: string;
  data: any[];
  headerColor?: string;
  onPressDetails?: (item: any) => void;
}

export default function PartTable({ title, data, headerColor = '#0F172A', onPressDetails }: PartTableProps) {
  return (
    <View className="bg-white mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Table Header Strip */}
      <View className="py-3 px-4 flex-row items-center justify-between" style={{ backgroundColor: headerColor }}>
        <Text className="text-white font-bold text-sm font-heading">{title}</Text>
        <View className="bg-white/20 px-2.5 py-0.5 rounded-full">
          <Text className="text-white text-xs font-bold font-heading">{data.length} รายการ</Text>
        </View>
      </View>

      {/* Column Headers */}
      <View className="flex-row bg-slate-50 py-2.5 px-4 border-b border-slate-200">
        <Text className="font-bold text-xs text-slate-600 font-heading" style={{ flex: 2 }}>
          ชื่อรายการ / หมวดหมู่
        </Text>
        <Text className="font-bold text-xs text-slate-600 text-right font-heading" style={{ flex: 1.2 }}>
          ราคาขาย (บาท)
        </Text>
        {onPressDetails && (
          <Text className="font-bold text-xs text-slate-600 text-right w-[50px] font-heading">
            จัดการ
          </Text>
        )}
      </View>

      {/* Rows */}
      {data.length === 0 ? (
        <View className="py-10 items-center justify-center">
          <Ionicons name="filter-outline" size={32} color="#94A3B8" />
          <Text className="text-sm font-bold text-slate-600 font-heading mt-2">ไม่พบรายการที่ตรงตามตัวกรอง</Text>
          <Text className="text-xs text-slate-400 font-body mt-0.5">ลองปรับตัวกรองหรือล้างคำค้นหาใหม่</Text>
        </View>
      ) : (
        data.map((item, index) => {
          const isService = Number(item.item_type_id) === 2;
          const subCatKey = getItemSubcategory(item.item_name, isService ? 'services' : 'parts');
          const catList = isService ? SERVICES_CATEGORIES : PARTS_CATEGORIES;
          const catLabel = catList.find((c) => c.id === subCatKey)?.label;

          return (
            <TouchableOpacity
              key={item.item_id || index}
              activeOpacity={0.7}
              onPress={() => onPressDetails?.(item)}
              className={`flex-row items-center py-3 px-4 bg-white ${
                index === data.length - 1 ? '' : 'border-b border-slate-100'
              }`}
            >
              <View style={{ flex: 2 }}>
                <Text className="text-sm font-bold text-slate-800 font-heading" numberOfLines={1}>
                  {item.item_name}
                </Text>
                
                <View className="flex-row items-center gap-1.5 mt-1 flex-wrap">
                  {catLabel && (
                    <View className="bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200">
                      <Text className="text-[10px] text-slate-600 font-body">{catLabel}</Text>
                    </View>
                  )}
                  {Number(item.used_count) > 0 && (
                    <View className="bg-blue-50 rounded px-1.5 py-0.5 border border-blue-200 flex-row items-center gap-0.5">
                      <Ionicons name="receipt-outline" size={10} color="#2563EB" />
                      <Text className="text-[10px] text-blue-700 font-bold font-heading">
                        ใช้ {item.used_count} ครั้ง
                      </Text>
                    </View>
                  )}
                  {item.item_code && (
                    <Text className="text-[10px] text-slate-400 font-body">
                      {item.item_code}
                    </Text>
                  )}
                </View>
              </View>

              <Text className="text-sm font-bold text-slate-900 text-right font-heading" style={{ flex: 1.2 }}>
                ฿{item.selling_price ? Number(item.selling_price).toLocaleString() : '-'}
              </Text>

              {onPressDetails && (
                <View className="w-[50px] items-end justify-center">
                  <View className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 items-center justify-center">
                    <Ionicons name="create-outline" size={16} color="#0284C7" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}
