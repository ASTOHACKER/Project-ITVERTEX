import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getQuotation } from '@/lib/api';

interface QuotationDetailModalProps {
  visible: boolean;
  quotationId: number | null;
  onClose: () => void;
  onEdit?: (quotationId: number, jobNo: string, jobId: number, customerName: string) => void;
  onViewJob?: (jobId: number, jobNo: string, customerName: string, phone: string) => void;
}

export default function QuotationDetailModal({
  visible,
  quotationId,
  onClose,
  onEdit,
  onViewJob,
}: QuotationDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (visible && quotationId) {
      loadDetail(quotationId);
    } else {
      setData(null);
    }
  }, [visible, quotationId]);

  const loadDetail = async (id: number) => {
    setLoading(true);
    try {
      const res = await getQuotation(id);
      if (res?.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching quotation detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const quoteNo = data?.quote_no || (quotationId ? `QUO-${String(quotationId).padStart(6, '0')}` : '-');
  const jobNo = data?.job_no || (data?.job_id ? `REP-${String(data.job_id).padStart(6, '0')}` : '-');

  const parts = data?.parts || (data?.items?.filter((it: any) => it.item_type_id === 1) ?? []);
  const services = data?.services || (data?.items?.filter((it: any) => it.item_type_id === 2) ?? []);

  const totalParts =
    data?.total_parts ??
    parts.reduce((sum: number, it: any) => sum + (parseFloat(it.total_price) || 0), 0);

  const totalServices =
    data?.total_services ??
    services.reduce((sum: number, it: any) => sum + (parseFloat(it.total_price) || 0), 0);

  const grandTotal = Number(data?.total_repair_price) || totalParts + totalServices;

  // Status badge config
  const getStatusBadge = () => {
    if (!data) return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700', label: 'กำลังโหลด' };
    const sId = data.quote_status_id;
    const sName = data.quote_status_name || '';

    if (sId === 2 || sName.includes('อนุมัติแล้ว')) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        text: 'text-emerald-800',
        label: 'อนุมัติแล้ว',
        icon: 'checkmark-circle-outline' as const,
      };
    }
    if (sId === 3 || sName.includes('ยกเลิก') || sName.includes('ไม่อนุมัติ')) {
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-300',
        text: 'text-rose-800',
        label: 'ลูกค้ายกเลิกการซ่อม',
        icon: 'close-circle-outline' as const,
      };
    }
    if (sId === 4 || sId === 5 || data.customer_remark) {
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
      border: 'border-blue-300',
      text: 'text-blue-800',
      label: 'รอลูกค้าอนุมัติ',
      icon: 'time-outline' as const,
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white w-full max-w-xl rounded-2xl p-5 shadow-sm shadow-black/25 elevation-5 max-h-[90vh]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-slate-200">
            <View>
              <Text className="text-lg font-bold text-slate-800 font-heading">รายละเอียดใบเสนอราคา</Text>
              <View className="flex-row items-center gap-2 mt-0.5">
                <Text className="text-xs font-bold text-[#D32F2F]">{quoteNo}</Text>
                <Text className="text-slate-300 text-xs">•</Text>
                <Text className="text-xs font-bold text-slate-600">{jobNo}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-1"
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-20 justify-center items-center">
              <ActivityIndicator size="large" color="#D32F2F" />
              <Text className="mt-3 text-sm text-slate-500 font-body">กำลังโหลดข้อมูลใบเสนอราคา...</Text>
            </View>
          ) : data ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {/* Status Badge & Actions row */}
              <View className="flex-row justify-between items-center pb-3 border-b border-slate-100">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-slate-500 font-medium">สถานะใบเสนอราคา:</Text>
                  <View className={`px-2.5 py-1 rounded-full border ${statusBadge.bg} ${statusBadge.border} flex-row items-center gap-1`}>
                    <Ionicons name={statusBadge.icon} size={13} color={statusBadge.text.includes('emerald') ? '#059669' : statusBadge.text.includes('rose') ? '#e11d48' : statusBadge.text.includes('amber') ? '#d97706' : '#2563eb'} />
                    <Text className={`text-xs font-bold ${statusBadge.text}`}>{statusBadge.label}</Text>
                  </View>
                </View>
              </View>

              {/* ── Banner กรณีลูกค้าขอแก้ไข (ตีกลับ) ── */}
              {data.customer_remark ? (
                <View className="bg-amber-50 border border-amber-300 rounded-xl p-3 my-2.5">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Ionicons name="warning" size={16} color="#d97706" />
                    <Text className="text-amber-900 font-bold text-xs font-heading">
                      ลูกค้าส่งคำขอแก้ไข / ตีกลับใบเสนอราคา:
                    </Text>
                  </View>
                  <Text className="text-amber-950 text-sm font-body pl-5 font-medium leading-5">
                    &ldquo;{data.customer_remark}&rdquo;
                  </Text>
                </View>
              ) : null}

              {/* อาการเสียจริง */}
              {data.actual_symptom ? (
                <View className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 my-2">
                  <View className="flex-row items-center gap-1 mb-0.5">
                    <Ionicons name="construct-outline" size={15} color="#475569" />
                    <Text className="text-xs font-bold text-slate-700">ผลตรวจเช็คอาการเสียจริง:</Text>
                  </View>
                  <Text className="text-xs text-slate-800 font-medium pl-5">
                    {data.actual_symptom}
                  </Text>
                </View>
              ) : null}

              {/* ตารางรายการอะไหล่ (Parts) */}
              {parts.length > 0 && (
                <View className="mt-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="hardware-chip-outline" size={15} color="#2563eb" />
                      <Text className="text-xs font-bold text-blue-900 font-heading">รายการอะไหล่ (Parts)</Text>
                    </View>
                    <Text className="text-xs font-bold text-blue-700 font-heading">
                      รวม {totalParts.toLocaleString()} บ.
                    </Text>
                  </View>

                  <View className="border border-slate-200 rounded-lg overflow-hidden mb-2">
                    <View className="flex-row bg-slate-100 py-1.5 px-3 border-b border-slate-200">
                      <Text className="text-[11px] font-bold text-slate-600 flex-1">ชื่ออะไหล่</Text>
                      <Text className="text-[11px] font-bold text-slate-600 w-16 text-center">จำนวน</Text>
                      <Text className="text-[11px] font-bold text-slate-600 w-20 text-right">ราคา/หน่วย</Text>
                      <Text className="text-[11px] font-bold text-slate-600 w-20 text-right">รวม (บ.)</Text>
                    </View>
                    {parts.map((p: any, idx: number) => (
                      <View
                        key={p.details_id || idx}
                        className={`flex-row py-2 px-3 bg-white items-center ${
                          idx === parts.length - 1 ? '' : 'border-b border-slate-100'
                        }`}
                      >
                        <Text className="text-xs text-slate-800 flex-1 font-medium">{p.item_name}</Text>
                        <Text className="text-xs text-slate-600 w-16 text-center">{Number(p.quantity)}</Text>
                        <Text className="text-xs text-slate-600 w-20 text-right">
                          {Number(p.unit_price).toLocaleString()}
                        </Text>
                        <Text className="text-xs font-bold text-slate-800 w-20 text-right">
                          {Number(p.total_price).toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ตารางรายการค่าบริการ (Services) */}
              {services.length > 0 && (
                <View className="mt-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="build-outline" size={15} color="#ea580c" />
                      <Text className="text-xs font-bold text-orange-900 font-heading">
                        ค่าบริการ / ค่าแรง (Services)
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-orange-700 font-heading">
                      รวม {totalServices.toLocaleString()} บ.
                    </Text>
                  </View>

                  <View className="border border-slate-200 rounded-lg overflow-hidden mb-2">
                    <View className="flex-row bg-slate-100 py-1.5 px-3 border-b border-slate-200">
                      <Text className="text-[11px] font-bold text-slate-600 flex-1">รายการบริการ</Text>
                      <Text className="text-[11px] font-bold text-slate-600 w-16 text-center">จำนวน</Text>
                      <Text className="text-[11px] font-bold text-slate-600 w-20 text-right">ราคา/หน่วย</Text>
                      <Text className="text-[11px] font-bold text-slate-600 w-20 text-right">รวม (บ.)</Text>
                    </View>
                    {services.map((s: any, idx: number) => (
                      <View
                        key={s.details_id || idx}
                        className={`flex-row py-2 px-3 bg-white items-center ${
                          idx === services.length - 1 ? '' : 'border-b border-slate-100'
                        }`}
                      >
                        <Text className="text-xs text-slate-800 flex-1 font-medium">{s.item_name}</Text>
                        <Text className="text-xs text-slate-600 w-16 text-center">{Number(s.quantity)}</Text>
                        <Text className="text-xs text-slate-600 w-20 text-right">
                          {Number(s.unit_price).toLocaleString()}
                        </Text>
                        <Text className="text-xs font-bold text-slate-800 w-20 text-right">
                          {Number(s.total_price).toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ยอดรวมทั้งสิ้น */}
              <View className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-3 flex-row justify-between items-center">
                <View>
                  <Text className="text-xs font-bold text-slate-700 font-heading">ยอดรวมเสนอราคาทั้งสิ้น</Text>
                  {data.quote_status_id === 3 ? (
                    <Text className="text-[11px] text-rose-600 font-medium">
                      (ลูกค้ายกเลิก ชำระค่าตรวจเช็ค 300 บ.)
                    </Text>
                  ) : (
                    <Text className="text-[11px] text-slate-500 font-body">
                      รวมค่าอะไหล่และค่าบริการทั้งหมด
                    </Text>
                  )}
                </View>
                <Text className="text-2xl font-black text-[#D32F2F] font-heading">
                  {grandTotal.toLocaleString()}{' '}
                  <Text className="text-xs font-normal text-slate-600">บาท</Text>
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2 mt-4 pt-3 border-t border-slate-200">
                {onEdit ? (
                  <TouchableOpacity
                    className="flex-1 bg-blue-600 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-blue-700"
                    onPress={() => {
                      onClose();
                      onEdit(
                        data.quotation_id,
                        jobNo,
                        data.job_id,
                        data.customer_name || ''
                      );
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#ffffff" />
                    <Text className="text-white text-xs font-bold font-heading">แก้ไขใบเสนอราคา</Text>
                  </TouchableOpacity>
                ) : null}

                {onViewJob ? (
                  <TouchableOpacity
                    className="flex-1 bg-slate-100 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-slate-200 border border-slate-200"
                    onPress={() => {
                      onClose();
                      onViewJob(
                        data.job_id,
                        jobNo,
                        data.customer_name || '',
                        data.phone || ''
                      );
                    }}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#334155" />
                    <Text className="text-slate-700 text-xs font-bold font-heading">ดูใบรับซ่อม</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  className="px-4 bg-slate-200 py-2.5 rounded-xl justify-center items-center active:bg-slate-300"
                  onPress={onClose}
                >
                  <Text className="text-slate-700 text-xs font-bold font-heading">ปิด</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View className="py-16 items-center">
              <Text className="text-slate-500 text-sm">ไม่พบข้อมูลใบเสนอราคา</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
