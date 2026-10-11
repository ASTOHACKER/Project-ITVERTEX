import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomerPaymentFormProps {
  rejectReason: string | null;
  paymentMethod: 'cash' | 'transfer';
  setPaymentMethod: (method: 'cash' | 'transfer') => void;
  formattedAmount: string;
  handlePickImage: () => void;
  slipImage: string | null;
  displayJobNo: string;
}

export default function CustomerPaymentForm({
  rejectReason,
  paymentMethod,
  setPaymentMethod,
  formattedAmount,
  handlePickImage,
  slipImage,
  displayJobNo,
}: CustomerPaymentFormProps) {
  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      {/* Banner แจ้งเตือนเมื่อถูกปฏิเสธ */}
      {rejectReason && (
        <View className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 mb-4 flex-row items-start">
          <Ionicons name="warning-outline" size={20} color="#d97706" style={{ marginRight: 8, marginTop: 1 }} />
          <View className="flex-1">
            <Text className="text-amber-900 font-bold text-xs font-heading mb-0.5">
              ข้อมูลการชำระเงินถูกปฏิเสธ
            </Text>
            <Text className="text-amber-800 text-xs font-body leading-5">
              เหตุผล: {rejectReason}
            </Text>
            <Text className="text-amber-700 text-[11px] font-body mt-1">
              กรุณาเลือกช่องทางและแนบหลักฐานใหม่อีกครั้ง
            </Text>
          </View>
        </View>
      )}

      <Text className="text-base font-bold text-slate-800 font-heading mb-4">
        เลือกช่องทางชำระเงิน
      </Text>

      {/* Cash Option */}
      <TouchableOpacity
        className={`flex-row items-center p-3.5 rounded-xl mb-3 border ${
          paymentMethod === 'cash'
            ? 'border-red-500 bg-red-50/30'
            : 'border-slate-200 bg-white'
        }`}
        onPress={() => setPaymentMethod('cash')}
        activeOpacity={0.8}
      >
        <View className="w-5 h-5 rounded-full border border-slate-300 items-center justify-center mr-3">
          {paymentMethod === 'cash' && <View className="w-3 h-3 rounded-full bg-red-600" />}
        </View>
        <View className="flex-1">
          <Text className="text-slate-800 font-bold font-heading">ชำระหน้าร้าน</Text>
          <Text className="text-slate-400 text-xs font-body">
            ชำระด้วยเงินสดหรือบัตรเครดิตที่หน้าร้าน
          </Text>
        </View>
      </TouchableOpacity>

      {/* Transfer Option */}
      <TouchableOpacity
        className={`flex-row items-center p-3.5 rounded-xl border ${
          paymentMethod === 'transfer'
            ? 'border-red-500 bg-red-50/30'
            : 'border-slate-200 bg-white'
        }`}
        onPress={() => setPaymentMethod('transfer')}
        activeOpacity={0.8}
      >
        <View className="w-5 h-5 rounded-full border border-slate-300 items-center justify-center mr-3">
          {paymentMethod === 'transfer' && <View className="w-3 h-3 rounded-full bg-red-600" />}
        </View>
        <View className="flex-1">
          <Text className="text-slate-800 font-bold font-heading">โอนเงิน</Text>
          <Text className="text-slate-400 text-xs font-body">
            โอนผ่านบัญชีธนาคารพร้อมเพย์ (แนบสลิป)
          </Text>
        </View>
      </TouchableOpacity>

      {/* Transfer Upload Details */}
      {paymentMethod === 'transfer' && (
        <View className="bg-slate-50 rounded-xl p-4 mt-3 border border-slate-200 items-center">
          <View className="bg-white p-3 rounded-xl border border-slate-200 mb-2">
            <Ionicons name="qr-code-outline" size={100} color="#1e293b" />
          </View>
          <Text className="text-slate-600 text-xs font-body">พร้อมเพย์: 081-XXX-XXXX (IT Vertex)</Text>
          <Text className="text-red-600 font-bold font-heading mb-4 text-base">฿ {formattedAmount}</Text>

          <TouchableOpacity
            className="flex-row items-center bg-white border border-slate-300 rounded-full px-5 py-2.5 shadow-sm active:bg-slate-100"
            onPress={handlePickImage}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#D32F2F" style={{ marginRight: 6 }} />
            <Text className="text-[#D32F2F] text-xs font-bold font-heading">
              {slipImage ? 'เปลี่ยนรูปสลิปการโอน' : 'อัปโหลดสลิปการโอนเงิน'}
            </Text>
          </TouchableOpacity>

          {slipImage && (
            <View className="w-full mt-3 items-center">
              <Image
                source={{ uri: slipImage }}
                className="w-full h-48 rounded-xl"
                resizeMode="contain"
              />
              <Text className="text-[11px] text-slate-400 font-body mt-1">
                สลิปจะถูกบันทึกด้วยรหัส {displayJobNo}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
