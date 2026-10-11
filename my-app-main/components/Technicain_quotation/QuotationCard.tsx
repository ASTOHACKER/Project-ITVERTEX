import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { QuotationItem } from '@/types/quotation';
import QuotationStatusBadge, { isModificationQuote, canEditOrDeleteQuote } from './QuotationStatusBadge';

interface QuotationCardProps {
  item: QuotationItem;
  onOpenDetail: (item: QuotationItem) => void;
  onViewJob: (item: QuotationItem) => void;
  onEdit: (item: QuotationItem) => void;
  onPromptDelete: (item: QuotationItem) => void;
}

export default function QuotationCard({
  item,
  onOpenDetail,
  onViewJob,
  onEdit,
  onPromptDelete,
}: QuotationCardProps) {
  const isModification = isModificationQuote(item);
  const grandTotal = Number(item.total_repair_price || 0).toLocaleString();
  const deviceTitle =
    [item.brand, item.model].filter(Boolean).join(' ') || item.device_type || 'อุปกรณ์';

  return (
    <TouchableOpacity
      key={item.quotation_id}
      activeOpacity={0.85}
      onPress={() => onOpenDetail(item)}
      className={`rounded-2xl p-4 mb-3 border shadow-sm shadow-black/5 elevation-2 ${
        isModification ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'
      }`}
    >
      {/* Row 1: doc no + status */}
      <View className="flex-row items-start justify-between gap-2 pb-2.5 border-b border-slate-100 mb-2.5">
        <View className="flex-1 min-w-0">
          <Text className="text-[15px] font-bold text-slate-900 font-heading" numberOfLines={1}>
            {item.quote_no}
          </Text>
          <TouchableOpacity
            onPress={() => onViewJob(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="bg-red-50 self-start px-2 py-1 rounded-md mt-1.5 border border-red-100 flex-row items-center gap-1 active:bg-red-100"
          >
            <Text className="text-[11px] font-bold text-[#D32F2F] font-heading">
              {item.job_no}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="shrink-0 pt-0.5">
          <QuotationStatusBadge item={item} />
        </View>
      </View>

      {/* Row 2: device */}
      <View className="flex-row items-center gap-2 mb-1.5">
        <Text className="text-[15px] font-bold text-slate-900 flex-1 font-heading" numberOfLines={1}>
          {deviceTitle}
        </Text>
      </View>

      {/* Row 3: customer + phone */}
      <View className="flex-row items-center gap-2 mb-2.5">
        <Text className="text-[13px] font-medium text-slate-700 font-body flex-1" numberOfLines={1}>
          {item.customer_name || 'ลูกค้าทั่วไป'}
        </Text>
        {Boolean(item.phone && item.phone !== '-') && (
          <View className="flex-row items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shrink-0">
            <Text className="text-xs text-slate-600 font-body">{item.phone}</Text>
          </View>
        )}
      </View>

      {/* Row 4: symptom bubble */}
      <View className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mb-2.5">
        <View className="flex-row items-start gap-1.5">
          <Text className="text-[13px] text-slate-600 flex-1 leading-5 font-body" numberOfLines={2}>
            <Text className="font-bold text-slate-700 font-heading">
              {item.actual_symptom ? 'ตรวจพบ: ' : 'อาการ: '}
            </Text>
            {item.actual_symptom || item.symptom_details || '-'}
          </Text>
        </View>
      </View>

      {isModification && item.customer_remark ? (
        <View className="bg-amber-100/90 border border-amber-300 rounded-xl px-3 py-2 mb-2.5 flex-row items-start gap-1.5">
          <Text className="text-xs font-medium text-amber-900 flex-1 leading-4" numberOfLines={2}>
            ลูกค้าขอแก้ไข: &ldquo;{item.customer_remark}&rdquo;
          </Text>
        </View>
      ) : null}

      {/* Row 5: price + count */}
      <View className="flex-row items-baseline justify-between mb-3">
        <Text className="text-xs text-slate-500 font-body">
          ยอดเสนอราคา{item.item_count ? ` • ${item.item_count} รายการ` : ''}
        </Text>
        <Text className="text-lg font-bold text-[#D32F2F] font-heading">
          {grandTotal} <Text className="text-xs font-normal text-slate-500">บาท</Text>
        </Text>
      </View>

      {/* Row 6: thumb-first actions, 44px min */}
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() => onOpenDetail(item)}
          activeOpacity={0.75}
          style={{ minHeight: 44 }}
          className="flex-1 bg-sky-50 border border-sky-200 rounded-xl flex-row items-center justify-center gap-1.5"
        >
          <Text className="text-[13px] font-bold text-sky-700 font-heading">รายละเอียด</Text>
        </TouchableOpacity>
        {canEditOrDeleteQuote(item) ? (
          <>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              activeOpacity={0.8}
              style={{ minHeight: 44, backgroundColor: isModification ? '#F59E0B' : '#2563EB' }}
              className="flex-1 rounded-xl flex-row items-center justify-center gap-1.5 shadow-sm"
            >
              <Ionicons name="create-outline" size={15} color="#ffffff" />
              <Text className="text-[13px] font-bold text-white font-heading">แก้ไข</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onPromptDelete(item)}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ minHeight: 44, minWidth: 44 }}
              accessibilityLabel={`ลบ ${item.quote_no}`}
              accessibilityRole="button"
              className="bg-rose-50 border border-rose-200 rounded-xl items-center justify-center px-3 active:bg-rose-100"
            >
              <Ionicons name="trash-outline" size={17} color="#e11d48" />
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
