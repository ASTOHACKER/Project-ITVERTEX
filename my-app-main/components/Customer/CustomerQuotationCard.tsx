// 1. React & React Native
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

export interface QuotationItem {
  name?: string;
  item_name?: string;
  item_type_id?: number;
  description?: string;
  price?: number;
  unit_price?: number;
  quantity?: number;
  amount?: number;
}

interface CustomerQuotationCardProps {
  items?: QuotationItem[];
  parts?: QuotationItem[];
  services?: QuotationItem[];
  totalParts?: number;
  totalServices?: number;
  actualSymptom?: string;
  status: string;
  statusId?: number;
  quotationId?: number | null;
  quoteStatusId?: number;
  customerRemark?: string | null;
  totalRepairPrice?: number;
  totalCancelPrice?: number;
  onApprove: () => void;
  onCancel: () => void;
  onRequestModification?: (remark: string) => Promise<void>;
  isProcessing?: boolean;
}

export default function CustomerQuotationCard({
  items = [],
  parts: propParts,
  services: propServices,
  totalParts: propTotalParts,
  totalServices: propTotalServices,
  actualSymptom,
  status,
  statusId,
  quotationId,
  quoteStatusId,
  customerRemark,
  totalRepairPrice,
  totalCancelPrice = 300,
  onApprove,
  onCancel,
  onRequestModification,
  isProcessing = false,
}: CustomerQuotationCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [remark, setRemark] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);

  // Status flags
  const isApproved =
    status === 'อนุมัติแล้ว/รอซ่อม' ||
    status === 'รอชำระ' ||
    status === 'เสร็จสิ้น' ||
    statusId === 5 ||
    statusId === 6 ||
    quoteStatusId === 2;

  const isCancelled =
    status === 'ยกเลิกซ่อม' ||
    status === 'ยกเลิก' ||
    statusId === 9 ||
    quoteStatusId === 3;

  const isModificationRequested =
    Boolean(customerRemark) &&
    (quoteStatusId === 5 || quoteStatusId === 4 || statusId === 3 || status?.includes('เสนอราคา'));

  const isPending = !isApproved && !isCancelled;

  // Separate parts (item_type_id = 1) and services (item_type_id = 2)
  const isPartItem = (i: QuotationItem) => {
    if (i.item_type_id === 1) return true;
    if (i.item_type_id === 2) return false;
    const name = (i.name || i.item_name || i.description || '').toLowerCase();
    return (
      name.includes('อะไหล่') ||
      name.includes('พัดลม') ||
      name.includes('จอ') ||
      name.includes('ram') ||
      name.includes('ssd') ||
      name.includes('แบตเตอรี่') ||
      name.includes('คีย์บอร์ด') ||
      name.includes('การ์ด') ||
      name.includes('พาวเวอร์') ||
      name.includes('บอร์ด')
    );
  };

  const isLaborItem = (i: QuotationItem) => {
    if (i.item_type_id === 2) return true;
    if (i.item_type_id === 1) return false;
    const name = (i.name || i.item_name || i.description || '').toLowerCase();
    return (
      name.includes('ค่าบริการ') ||
      name.includes('ค่าแรง') ||
      name.includes('ตรวจเช็ค') ||
      name.includes('ติดตั้ง') ||
      name.includes('ล้าง') ||
      name.includes('เซ็ตอัพ')
    );
  };

  const partsList = propParts && propParts.length > 0 ? propParts : items.filter(isPartItem);
  const laborsList = propServices && propServices.length > 0 ? propServices : items.filter(isLaborItem);

  const partsSum = propTotalParts !== undefined
    ? propTotalParts
    : partsList.reduce(
        (sum, item) => sum + Number(item.price || item.unit_price || 0) * Number(item.quantity || 1),
        0
      );

  const laborsSum = propTotalServices !== undefined
    ? propTotalServices
    : laborsList.reduce(
        (sum, item) => sum + Number(item.price || item.unit_price || 0) * Number(item.quantity || 1),
        0
      );

  const calculatedItemsTotal = items.reduce(
    (sum, item) => sum + Number(item.price || item.unit_price || 0) * Number(item.quantity || 1),
    0
  );

  const repairTotal =
    (totalRepairPrice !== undefined && totalRepairPrice > 0)
      ? totalRepairPrice
      : ((partsSum + laborsSum) > 0 ? (partsSum + laborsSum) : calculatedItemsTotal);

  const handleSendModification = async () => {
    if (!remark.trim() || !onRequestModification) return;
    setSubmittingRemark(true);
    try {
      await onRequestModification(remark.trim());
      setShowModal(false);
      setRemark('');
    } finally {
      setSubmittingRemark(false);
    }
  };

  return (
    <View className="mb-4">
      <View className="bg-white rounded-2xl border border-red-500 overflow-hidden shadow-sm">
        {/* Header Bar */}
        <View className="bg-[#D32F2F] px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full bg-white mr-2" />
            <Text className="text-white font-bold text-sm font-heading">
              ใบเสนอราคา — {isApproved ? 'อนุมัติแล้ว' : isCancelled ? 'ยกเลิกแล้ว' : isModificationRequested ? 'อยู่ระหว่างปรับปรุงตามคำขอ' : 'รอการอนุมัติ'}
            </Text>
          </View>
        </View>

        {/* Card Content */}
        <View className="p-4">
          {/* ── BANNER แจ้งเตือนเมื่อลูกค้าส่งคำขอแก้ไข/ตีกลับใบเสนอราคา (เหมือนตีกลับสลิป) ── */}
          {isModificationRequested && (
            <View className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 mb-3.5 shadow-xs">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="alert-circle" size={18} color="#d97706" />
                <Text className="text-amber-900 font-bold text-xs font-heading">
                  คุณได้ส่งคำขอแก้ไข / ปรับปรุงใบเสนอราคาถึงช่างแล้ว:
                </Text>
              </View>
              <Text className="text-amber-950 text-sm font-body pl-6 font-medium leading-5">
                &ldquo;{customerRemark}&rdquo;
              </Text>
              <Text className="text-amber-700 text-[11px] font-body pl-6 mt-1.5">
                สถานะ: ช่างกำลังดำเนินการปรับปรุงรายการและราคาตามคำขอของคุณ กรุณารอช่างส่งใบเสนอราคาฉบับแก้ไข
              </Text>
            </View>
          )}

          {/* อาการเครื่องหลังตรวจเช็ค */}
          <View className="bg-red-50/70 rounded-xl p-3 mb-3 border border-red-100">
            <Text className="text-red-700 text-xs font-bold font-heading mb-1">
              อาการเครื่อง (ผลตรวจเช็คของช่าง)
            </Text>
            <Text className="text-slate-800 text-sm font-body">
              {actualSymptom || 'ตรวจเช็คตามอาการที่ลูกค้าแจ้ง'}
            </Text>
          </View>

          {/* ค่าอะไหล่ (Parts) */}
          <View className="bg-blue-50/60 rounded-xl p-3 mb-3 border border-blue-100">
            <Text className="text-blue-600 text-xs font-bold font-heading mb-2">
              ค่าอะไหล่ (Parts)
            </Text>
            {partsList.length > 0 ? (
              <>
                {partsList.map((item, idx) => (
                  <View key={idx} className="flex-row justify-between mb-1">
                    <Text className="text-slate-700 text-sm font-body flex-1 mr-2">
                      {item.name || item.item_name || item.description || `อะไหล่ ${idx + 1}`}
                      {Number(item.quantity || 1) > 1 ? ` x${item.quantity}` : ''}
                    </Text>
                    <Text className="text-blue-600 text-sm font-bold">
                      {(Number(item.price || item.unit_price || 0) * Number(item.quantity || 1)).toLocaleString()} บ.
                    </Text>
                  </View>
                ))}
                <View className="flex-row justify-between mt-2 pt-2 border-t border-blue-200">
                  <Text className="text-blue-700 text-sm font-bold font-heading">
                    รวมค่าอะไหล่
                  </Text>
                  <Text className="text-blue-700 text-sm font-bold">
                    {partsSum.toLocaleString()} บ.
                  </Text>
                </View>
              </>
            ) : (
              <View className="flex-row justify-between py-1">
                <Text className="text-slate-500 text-sm font-body">
                  ไม่มีการเปลี่ยนอะไหล่ (ซ่อมบำรุง/แก้ไขระบบ)
                </Text>
                <Text className="text-blue-600 text-sm font-bold">0 บ.</Text>
              </View>
            )}
          </View>

          {/* ค่าบริการ / ค่าแรง */}
          <View className="bg-orange-50/60 rounded-xl p-3 mb-3 border border-orange-100">
            <Text className="text-orange-600 text-xs font-bold font-heading mb-2">
              ค่าบริการ / ค่าแรง
            </Text>
            {laborsList.length > 0 ? (
              <>
                {laborsList.map((item, idx) => (
                  <View key={idx} className="flex-row justify-between mb-1">
                    <Text className="text-slate-700 text-sm font-body flex-1 mr-2">
                      {item.name || item.item_name || item.description || `ค่าบริการ ${idx + 1}`}
                    </Text>
                    <Text className="text-orange-600 text-sm font-bold">
                      {(Number(item.price || item.unit_price || 0) * Number(item.quantity || 1)).toLocaleString()} บ.
                    </Text>
                  </View>
                ))}
                <View className="flex-row justify-between mt-2 pt-2 border-t border-orange-200">
                  <Text className="text-orange-700 text-sm font-bold font-heading">
                    รวมค่าบริการ
                  </Text>
                  <Text className="text-orange-700 text-sm font-bold">
                    {laborsSum.toLocaleString()} บ.
                  </Text>
                </View>
              </>
            ) : (
              <View className="flex-row justify-between py-1">
                <Text className="text-slate-500 text-sm font-body">
                  ค่าแรงและบริการตรวจซ่อม
                </Text>
                <Text className="text-orange-600 text-sm font-bold">
                  {(repairTotal > 0 ? repairTotal : 0).toLocaleString()} บ.
                </Text>
              </View>
            )}
          </View>

          {/* รายการเพิ่มเติม (ถ้ามี) */}
          {items.length > 0 && partsList.length === 0 && laborsList.length === 0 && (
            <View className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-200">
              <Text className="text-red-600 text-xs font-bold font-heading mb-2">
                รายการเพิ่มเติม
              </Text>
              {items.map((item, idx) => (
                <View key={idx} className="flex-row justify-between mb-1">
                  <Text className="text-slate-700 text-sm font-body flex-1 mr-2">
                    {item.name || item.item_name || item.description}
                  </Text>
                  <Text className="text-red-600 text-sm font-bold">
                    {(Number(item.price || item.unit_price || 0) * Number(item.quantity || 1)).toLocaleString()} บ.
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ยอดรวมค่าซ่อม */}
          <View className="mt-2 mb-3">
            <Text className="text-slate-400 text-xs font-body mb-1">
              ยอดรวมค่าซ่อม
            </Text>
            <Text className="text-red-600 text-3xl font-extrabold font-heading">
              {repairTotal.toLocaleString()} บาท
            </Text>
          </View>

          {/* หมายเหตุค่าตรวจเช็คกรณียกเลิกซ่อม */}
          {isPending && (
            <View className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200 flex-row items-center">
              <Ionicons name="information-circle-outline" size={18} color="#64748b" style={{ marginRight: 6 }} />
              <Text className="text-slate-500 text-xs font-body flex-1">
                หากยกเลิกการซ่อม จะมีค่าบริการตรวจเช็คสภาพเครื่อง {totalCancelPrice.toLocaleString()} บาท
              </Text>
            </View>
          )}

          {/* ── Action Buttons สำหรับกรณีรอลูกค้าตัดสินใจ (Pending) ── */}
          {isPending && (
            <View className="mt-1 gap-2.5">
              {/* 1. ปุ่มอนุมัติการซ่อม หรือ แจ้งรอช่างปรับปรุง */}
              {isModificationRequested ? (
                <View className="w-full bg-amber-50 border border-amber-300 py-3.5 px-4 rounded-2xl flex-row items-center justify-center gap-2">
                  <Ionicons name="time" size={18} color="#d97706" />
                  <Text className="text-amber-900 font-bold font-heading text-sm">
                    อยู่ระหว่างรอช่างปรับปรุงใบเสนอราคาตามคำขอ
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  className={`w-full h-[52px] px-6 rounded-xl items-center justify-center shadow-md shadow-emerald-700/25 ${
                    isProcessing ? 'bg-emerald-400 opacity-60' : 'bg-emerald-600 active:bg-emerald-700'
                  }`}
                  activeOpacity={0.85}
                  onPress={onApprove}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View className="flex-row items-center justify-center gap-2">
                      <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                      <Text className="text-white text-base font-bold font-heading">
                        อนุมัติการซ่อม ({repairTotal.toLocaleString()} บาท)
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* 2. แถวปุ่มรอง 2 คอลัมน์ (ขอแก้ไข vs ไม่ซ่อม/ขอยกเลิก) */}
              <View className="flex-row gap-2.5">
                {/* ปุ่มขอแก้ไข / เพิ่มเติมรายการ */}
                {onRequestModification && (
                  <TouchableOpacity
                    className={`flex-1 border min-h-[46px] py-2.5 px-3 rounded-xl items-center justify-center flex-row gap-1.5 ${
                      isProcessing ? 'bg-amber-50/50 border-amber-200 opacity-60' : 'bg-amber-50 border-amber-300 active:bg-amber-100'
                    }`}
                    activeOpacity={0.8}
                    onPress={() => setShowModal(true)}
                    disabled={isProcessing}
                  >
                    <Ionicons name="chatbubble-ellipses" size={16} color="#d97706" />
                    <Text className="text-amber-900 text-xs font-bold font-heading" numberOfLines={1}>
                      ขอแก้ไข/เพิ่มบริการ
                    </Text>
                  </TouchableOpacity>
                )}

                {/* ปุ่มไม่ซ่อม / ขอยกเลิก */}
                <TouchableOpacity
                  className={`flex-1 border min-h-[46px] py-2.5 px-3 rounded-xl items-center justify-center flex-row gap-1.5 ${
                    isProcessing ? 'bg-slate-50/50 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-200 active:bg-red-50'
                  }`}
                  activeOpacity={0.8}
                  onPress={onCancel}
                  disabled={isProcessing}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                  <Text className="text-slate-700 text-xs font-bold font-heading" numberOfLines={1}>
                    ไม่ซ่อม / ขอยกเลิก
                  </Text>
                </TouchableOpacity>
              </View>

              {/* หมายเหตุค่าตรวจเช็ค */}
              <Text className="text-[11px] text-slate-400 text-center mt-0.5 font-body">
                * กรณีไม่ซ่อมหรือยกเลิก จะมีค่าบริการตรวจเช็คสภาพเครื่อง {totalCancelPrice.toLocaleString()} บาท
              </Text>
            </View>
          )}

          {/* กรณีอนุมัติเรียบร้อย */}
          {isApproved && (
            <View className="mt-1 bg-emerald-50 border border-emerald-200 py-3 px-4 rounded-xl flex-row items-center justify-center gap-2">
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text className="text-emerald-800 font-bold font-heading text-sm">
                ยืนยันอนุมัติการซ่อมเรียบร้อยแล้ว
              </Text>
            </View>
          )}

          {/* กรณียกเลิกเรียบร้อย */}
          {isCancelled && (
            <View className="mt-1 bg-red-50 border border-red-200 py-3 px-4 rounded-xl flex-row items-center justify-center gap-2">
              <Ionicons name="close-circle" size={18} color="#dc2626" />
              <Text className="text-red-800 font-bold font-heading text-sm">
                ยกเลิกการซ่อมแล้ว (ยอดชำระ {totalCancelPrice.toLocaleString()} บาท)
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Modification Request Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/60 justify-center items-center p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <Text className="text-lg font-bold text-slate-800 mb-1 font-heading">
              ขอแก้ไข / เพิ่มเติมรายการ
            </Text>
            <Text className="text-sm text-slate-500 mb-4 leading-5 font-body">
              ระบุรายการที่ต้องการให้ช่างปรับปรุงในใบเสนอราคา เช่น ต้องการเปลี่ยนเกรดอะไหล่ หรือลงโปรแกรมเพิ่มเติม
            </Text>

            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl h-28 p-4 text-sm text-slate-800 mb-4 font-body"
              placeholder="พิมพ์รายละเอียดที่ต้องการส่งถึงช่างที่นี่..."
              placeholderTextColor="#94a3b8"
              value={remark}
              onChangeText={setRemark}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-slate-100 items-center justify-center"
                onPress={() => {
                  setShowModal(false);
                  setRemark('');
                }}
                disabled={submittingRemark}
              >
                <Text className="text-slate-600 font-bold font-heading">ปิด</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center justify-center ${
                  !remark.trim() ? 'bg-amber-300' : 'bg-amber-500'
                }`}
                onPress={handleSendModification}
                disabled={submittingRemark || !remark.trim()}
              >
                {submittingRemark ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white font-bold font-heading">ส่งคำขอถึงช่าง</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
