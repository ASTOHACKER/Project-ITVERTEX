// 1. React & React Native
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface DeviceCatalogTableProps {
  type: 'types' | 'brands' | 'models';
  title: string;
  data: any[];
  headerColor?: string;
  onPressEdit: (item: any) => void;
  onPressDelete: (item: any) => void;
}

export default function DeviceCatalogTable({
  type,
  title,
  data,
  headerColor = '#0F172A',
  onPressEdit,
  onPressDelete,
}: DeviceCatalogTableProps) {
  return (
    <View className="bg-white mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Table Header Strip */}
      <View
        className="py-3 px-4 flex-row items-center justify-between"
        style={{ backgroundColor: headerColor }}
      >
        <Text className="text-white font-bold text-sm font-heading">{title}</Text>
        <View className="bg-white/20 px-2.5 py-0.5 rounded-full">
          <Text className="text-white text-xs font-bold font-heading">
            {data.length} รายการ
          </Text>
        </View>
      </View>

      {/* Column Headers */}
      <View className="flex-row items-center bg-slate-50 py-2.5 px-4 border-b border-slate-200">
        <Text className="font-bold text-xs text-slate-600 font-heading flex-1 pr-2">
          {type === 'types'
            ? 'ประเภทอุปกรณ์'
            : type === 'brands'
            ? 'ยี่ห้อ (แบรนด์)'
            : 'รุ่นอุปกรณ์ / ยี่ห้อ'}
        </Text>
        <Text className="font-bold text-xs text-slate-600 font-heading text-right min-w-[120px] pr-3">
          {type === 'types'
            ? 'สถิติในระบบ'
            : type === 'brands'
            ? 'ประเภทอุปกรณ์ที่ผูก'
            : 'ประเภทอุปกรณ์'}
        </Text>
        <Text className="font-bold text-xs text-slate-600 text-center w-[76px] font-heading">
          จัดการ
        </Text>
      </View>

      {/* Rows */}
      {data.length === 0 ? (
        <View className="py-12 items-center justify-center">
          <Ionicons name="filter-outline" size={36} color="#94A3B8" />
          <Text className="text-sm font-bold text-slate-600 font-heading mt-2">
            ไม่พบข้อมูลตามเงื่อนไข
          </Text>
          <Text className="text-xs text-slate-400 font-body mt-0.5">
            ลองปรับตัวกรองหรือเพิ่มข้อมูลใหม่
          </Text>
        </View>
      ) : (
        data.map((item, index) => {
          const itemKey =
            type === 'models'
              ? `model-${item.model_id}`
              : type === 'brands'
              ? `brand-${item.brand_id}`
              : `type-${item.device_type_id}`;

          return (
            <View
              key={itemKey}
              className={`flex-row items-center py-3.5 px-4 bg-white ${
                index === data.length - 1 ? '' : 'border-b border-slate-100'
              }`}
            >
              {/* Column 1: Main Info */}
              <View className="flex-1 pr-2">
                {type === 'types' && (
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 items-center justify-center">
                      <Ionicons name="hardware-chip-outline" size={16} color="#DC2626" />
                    </View>
                    <Text className="text-sm font-bold text-slate-800 font-heading" numberOfLines={1}>
                      {item.device_type_name}
                    </Text>
                  </View>
                )}

                {type === 'brands' && (
                  <View>
                    <Text className="text-sm font-bold text-slate-800 font-heading" numberOfLines={1}>
                      {item.brand_name}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-body mt-0.5">
                      มีในแคตตาล็อก {item.model_count ?? 0} รุ่น
                    </Text>
                  </View>
                )}

                {type === 'models' && (
                  <View>
                    <Text className="text-sm font-bold text-slate-800 font-heading" numberOfLines={1}>
                      {item.model_name}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <View className="bg-red-50 rounded-md px-2 py-0.5 border border-red-100">
                        <Text className="text-[10px] text-red-700 font-bold font-heading">
                          {item.brand_name}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Column 2: Secondary / Badge Info */}
              <View className="min-w-[120px] items-end justify-center pr-3">
                {type === 'types' && (
                  <View className="flex-row items-center gap-1.5 flex-wrap justify-end">
                    <View className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      <Text className="text-[10px] font-semibold text-blue-700 font-heading">
                        {item.brand_count ?? 0} แบรนด์
                      </Text>
                    </View>
                    <View className="bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      <Text className="text-[10px] font-semibold text-purple-700 font-heading">
                        {item.model_count ?? 0} รุ่น
                      </Text>
                    </View>
                  </View>
                )}

                {type === 'brands' && (
                  <View className="flex-row items-center gap-1 flex-wrap justify-end">
                    {item.device_types && item.device_types.length > 0 ? (
                      item.device_types.slice(0, 2).map((dt: any) => (
                        <View
                          key={dt.device_type_id}
                          className="bg-slate-100 rounded-md px-1.5 py-0.5 border border-slate-200"
                        >
                          <Text className="text-[10px] font-medium text-slate-600 font-body">
                            {dt.device_type_name}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text className="text-[11px] text-slate-400 italic font-body">ยังไม่ผูก</Text>
                    )}
                    {item.device_types && item.device_types.length > 2 && (
                      <Text className="text-[10px] text-slate-400 font-body">
                        +{item.device_types.length - 2}
                      </Text>
                    )}
                  </View>
                )}

                {type === 'models' && (
                  <View className="bg-slate-100 rounded-md px-2 py-0.5 border border-slate-200">
                    <Text className="text-[11px] font-medium text-slate-600 font-body" numberOfLines={1}>
                      {item.device_type_name}
                    </Text>
                  </View>
                )}
              </View>

              {/* Column 3: Actions */}
              <View className="flex-row items-center justify-center gap-1.5 w-[76px]">
                <TouchableOpacity
                  onPress={() => onPressEdit(item)}
                  activeOpacity={0.7}
                  className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 items-center justify-center active:bg-slate-200"
                >
                  <Ionicons name="pencil" size={14} color="#334155" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onPressDelete(item)}
                  activeOpacity={0.7}
                  className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 items-center justify-center active:bg-red-100"
                >
                  <Ionicons name="trash-outline" size={14} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
