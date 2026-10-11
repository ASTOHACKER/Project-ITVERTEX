import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { QuotationItem } from '@/types/quotation';
import QuotationStatusBadge, { isModificationQuote, canEditOrDeleteQuote } from './QuotationStatusBadge';

interface QuotationTableProps {
  filteredQuotations: QuotationItem[];
  onOpenDetail: (item: QuotationItem) => void;
  onViewJob: (item: QuotationItem) => void;
  onEdit: (item: QuotationItem) => void;
  onPromptDelete: (item: QuotationItem) => void;
}

export default function QuotationTable({
  filteredQuotations,
  onOpenDetail,
  onViewJob,
  onEdit,
  onPromptDelete,
}: QuotationTableProps) {
  return (
    <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm shadow-black/5 elevation-2 mb-6">
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={{ minWidth: 980, width: '100%' }}>
          {/* ── Table Header (tablet/desktop only) ── */}
          <View className="bg-slate-50 flex-row py-3.5 px-4 border-b border-slate-200 items-center">
            <Text className="text-slate-700 font-bold text-xs font-heading w-[140px]">เลขที่เอกสาร</Text>
            <Text className="text-slate-700 font-bold text-xs font-heading w-[160px]">ลูกค้า</Text>
            <Text className="text-slate-700 font-bold text-xs font-heading flex-1 min-w-[240px]">
              อุปกรณ์ / ผลตรวจเช็คอาการ
            </Text>
            <Text className="text-slate-700 font-bold text-xs font-heading w-[140px] text-right pr-2">
              ยอดรวมเสนอราคา
            </Text>
            <Text className="text-slate-700 font-bold text-xs font-heading w-[130px] text-center">
              สถานะ
            </Text>
            <Text className="text-slate-700 font-bold text-xs font-heading w-[200px] text-center">
              จัดการ
            </Text>
          </View>

          {/* ── Table Rows ── */}
          {filteredQuotations.map((item, index) => {
            const isModification = isModificationQuote(item);
            const grandTotal = Number(item.total_repair_price || 0).toLocaleString();
            const isEven = index % 2 === 0;

            return (
              <View
                key={item.quotation_id}
                className={`flex-row py-3.5 px-4 items-center border-b border-slate-100 ${
                  isModification
                    ? 'bg-amber-50/60'
                    : isEven
                    ? 'bg-white'
                    : 'bg-slate-50/40'
                }`}
              >
                {/* คอลัมน์ 1: เลขที่เอกสาร */}
                <View className="w-[140px] pr-2">
                  <TouchableOpacity
                    onPress={() => onOpenDetail(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    className="flex-row items-center gap-1 active:opacity-70"
                  >
                    <Text className="text-[13px] font-bold text-slate-900 font-heading underline">
                      {item.quote_no}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onViewJob(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    className="bg-red-50 self-start px-2 py-1 rounded-md mt-1.5 border border-red-100 flex-row items-center gap-1 active:bg-red-100"
                  >
                    <Text className="text-[11px] font-bold text-[#D32F2F] font-heading">
                      {item.job_no}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* คอลัมน์ 2: ลูกค้า */}
                <View className="w-[160px] pr-2">
                  <Text className="text-[13px] font-bold text-slate-800 font-heading" numberOfLines={1}>
                    {item.customer_name}
                  </Text>
                  <Text className="text-xs text-slate-500 font-body mt-0.5">
                    {item.phone || '-'}
                  </Text>
                </View>

                {/* คอลัมน์ 3: อุปกรณ์ / อาการ */}
                <View className="flex-1 min-w-[240px] pr-3">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[13px] font-bold text-slate-800 font-heading" numberOfLines={1}>
                      {[item.brand, item.model].filter(Boolean).join(' ') || item.device_type || 'อุปกรณ์'}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-600 font-body mt-0.5 pl-5" numberOfLines={2}>
                    {item.actual_symptom ? (
                      <Text className="text-amber-800 font-medium">ตรวจพบ: {item.actual_symptom}</Text>
                    ) : (
                      `อาการ: ${item.symptom_details || '-'}`
                    )}
                  </Text>
                  {isModification && item.customer_remark ? (
                    <View className="bg-amber-100/90 rounded-lg px-2 py-1 self-start mt-1.5 ml-5 border border-amber-300">
                      <Text className="text-[11px] font-bold text-amber-900" numberOfLines={2}>
                        ลูกค้าขอแก้ไข: &ldquo;{item.customer_remark}&rdquo;
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* คอลัมน์ 4: ยอดรวมเสนอราคา */}
                <View className="w-[140px] pr-2 items-end justify-center">
                  <Text className="text-[15px] font-bold text-[#D32F2F] font-heading">
                    {grandTotal} <Text className="text-xs font-normal text-slate-600">บาท</Text>
                  </Text>
                </View>

                {/* คอลัมน์ 5: สถานะ */}
                <View className="w-[130px] px-1 items-center justify-center">
                  <QuotationStatusBadge item={item} />
                </View>

                {/* คอลัมน์ 6: ปุ่มจัดการ */}
                <View className="w-[200px] flex-row items-center justify-center gap-2">
                  <TouchableOpacity
                    style={{ minHeight: 44, justifyContent: 'center' }}
                    className="bg-sky-50 px-3 rounded-xl flex-row items-center gap-1 border border-sky-200 active:opacity-80"
                    onPress={() => onOpenDetail(item)}
                  >
                    <Text className="text-xs font-bold text-sky-700 font-heading">รายละเอียด</Text>
                  </TouchableOpacity>

                  {canEditOrDeleteQuote(item) ? (
                    <>
                      <TouchableOpacity
                        style={{ minHeight: 44, justifyContent: 'center' }}
                        className={`px-3 rounded-xl flex-row items-center gap-1 active:opacity-80 ${
                          isModification ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        onPress={() => onEdit(item)}
                      >
                        <Ionicons name="create-outline" size={14} color="#ffffff" />
                        <Text className="text-xs font-bold text-white font-heading">แก้ไข</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
                        className="bg-rose-50 border border-rose-200 rounded-xl flex-row items-center justify-center px-2.5 active:bg-rose-100"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={`ลบ ${item.quote_no}`}
                        accessibilityRole="button"
                        onPress={() => onPromptDelete(item)}
                      >
                        <Ionicons name="trash-outline" size={15} color="#e11d48" />
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
