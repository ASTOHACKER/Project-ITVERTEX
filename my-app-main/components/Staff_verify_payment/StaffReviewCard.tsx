import React from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StaffReviewCardProps {
  paymentVerified: boolean;
  existingPaymentMethodId: number | null;
  existingSlipUrl: string | null;
  existingSlipFilename: string | null;
  onOpenSlipModal: () => void;
  showRejectInput: boolean;
  rejectInputText: string;
  onRejectInputChange: (text: string) => void;
  onCancelReject: () => void;
  onConfirmReject: () => void;
  isBusy: boolean;
  rejecting: boolean;
}

export default function StaffReviewCard({
  paymentVerified,
  existingPaymentMethodId,
  existingSlipUrl,
  existingSlipFilename,
  onOpenSlipModal,
  showRejectInput,
  rejectInputText,
  onRejectInputChange,
  onCancelReject,
  onConfirmReject,
  isBusy,
  rejecting,
}: StaffReviewCardProps) {
  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-slate-800 font-heading">
          ข้อมูลการชำระเงินที่ลูกค้าเลือก
        </Text>
        {paymentVerified && (
          <View className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 4 }} />
            <Text className="text-[11px] font-bold text-emerald-700">ยืนยันแล้ว</Text>
          </View>
        )}
      </View>

      {existingPaymentMethodId === 2 || existingSlipUrl ? (
        <View>
          <View className="flex-row items-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 mb-4">
            <Ionicons name="card-outline" size={20} color="#2563eb" style={{ marginRight: 8 }} />
            <View>
              <Text className="text-blue-900 font-bold text-sm font-heading">
                โอนเงินผ่านบัญชีธนาคาร (พร้อมเพย์)
              </Text>
              <Text className="text-blue-700 text-xs font-body">
                ลูกค้าส่งหลักฐานสลิปการโอนเงินเข้าระบบแล้ว
              </Text>
            </View>
          </View>

          <Text className="text-slate-700 font-bold text-xs font-heading mb-2">
            หลักฐานสลิปการโอนเงิน:
          </Text>
          {existingSlipUrl ? (
            <View className="bg-slate-50 p-3 rounded-2xl border border-slate-200 items-center">
              <TouchableOpacity
                onPress={onOpenSlipModal}
                activeOpacity={0.85}
                className="w-full items-center"
              >
                <Image
                  source={{ uri: existingSlipUrl }}
                  style={{ width: '100%', height: 260, borderRadius: 12 }}
                  resizeMode="contain"
                />
                <View className="flex-row items-center mt-2.5 px-3.5 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                  <Ionicons name="expand-outline" size={14} color="#475569" style={{ marginRight: 6 }} />
                  <Text className="text-xs text-slate-700 font-bold">กดเพื่อดูรูปภาพสลิปขนาดเต็ม</Text>
                </View>
              </TouchableOpacity>
              {existingSlipFilename && (
                <Text className="text-[11px] text-slate-400 font-body mt-2 text-center" numberOfLines={1}>
                  ชื่อไฟล์: {existingSlipFilename}
                </Text>
              )}
            </View>
          ) : (
            <View className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex-row items-center">
              <Ionicons name="alert-circle-outline" size={20} color="#d97706" style={{ marginRight: 8 }} />
              <Text className="text-xs text-amber-800 font-body flex-1">
                ลูกค้าเลือกโอนเงิน แต่ยังไม่มีการอัปโหลดไฟล์สลิปเข้าระบบ
              </Text>
            </View>
          )}
        </View>
      ) : existingPaymentMethodId === 1 ? (
        <View className="flex-row items-center bg-emerald-50 px-3 py-3 rounded-xl border border-emerald-200">
          <Ionicons name="cash-outline" size={24} color="#059669" style={{ marginRight: 10 }} />
          <View className="flex-1">
            <Text className="text-emerald-900 font-bold text-sm font-heading">
              ชำระหน้าร้าน (เงินสดหรือบัตรเครดิต)
            </Text>
            <Text className="text-emerald-700 text-xs font-body mt-0.5">
              ลูกค้าจะทำการชำระเงินที่เคาน์เตอร์บริการในวันมารับเครื่อง
            </Text>
          </View>
        </View>
      ) : (
        <View className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-row items-center">
          <Ionicons name="help-circle-outline" size={22} color="#64748b" style={{ marginRight: 8 }} />
          <Text className="text-xs text-slate-600 font-body flex-1">
            รอลูกค้าเลือกช่องทางชำระเงินและแนบสลิป
          </Text>
        </View>
      )}

      {/* Reject Input Area (ช่องกรอกเหตุผลปฏิเสธ - Mobile Compatible) */}
      {showRejectInput && !paymentVerified && (
        <View className="mt-4 bg-red-50 p-4 rounded-xl border border-red-200">
          <Text className="text-red-800 font-bold text-xs font-heading mb-2">
            ระบุเหตุผลที่ปฏิเสธ (ไม่บังคับ):
          </Text>
          <View className="bg-white rounded-lg border border-red-200 px-3 py-1.5">
            <TextInput
              value={rejectInputText}
              onChangeText={onRejectInputChange}
              placeholder="เช่น สลิปไม่ชัด, ยอดไม่ตรง..."
              placeholderTextColor="#94a3b8"
              editable={!isBusy}
              className="w-full text-sm text-slate-800 py-1 font-body"
            />
          </View>
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              className="flex-1 bg-slate-200 py-2.5 rounded-lg items-center active:bg-slate-300"
              onPress={onCancelReject}
              disabled={isBusy}
            >
              <Text className="text-slate-700 font-bold text-xs">ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2.5 rounded-lg items-center ${isBusy ? 'bg-red-400 opacity-60' : 'bg-red-600 active:bg-red-700'}`}
              onPress={onConfirmReject}
              disabled={isBusy}
            >
              {rejecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-xs">ยืนยันปฏิเสธ</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
