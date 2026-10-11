// 1. React & React Native
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import type { RepairJob } from '@/types/repair';

// Unified 7-stage progress indicator:
// 1: รับเครื่อง, 2: ตรวจเช็ค, 3: รออนุมัติ, 4: กำลังซ่อม, 5: รอชำระ, 6: รอมารับ, 7: เสร็จสิ้น
export const CUSTOMER_STEPS = [
  'รับเครื่อง',
  'ตรวจเช็ค',
  'รออนุมัติ',
  'กำลังซ่อม',
  'รอชำระ',
  'รอมารับ',
  'เสร็จสิ้น',
];

export const getProgressStage = (statusId: number, statusText?: string): number => {
  const id = Number(statusId);
  const s = statusText || '';
  if (id === 8 || s.includes('เสร็จ') || s.includes('ส่งมอบ')) return 7; // เสร็จสิ้น
  if (id === 6 || s.includes('มารับ') || s.includes('พร้อมรับ')) return 6; // รอมารับ (รอลูกค้ามารับเครื่อง)
  if (id === 7 || s.includes('รอชำระ')) return 5; // รอชำระ
  if (id === 5 || s.includes('อนุมัติแล้ว') || s.includes('ซ่อม')) return 4; // กำลังซ่อม
  if (id === 4 || s.includes('รออนุมัติ') || s.includes('รอการอนุมัติ')) return 3; // รออนุมัติ
  if (id === 2 || id === 3 || s.includes('เช็ค') || s.includes('เสนอ')) return 2; // ตรวจเช็ค / เสนอราคา
  return 1; // รับเครื่อง
};

