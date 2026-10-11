import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PaymentFooterButtonsProps {
  isStaff: boolean;
  paymentVerified: boolean;
  hasAlreadySubmitted: boolean;
  hasExistingPayment: boolean;
  isBusy: boolean;
  showRejectInput: boolean;
  verifying: boolean;
  submitting: boolean;
  onBack: () => void;
  onGoToHandover: () => void;
  onShowRejectInput: () => void;
  onVerifyPayment: () => void;
  onStaffCashPayment: () => void;
  onSubmitPayment: () => void;
}

export default function PaymentFooterButtons({
  isStaff,
  paymentVerified,
  hasAlreadySubmitted,
  hasExistingPayment,
  isBusy,
  showRejectInput,
  verifying,
  submitting,
  onBack,
  onGoToHandover,
  onShowRejectInput,
  onVerifyPayment,
  onStaffCashPayment,
  onSubmitPayment,
}: PaymentFooterButtonsProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-8">
      {isStaff ? (
        paymentVerified ? (
          /* Staff: ยืนยันแล้ว → ไปหน้าส่งมอบเครื่อง */
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-slate-100 py-3.5 rounded-full items-center active:bg-slate-200"
              onPress={onBack}
            >
              <Text className="text-slate-700 font-bold font-heading text-sm">ย้อนกลับ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#D32F2F] py-3.5 rounded-full items-center shadow-sm active:opacity-90"
              onPress={onGoToHandover}
            >
              <Text className="text-white font-bold font-heading text-sm">ไปหน้าส่งมอบเครื่อง</Text>
            </TouchableOpacity>
          </View>
        ) : hasExistingPayment ? (
          /* Staff: ลูกค้าส่งข้อมูลแล้ว แต่ยังไม่ได้ verify → แสดงปุ่มยืนยัน/ปฏิเสธ */
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 py-3.5 rounded-full items-center border-2 ${
                isBusy || showRejectInput
                  ? 'border-slate-200 bg-slate-100 opacity-50'
                  : 'border-red-400 bg-white active:bg-red-50'
              }`}
              onPress={onShowRejectInput}
              disabled={isBusy || showRejectInput}
            >
              <View className="flex-row items-center gap-1.5">
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={isBusy || showRejectInput ? '#94a3b8' : '#dc2626'}
                />
                <Text
                  className={`font-bold font-heading text-sm ${
                    isBusy || showRejectInput ? 'text-slate-400' : 'text-red-600'
                  }`}
                >
                  ปฏิเสธ
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3.5 rounded-full items-center shadow-sm ${
                isBusy ? 'bg-emerald-400 opacity-60' : 'bg-emerald-600 active:bg-emerald-700'
              }`}
              onPress={onVerifyPayment}
              disabled={isBusy}
            >
              {verifying ? (
                <View className="flex-row items-center gap-1.5">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white font-bold font-heading text-sm">กำลังยืนยัน...</Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                  <Text className="text-white font-bold font-heading text-sm">ยืนยันการชำระ</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Staff: ลูกค้ายังไม่ได้ส่งข้อมูลผ่านแอป → พนักงานสามารถรับชำระเงินสดหน้าร้านได้ทันที */
          <View className="flex-col gap-2.5">
            <TouchableOpacity
              className={`w-full py-3.5 rounded-full items-center shadow-sm ${
                isBusy ? 'bg-emerald-400 opacity-60' : 'bg-emerald-600 active:bg-emerald-700'
              }`}
              onPress={onStaffCashPayment}
              disabled={isBusy}
            >
              {verifying ? (
                <View className="flex-row items-center gap-1.5">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white font-bold font-heading text-sm">กำลังบันทึก...</Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="cash-outline" size={18} color="#ffffff" />
                  <Text className="text-white font-bold font-heading text-sm">
                    รับชำระเงินสดหน้าร้าน (Cash)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="w-full bg-slate-100 py-3 rounded-full items-center active:bg-slate-200"
              onPress={onBack}
            >
              <Text className="text-slate-700 font-bold font-heading text-sm">ย้อนกลับ</Text>
            </TouchableOpacity>
          </View>
        )
      ) : hasAlreadySubmitted ? (
        <TouchableOpacity
          className="w-full bg-slate-800 py-4 rounded-full items-center shadow-sm active:opacity-90 flex-row justify-center gap-2"
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
          <Text className="text-white font-bold font-heading text-base">
            กลับสู่หน้ารายละเอียดงานซ่อม
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className={`w-full py-4 rounded-full items-center shadow-sm ${
            isBusy ? 'bg-red-400 opacity-60' : 'bg-[#D32F2F] active:opacity-90'
          }`}
          onPress={onSubmitPayment}
          disabled={isBusy}
        >
          {submitting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-bold font-heading text-base">กำลังบันทึก...</Text>
            </View>
          ) : (
            <Text className="text-white font-bold font-heading text-base">ยืนยันการชำระเงิน</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
