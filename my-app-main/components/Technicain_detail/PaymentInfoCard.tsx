// 1. React & React Native
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface PaymentInfoCardProps {
  paymentMethodId?: number | null;
  paymentMethodName?: string | null;
  paymentDate?: string | null; // วันที่ชำระ (วันที่พนักงานยืนยันการชำระ)
  statusId?: number | null;
  statusName?: string | null;
  slipImage?: string | null;
  slipFilename?: string | null;
  totalAmount?: number;
}

export default function PaymentInfoCard({
  paymentMethodId,
  paymentMethodName,
  paymentDate,
  statusId,
  statusName,
  slipImage,
  slipFilename,
  totalAmount,
}: PaymentInfoCardProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr || dateStr === 'undefined' || dateStr === 'null' || dateStr === '-') return 'ยังไม่ได้ระบุ';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  const isTransfer = paymentMethodId === 2 || Boolean(slipImage);
  const isCash = paymentMethodId === 1;

  // สถานะการชำระ (จ่ายรึยัง?)
  // ถ้าสถานะเป็นเสร็จสิ้น (8) หรือมี payment_date ถือว่าจ่ายแล้ว
  // ถ้าสถานะเป็นรอชำระ (7) ถือว่ารอชำระ
  const isPaid = statusId === 8 || statusName === 'เสร็จสิ้น' || (statusId === 7 && Boolean(paymentDate));
  const isPending = statusId === 7 || statusName === 'รอชำระ';

  return (
    <View className="mb-4">
      {/* Header Section Label */}
      <View className="flex-row items-center mb-2 ml-1">
        <View className="w-1 h-4 bg-[#D32F2F] mr-2 rounded-sm" />
        <Text className="text-sm font-bold text-[#D32F2F]">ข้อมูลการชำระเงิน (PAYMENT)</Text>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/5 elevation-2">
        {/* 1. สถานะการชำระเงิน (จ่ายรึยัง?) */}
        <View className="flex-row justify-between items-center py-2">
          <Text className="text-sm text-[#888888] flex-[1.2]">สถานะการชำระเงิน</Text>
          <View className="flex-[2] items-end">
            {isPaid ? (
              <View className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text className="text-xs font-bold text-emerald-700">ชำระเงินเรียบร้อยแล้ว</Text>
              </View>
            ) : isPending ? (
              <View className="flex-row items-center bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Ionicons name="time-outline" size={14} color="#d97706" style={{ marginRight: 4 }} />
                <Text className="text-xs font-bold text-amber-700">รอชำระเงิน</Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                <Ionicons name="hourglass-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                <Text className="text-xs font-bold text-slate-600">ยังไม่ถึงขั้นตอนชำระเงิน</Text>
              </View>
            )}
          </View>
        </View>

        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />

        {/* 2. ช่องทางชำระเงิน (จ่ายทางไหน?) */}
        <View className="flex-row justify-between items-center py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">ช่องทางชำระเงิน</Text>
          <View className="flex-[2] items-end">
            {isTransfer ? (
              <View className="flex-row items-center bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <Ionicons name="card-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                <Text className="text-xs font-bold text-blue-700">โอนเงินผ่านธนาคาร</Text>
              </View>
            ) : isCash ? (
              <View className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Ionicons name="cash-outline" size={14} color="#059669" style={{ marginRight: 4 }} />
                <Text className="text-xs font-bold text-emerald-700">ชำระหน้าร้าน (เงินสด/สแกน)</Text>
              </View>
            ) : (
              <Text className="text-sm text-slate-400 font-body">ยังไม่ได้ระบุช่องทาง</Text>
            )}
          </View>
        </View>

        {/* วันที่ชำระ (วันที่พนักงานยืนยันการชำระ) */}
        {paymentDate ? (
          <>
            <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
            <View className="flex-row justify-between items-center py-2.5">
              <Text className="text-sm text-[#888888] flex-[1.2]">วันที่ชำระ</Text>
              <View className="flex-row items-center flex-[2] justify-end">
                <Ionicons name="calendar-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                <Text className="text-sm font-bold text-slate-800 font-body">
                  {formatDate(paymentDate)}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {/* 4. ยอดชำระทั้งหมด */}
        {totalAmount !== undefined && totalAmount > 0 ? (
          <>
            <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
            <View className="flex-row justify-between items-center py-2.5">
              <Text className="text-sm text-[#888888] flex-[1.2]">ยอดชำระทั้งหมด</Text>
              <Text className="text-sm font-bold text-[#D32F2F] font-heading flex-[2] text-right">
                {totalAmount.toLocaleString()} บาท
              </Text>
            </View>
          </>
        ) : null}

        {/* 5. สลิปการโอนเงิน (ถ้าเลือกโอนเงิน) */}
        {isTransfer && (
          <View className="mt-3 pt-2 border-t border-slate-100">
            <Text className="text-xs text-slate-500 font-body mb-2">หลักฐานการโอนเงิน (สลิป):</Text>
            {slipImage ? (
              <View className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 items-center">
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.85}
                  className="w-full items-center"
                >
                  <Image
                    source={{ uri: slipImage }}
                    style={{ width: '100%', height: 200, borderRadius: 8 }}
                    contentFit="contain"
                  />
                  <View className="flex-row items-center mt-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                    <Ionicons name="expand-outline" size={13} color="#475569" style={{ marginRight: 4 }} />
                    <Text className="text-[11px] text-slate-600 font-bold">กดเพื่อดูรูปภาพสลิปขนาดเต็ม</Text>
                  </View>
                </TouchableOpacity>
                {slipFilename && (
                  <Text className="text-[11px] text-slate-400 font-body mt-1.5" numberOfLines={1}>
                    ไฟล์: {slipFilename}
                  </Text>
                )}
              </View>
            ) : (
              <View className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex-row items-center">
                <Ionicons name="alert-circle-outline" size={16} color="#d97706" style={{ marginRight: 6 }} />
                <Text className="text-xs text-amber-700 font-body">ลูกค้าเลือกโอนเงิน แต่ยังไม่ได้แนบสลิป</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Modal ดูรูปภาพสลิปขนาดเต็ม */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <TouchableOpacity
            className="absolute top-10 right-5 z-10 p-2 bg-white/20 rounded-full"
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          {slipImage && (
            <Image
              source={{ uri: slipImage }}
              style={{ width: '90%', height: '75%' }}
              contentFit="contain"
            />
          )}
          {slipFilename && (
            <Text className="text-white text-xs font-body mt-3 text-center">
              {slipFilename}
            </Text>
          )}
        </View>
      </Modal>
    </View>
  );
}