export const getStatusConfig = (status: string, statusId?: number, isCancelledJob?: boolean) => {
  const s = status || '';
  const id = Number(statusId);

  // ── ตรวจสอบการยกเลิกก่อนเป็นอันดับแรก ──
  if (isCancelledJob || id === 9 || s.includes('ยกเลิก')) {
    return { color: '#DC2626', bg: '#FEE2E2', text: '#B91C1C', icon: 'close-circle' };
  }

  // ── กลุ่มที่ 3: โทนสีเสร็จสิ้น & ปิดงาน ──
  if (id === 8 || s.includes('เสร็จ') || s.includes('ชำระแล้ว')) {
    return { color: '#16A34A', bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle' };
  }

  // ── กลุ่มที่ 2: โทนสีส้ม/อำพัน/เหลือง (ขั้นตอนการรอ & ลูกค้าดำเนินการ) ──
  if (id === 6 || s.includes('มารับเครื่อง') || s.includes('พร้อมรับ')) {
    return { color: '#CA8A04', bg: '#FEF9C3', text: '#854D0E', icon: 'cube' };
  }
  if (id === 7 || s.includes('รอชำระ')) {
    return { color: '#D97706', bg: '#FEF3C7', text: '#B45309', icon: 'cash' };
  }
  if (id === 4 || s.includes('รออนุมัติ') || s.includes('รอการอนุมัติ')) {
    return { color: '#EA580C', bg: '#FFEDD5', text: '#C2410C', icon: 'alert-circle' };
  }

  // ── กลุ่มที่ 1: โทนสีน้ำเงิน/ฟ้า (ขั้นตอนตรวจเช็ค & กำลังซ่อม) ──
  if (id === 5 || s.includes('อนุมัติแล้ว') || s.includes('กำลังซ่อม') || s.includes('ซ่อม')) {
    return { color: '#1D4ED8', bg: '#EFF6FF', text: '#1E40AF', icon: 'hammer' };
  }
  if (id === 3 || s.includes('เสนอราคา')) {
    return { color: '#4F46E5', bg: '#E0E7FF', text: '#3730A3', icon: 'receipt' };
  }
  if (id === 2 || s.includes('ดำเนินการตรวจเช็ค')) {
    return { color: '#2563EB', bg: '#DBEAFE', text: '#1D4ED8', icon: 'search' };
  }
  return { color: '#0284C7', bg: '#E0F2FE', text: '#0369A1', icon: 'clipboard' };
};

export const getDeviceIcon = (type?: string, brand?: string) => {
  const t = `${type || ''} ${brand || ''}`.toLowerCase();
  if (t.includes('print') || t.includes('ปริ้น') || t.includes('canon') || t.includes('epson') || t.includes('brother') || t.includes('hp')) {
    return 'print-outline';
  }
  if (t.includes('phone') || t.includes('มือถือ') || t.includes('โทรศัพท์') || t.includes('iphone') || t.includes('samsung') || t.includes('oppo') || t.includes('vivo')) {
    return 'phone-portrait-outline';
  }
  if (t.includes('macbook') || t.includes('laptop') || t.includes('โน้ตบุ๊ก') || t.includes('notebook') || t.includes('asus') || t.includes('acer') || t.includes('tuf') || t.includes('rog') || t.includes('lenovo') || t.includes('dell')) {
    return 'laptop-outline';
  }
  if (t.includes('ipad') || t.includes('แท็บเล็ต') || t.includes('tablet')) {
    return 'tablet-portrait-outline';
  }
  if (t.includes('pc') || t.includes('คอมพิวเตอร์') || t.includes('computer') || t.includes('desktop')) {
    return 'desktop-outline';
  }
  return 'hardware-chip-outline';
};

interface CustomerJobCardProps {
  item: RepairJob;
  onPressDetails: (jobId: string | number) => void;
}

const formatDeviceTitle = (brand?: string, model?: string, type?: string) => {
  const b = (brand || '').trim();
  const m = (model || '').trim();
  if (b.includes('ประกอบเอง') || b.includes('Custom PC')) {
    if (!m || m.includes('สเปกประกอบเอง') || m.includes('ไม่ระบุ')) {
      return 'คอมพิวเตอร์ประกอบเอง (Custom PC)';
    }
    return `ประกอบเอง (Custom PC) ${m}`;
  }
  const combined = `${b} ${m}`.trim();
  return combined || type || 'อุปกรณ์ไอที';
};

export default function CustomerJobCard({ item, onPressDetails }: CustomerJobCardProps) {
  const targetId = item.id || item.job_id || '';
  const deviceTitle = formatDeviceTitle(item.brand, item.model, item.device_type);
  const jobNo = item.job_number || item.job_no || (targetId ? `REP-${String(targetId).padStart(6, '0')}` : '-');
  const symptomText = item.symptoms || item.symptom_details || item.symptom || 'ไม่ระบุอาการเสีย';
  const statusText = item.status || item.status_name || 'รอตรวจเช็ค';
  const statusId = Number(item.status_id || 1);
  const isCancelled =
    statusId === 9 ||
    statusText.includes('ยกเลิก') ||
    Number(item.quote_status_id ?? item.quotation?.quote_status_id) === 3 ||
    Boolean(item.is_cancelled);
  const statusCfg = getStatusConfig(statusText, statusId, isCancelled);
  const isCompleted = (statusId === 8 || statusText.includes('เสร็จ') || statusText.includes('ส่งมอบ')) && !isCancelled;
  const progressStage = getProgressStage(statusId, statusText);
  const isReadyForPickup = (statusId === 6 || statusText.includes('มารับเครื่อง') || statusText.includes('พร้อมรับ')) && !isCancelled;
  const isNeedsApproval = (statusId === 4 || statusText.includes('รอการอนุมัติ') || statusText.includes('รออนุมัติ')) && !isCancelled;
  const isPendingPayment = (statusId === 7 || statusText.includes('รอชำระ')) && !isCancelled;

  return (
    <View className="bg-white rounded-3xl mb-4 border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Card Top Strip */}
      <View className="p-4 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center border"
              style={{
                backgroundColor: statusCfg.bg,
                borderColor: `${statusCfg.color}35`,
              }}
            >
              <Ionicons
                name={getDeviceIcon(item.device_type, item.brand) as any}
                size={19}
                color={statusCfg.color}
              />
            </View>
            <View>
              <Text className="text-[11px] font-bold text-slate-400 font-body uppercase tracking-wider">
                รหัสงานซ่อม
              </Text>
              <Text className="text-sm font-bold text-slate-900 font-heading">
                {jobNo}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border"
            style={{
              backgroundColor: statusCfg.bg,
              borderColor: `${statusCfg.color}40`,
            }}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusCfg.color }}
            />
            <Text
              className="text-xs font-bold font-heading"
              style={{ color: statusCfg.text }}
            >
              {isCancelled ? 'ยกเลิกซ่อม' : statusText}
            </Text>
          </View>
        </View>

        {/* Device Title */}
        <View className="flex-row items-baseline justify-between mb-1.5">
          <Text
            className="text-base font-bold text-slate-900 font-heading flex-1 pr-2"
            numberOfLines={1}
          >
            {deviceTitle}
          </Text>
          {item.device_type ? (
            <View className="bg-slate-100 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-medium text-slate-500 font-body">
                {item.device_type}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Symptom Box */}
        <View className="bg-slate-50/90 rounded-xl p-2.5 mb-3 border border-slate-100 flex-row items-start gap-2">
          <Ionicons name="chatbox-ellipses-outline" size={14} color="#64748B" style={{ marginTop: 1 }} />
          <Text className="text-xs text-slate-600 font-body flex-1 leading-4" numberOfLines={2}>
            <Text className="font-bold text-slate-700">อาการเสีย: </Text>
            {symptomText}
          </Text>
        </View>

        {/* 7-Step Visual Progress Stepper */}
        <View className="bg-slate-50/70 rounded-2xl p-3 mb-3 border border-slate-100/90">
          {/* Spotlight Header */}
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center gap-1.5">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isCancelled ? '#DC2626' : isCompleted ? '#10B981' : statusCfg.color }}
              />
              <Text className="text-[12px] font-bold font-heading text-slate-800">
                {isCancelled
                  ? 'ยกเลิกการซ่อม (รอรับเครื่องคืน)'
                  : isCompleted
                  ? 'ส่งมอบเครื่องเสร็จสิ้น'
                  : `ขั้นตอนที่ ${progressStage}/7: ${CUSTOMER_STEPS[progressStage - 1]}`}
              </Text>
            </View>
          </View>

          {/* 7-Stage Stepper Track */}
          <View className="w-full py-1">
            <View className="flex-row items-start justify-between">
              {CUSTOMER_STEPS.map((stepName, idx) => {
                const stepNum = idx + 1;
                const isDone = isCompleted || progressStage > stepNum;
                const isCurrent = !isCompleted && progressStage === stepNum;
                const activeColor = isCompleted ? '#10B981' : statusCfg.color;
                const inactiveColor = '#E2E8F0';

                // Line connecting from previous step
                const hasLeftLine = idx > 0;
                const isLeftLineActive = isCompleted || progressStage >= stepNum;

                // Line connecting to next step
                const hasRightLine = idx < CUSTOMER_STEPS.length - 1;
                const isRightLineActive = isCompleted || progressStage > stepNum;

                return (
                  <View key={stepName} className="items-center flex-1">
                    {/* Circle and connecting segments: 100% vertically centered via flexbox */}
                    <View className="w-full h-6 flex-row items-center justify-center">
                      {/* Left line segment */}
                      <View
                        className="flex-1 h-[2.5px]"
                        style={{
                          backgroundColor: !hasLeftLine
                            ? 'transparent'
                            : isLeftLineActive
                            ? activeColor
                            : inactiveColor,
                        }}
                      />

                      {/* Circle Node */}
                      <View className="items-center justify-center z-10">
                        {isDone ? (
                          <View className="w-5 h-5 rounded-full bg-emerald-500 items-center justify-center border-2 border-white shadow-xs">
                            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                          </View>
                        ) : isCurrent ? (
                          <View
                            className="w-[22px] h-[22px] rounded-full items-center justify-center border-2 border-white shadow-xs"
                            style={{
                              backgroundColor: statusCfg.color,
                            }}
                          >
                            <View className="w-1.5 h-1.5 rounded-full bg-white" />
                          </View>
                        ) : (
                          <View className="w-3.5 h-3.5 rounded-full bg-slate-200 border-2 border-white" />
                        )}
                      </View>

                      {/* Right line segment */}
                      <View
                        className="flex-1 h-[2.5px]"
                        style={{
                          backgroundColor: !hasRightLine
                            ? 'transparent'
                            : isRightLineActive
                            ? activeColor
                            : inactiveColor,
                        }}
                      />
                    </View>

                    {/* Step label text */}
                    <Text
                      className={`text-[9px] mt-1.5 font-body text-center leading-tight ${
                        isCurrent
                          ? 'font-bold'
                          : isDone
                          ? 'font-medium text-slate-700'
                          : 'text-slate-400'
                      }`}
                      style={[{ minHeight: 13 }, isCurrent ? { color: statusCfg.color } : undefined]}
                      numberOfLines={1}
                    >
                      {stepName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Price / Status Row */}
        {item.total_amount && Number(item.total_amount) > 0 ? (
          <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100">
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name={isCancelled ? 'close-circle-outline' : isCompleted ? 'receipt-outline' : 'cash-outline'}
                size={15}
                color={isCancelled ? '#B45309' : isCompleted ? '#10B981' : '#64748B'}
              />
              <Text className="text-xs text-slate-500 font-body">
                {isCancelled ? 'ค่าตรวจเช็คเครื่อง (ยกเลิกซ่อม)' : isCompleted ? 'ยอดชำระแล้ว' : 'ยอดรวมค่าซ่อม'}
              </Text>
            </View>
            <Text
              className={`text-base font-bold font-heading ${
                isCancelled ? 'text-amber-700' : isCompleted ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              ฿{Number(item.total_amount).toLocaleString()}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100">
            <View className="flex-row items-center gap-1.5 flex-1 pr-2">
              <Ionicons name="time-outline" size={15} color="#94A3B8" />
              <Text className="text-xs text-slate-400 font-body" numberOfLines={1}>
                {statusId === 1 || statusId === 2
                  ? 'อยู่ระหว่างตรวจเช็คสภาพเครื่อง'
                  : statusId === 3
                  ? 'กำลังจัดทำใบเสนอราคา'
                  : 'รอการสรุปค่าบริการ'}
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded-md bg-slate-100">
              <Text className="text-[10px] font-medium text-slate-500 font-body">
                {statusId <= 3 ? 'รอประเมินราคา' : '-'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Card Action Footer */}
      <View className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex-row items-center justify-end gap-2">
        {isNeedsApproval ? (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 bg-purple-600 active:bg-purple-700 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            onPress={() => onPressDetails(targetId)}
          >
            <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold font-heading">
              ตรวจสอบและอนุมัติใบเสนอราคา
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        ) : isPendingPayment ? (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 bg-amber-500 active:bg-amber-600 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            onPress={() => onPressDetails(targetId)}
          >
            <Ionicons name="card-outline" size={16} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold font-heading">
              ดูวิธีชำระเงิน & แจ้งชำระ
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        ) : isReadyForPickup ? (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 bg-sky-600 active:bg-sky-700 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            onPress={() => onPressDetails(targetId)}
          >
            <Ionicons name="cube-outline" size={16} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold font-heading">
              เครื่องพร้อมรับ (ดูรายละเอียด)
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-1 bg-slate-900 active:bg-slate-800 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-xs"
            onPress={() => onPressDetails(targetId)}
          >
            <Ionicons name="newspaper-outline" size={15} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold font-heading">
              ดูรายละเอียดและประวัติงาน
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
