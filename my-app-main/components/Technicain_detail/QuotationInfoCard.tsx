import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuotationItem {
  details_id?: number;
  item_id?: number;
  item_name: string;
  item_type_id: number;
  item_type_name?: string;
  quantity: string | number;
  unit_price: string | number;
  total_price: string | number;
}

interface QuotationInfoCardProps {
  quotation?: {
    quotation_id: number;
    quote_no?: string;
    quote_status_id?: number;
    quote_status_name?: string;
    total_repair_price?: string | number;
    total_cancel_price?: string | number;
    customer_remark?: string | null;
    items?: QuotationItem[];
    parts?: QuotationItem[];
    services?: QuotationItem[];
    total_parts?: number;
    total_services?: number;
  } | null;
  actualSymptom?: string;
}

export default function QuotationInfoCard({
  quotation,
  actualSymptom,
}: QuotationInfoCardProps) {
  if (!quotation) return null;

  const quoteNo =
    quotation.quote_no ||
    `QUO-${String(quotation.quotation_id).padStart(6, '0')}`;

  const parts =
    quotation.parts ||
    (quotation.items?.filter((it) => it.item_type_id === 1) ?? []);
  const services =
    quotation.services ||
    (quotation.items?.filter((it) => it.item_type_id === 2) ?? []);

  const totalParts =
    quotation.total_parts ??
    parts.reduce((sum, it) => sum + (parseFloat(String(it.total_price)) || 0), 0);

  const totalServices =
    quotation.total_services ??
    services.reduce(
      (sum, it) => sum + (parseFloat(String(it.total_price)) || 0),
      0
    );

  const grandTotal =
    Number(quotation.total_repair_price) || totalParts + totalServices;

  // Status badge config
  const getStatusBadge = () => {
    const sId = quotation.quote_status_id;
    const sName = quotation.quote_status_name || '';

    if (sId === 2 || sName.includes('อนุมัติแล้ว')) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        label: 'อนุมัติแล้ว (ซ่อม)',
        icon: 'checkmark-circle-outline' as const,
      };
    }
    if (sId === 3 || sName.includes('ยกเลิก') || sName.includes('ไม่อนุมัติ')) {
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        label: 'ลูกค้ายกเลิกการซ่อม',
        icon: 'close-circle-outline' as const,
      };
    }
    if (sId === 4 || sId === 5 || quotation.customer_remark) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-800',
          label: 'ขอแก้ไข/เพิ่มเติมรายการ',
        icon: 'alert-circle-outline' as const,
      };
    }
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      label: 'รอลูกค้าอนุมัติ',
      icon: 'time-outline' as const,
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <View className="mb-4">
      {/* Header Section Label */}
      <View className="flex-row items-center mb-2 ml-1">
        <View className="w-1 h-4 bg-[#D32F2F] mr-2 rounded-sm" />
        <Text className="text-sm font-bold text-[#D32F2F]">
          ข้อมูลใบเสนอราคา (QUOTATION)
        </Text>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/5 elevation-2">
        {/* Quote No & Status Header */}
        <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
          <View>
            <Text className="text-xs text-slate-400 font-medium">เลขที่ใบเสนอราคา</Text>
            <Text className="text-base font-extrabold text-slate-800">{quoteNo}</Text>
          </View>
          <View
            className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full border ${statusBadge.bg} ${statusBadge.border}`}
          >
            <Ionicons name={statusBadge.icon} size={14} color="#334155" />
            <Text className={`text-xs font-bold ${statusBadge.text}`}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        {/* ── Banner กรณีลูกค้าขอแก้ไข (ตีกลับ) ── */}
        {quotation.customer_remark ? (
          <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 my-3">
            <View className="flex-row items-center gap-1 mb-0.5">
              <Ionicons name="chatbubble-ellipses-outline" size={15} color="#d97706" />
              <Text className="text-xs font-bold text-amber-900">
                ลูกค้าแจ้งขอแก้ไข/เพิ่มเติมรายการ:
              </Text>
            </View>
            <Text className="text-xs text-amber-950 font-medium pl-4">
              &ldquo;{quotation.customer_remark}&rdquo;
            </Text>
          </View>
        ) : null}

        {/* อาการเสียจริง */}
        {actualSymptom ? (
          <View className="py-2.5 border-b border-slate-100">
            <Text className="text-xs text-slate-400 font-medium mb-1">
              ผลตรวจเช็คอาการเสียจริง (ช่าง)
            </Text>
            <Text className="text-sm font-semibold text-slate-800">
              {actualSymptom}
            </Text>
          </View>
        ) : null}

        {/* ตารางอะไหล่ (Parts) */}
        {parts.length > 0 && (
          <View className="py-3 border-b border-slate-100">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1">
                <Ionicons name="hardware-chip-outline" size={15} color="#2563eb" />
                <Text className="text-xs font-bold text-blue-900">รายการอะไหล่</Text>
              </View>
              <Text className="text-xs font-bold text-blue-700">
                รวม {totalParts.toLocaleString()} บ.
              </Text>
            </View>

            {parts.map((p, idx) => (
              <View
                key={p.details_id || idx}
                className="flex-row items-center justify-between py-1 px-2 rounded bg-slate-50 mb-1"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-medium text-slate-700" numberOfLines={1}>
                    {p.item_name}
                  </Text>
                  <Text className="text-[11px] text-slate-400">
                    {Number(p.quantity)} x {Number(p.unit_price).toLocaleString()} บ.
                  </Text>
                </View>
                <Text className="text-xs font-bold text-slate-800">
                  {Number(p.total_price).toLocaleString()} บ.
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ตารางค่าบริการ / ค่าแรง (Services) */}
        {services.length > 0 && (
          <View className="py-3 border-b border-slate-100">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1">
                <Ionicons name="construct-outline" size={15} color="#ea580c" />
                <Text className="text-xs font-bold text-orange-900">ค่าบริการ / ค่าแรง</Text>
              </View>
              <Text className="text-xs font-bold text-orange-700">
                รวม {totalServices.toLocaleString()} บ.
              </Text>
            </View>

            {services.map((s, idx) => (
              <View
                key={s.details_id || idx}
                className="flex-row items-center justify-between py-1 px-2 rounded bg-slate-50 mb-1"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-medium text-slate-700" numberOfLines={1}>
                    {s.item_name}
                  </Text>
                  <Text className="text-[11px] text-slate-400">
                    {Number(s.quantity)} x {Number(s.unit_price).toLocaleString()} บ.
                  </Text>
                </View>
                <Text className="text-xs font-bold text-slate-800">
                  {Number(s.total_price).toLocaleString()} บ.
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ยอดรวมทั้งสิ้น */}
        <View className="flex-row justify-between items-center pt-3">
          <View>
            <Text className="text-xs text-slate-500 font-medium">ยอดรวมเสนอราคา</Text>
            {quotation.quote_status_id === 3 ? (
              <Text className="text-[11px] text-rose-600 font-medium">
                (ลูกค้ายกเลิก ชำระค่าตรวจเช็ค 300 บ.)
              </Text>
            ) : null}
          </View>
          <Text className="text-xl font-black text-[#D32F2F]">
            {grandTotal.toLocaleString()}{' '}
            <Text className="text-xs font-normal text-slate-500">บาท</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
