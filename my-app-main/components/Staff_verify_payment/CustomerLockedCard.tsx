import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomerLockedCardProps {
  paymentVerified: boolean;
  existingPaymentMethodId: number | null;
  existingSlipUrl: string | null;
  existingSlipFilename: string | null;
  onOpenSlipModal: () => void;
}

export default function CustomerLockedCard({
  paymentVerified,
  existingPaymentMethodId,
  existingSlipUrl,
  existingSlipFilename,
  onOpenSlipModal,
}: CustomerLockedCardProps) {
  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-slate-800 font-heading">
          ข้อมูลการชำระเงินที่คุณแจ้งไว้
        </Text>
        <View className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <Ionicons name="lock-closed" size={12} color="#059669" style={{ marginRight: 4 }} />
          <Text className="text-[11px] font-bold text-emerald-700">
            {paymentVerified ? 'ยืนยันแล้ว' : 'รอตรวจสอบ'}
          </Text>
        </View>
      </View>

      <View className="h-px bg-slate-100 mb-4" />

      {existingPaymentMethodId === 2 || existingSlipUrl ? (
        <View>
          <View className="flex-row items-center bg-blue-50 px-3.5 py-3 rounded-xl border border-blue-200 mb-4">
            <Ionicons name="card-outline" size={22} color="#2563eb" style={{ marginRight: 10 }} />
            <View className="flex-1">
              <Text className="text-blue-900 font-bold text-sm font-heading">
                โอนเงินผ่านบัญชีธนาคาร (พร้อมเพย์)
              </Text>
              <Text className="text-blue-700 text-xs font-body mt-0.5">
                คุณได้แนบหลักฐานสลิปการโอนเงินเข้าระบบเรียบร้อยแล้ว
              </Text>
            </View>
          </View>

          <Text className="text-slate-700 font-bold text-xs font-heading mb-2">
            หลักฐานสลิปการโอนเงินที่ส่ง:
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
          ) : null}

          <View className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex-row items-start">
            <Ionicons
              name={paymentVerified ? 'checkmark-circle' : 'time-outline'}
              size={18}
              color={paymentVerified ? '#059669' : '#f59e0b'}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text className="text-xs text-slate-600 font-body flex-1 leading-5">
              {paymentVerified
                ? 'เจ้าหน้าที่ตรวจสอบและยืนยันการชำระเงินเรียบร้อยแล้ว กำลังจัดเตรียมอุปกรณ์เพื่อส่งมอบ'
                : 'เจ้าหน้าที่ได้รับหลักฐานการโอนเงินแล้ว กำลังดำเนินการตรวจสอบยอดเงิน'}
            </Text>
          </View>
        </View>
      ) : (
        <View>
          <View className="flex-row items-center bg-emerald-50 px-3.5 py-3.5 rounded-xl border border-emerald-200 mb-4">
            <Ionicons name="cash-outline" size={26} color="#059669" style={{ marginRight: 10 }} />
            <View className="flex-1">
              <Text className="text-emerald-900 font-bold text-sm font-heading">
                ชำระหน้าร้าน (เงินสดหรือบัตรเครดิต)
              </Text>
              <Text className="text-emerald-700 text-xs font-body mt-0.5">
                คุณได้เลือกชำระเงินที่เคาน์เตอร์บริการในวันมารับเครื่อง
              </Text>
            </View>
          </View>

          <View className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex-row items-start">
            <Ionicons name="information-circle" size={18} color="#0284c7" style={{ marginRight: 8, marginTop: 1 }} />
            <Text className="text-xs text-slate-600 font-body flex-1 leading-5">
              บันทึกความประสงค์เรียบร้อยแล้ว กรุณาติดต่อชำระเงินและรับเครื่องคืนที่เคาน์เตอร์ IT Vertex Service ในวันนัดหมาย
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
