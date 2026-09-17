// 1. React & React Native
import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

interface CustomerActionButtonsProps {
  status: string;
  statusId?: number;
  onApprove: () => void;
  onCancel: () => void;
  onRequestModification: (remark: string) => Promise<void>;
  onPayment?: () => void;
  isProcessing?: boolean;
}

export default function CustomerActionButtons({
  status,
  statusId,
  onApprove,
  onCancel,
  onRequestModification,
  onPayment,
  isProcessing = false
}: CustomerActionButtonsProps) {
  const [showModal, setShowModal] = useState(false);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitModification = async () => {
    if (!remark.trim()) return;
    setSubmitting(true);
    try {
      await onRequestModification(remark.trim());
      setShowModal(false);
      setRemark('');
    } finally {
      setSubmitting(false);
    }
  };

  const isWaitingApproval = status === 'รออนุมัติ' || status === 'รอการอนุมัติ' || statusId === 4;

  return (
    <View className="my-4">
      {isWaitingApproval && (
        <View className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <Text className="text-base font-bold text-slate-800 mb-4 font-heading">ใบเสนอราคา — รอการอนุมัติ</Text>
          
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center py-3 rounded-full bg-green-600"
              onPress={onApprove}
              disabled={isProcessing}
            >
              <Text className="text-white text-sm font-bold font-heading">อนุมัติการซ่อม</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center py-3 rounded-full bg-red-600"
              onPress={onCancel}
              disabled={isProcessing}
            >
              <Text className="text-white text-sm font-bold font-heading">ยกเลิกซ่อม</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            className="w-full flex-row items-center justify-center py-3 rounded-full bg-amber-500 mt-1"
            onPress={() => setShowModal(true)}
            disabled={isProcessing}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text className="text-white text-sm font-bold font-heading">ขอเพิ่มบริการ / แก้ไขใบเสนอราคา</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'รอชำระ' && onPayment && (
        <TouchableOpacity 
          className="bg-sky-600 rounded-full p-4 flex-row items-center justify-center"
          onPress={onPayment} 
          disabled={isProcessing}
        >
          <Ionicons name="card-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text className="text-white text-base font-bold font-heading">ดำเนินการชำระเงิน</Text>
        </TouchableOpacity>
      )}

      {/* Modification Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/60 justify-center items-center p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <Text className="text-lg font-bold text-slate-800 mb-2 font-heading">ขอแก้ไข/เพิ่มบริการ</Text>
            <Text className="text-sm text-slate-500 mb-4 leading-5 font-body">
              ระบุรายละเอียดที่ต้องการให้ช่างปรับปรุงในใบเสนอราคา เช่น ต้องการให้ลงโปรแกรมเพิ่มเติม
            </Text>
            
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl h-28 p-4 text-sm text-slate-800 mb-4 font-body"
              placeholder="พิมพ์รายละเอียดที่นี่..."
              placeholderTextColor="#94a3b8"
              value={remark}
              onChangeText={setRemark}
              multiline
              textAlignVertical="top"
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-slate-100 items-center"
                onPress={() => { setShowModal(false); setRemark(''); }}
                disabled={submitting}
              >
                <Text className="text-slate-500 font-bold font-heading">ปิด</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl items-center ${!remark.trim() ? 'bg-amber-300' : 'bg-amber-500'}`}
                onPress={handleSubmitModification}
                disabled={submitting || !remark.trim()}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white font-bold font-heading">ส่งคำขอ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


