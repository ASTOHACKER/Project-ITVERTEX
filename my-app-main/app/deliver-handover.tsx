// 1. React & React Native
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API helpers
import { getRepair, updateRepairSignature, updateRepairStatus, logRepairJobDetail } from '@/lib/api';

// 4. Components
import PageHeader from '@/components/ui/PageHeader';
import RepairSummaryCard from '@/components/Staff_handover/RepairSummaryCard';
import CustomAlert from '@/components/ui/CustomAlert';
import SignaturePad from '@/components/ui/SignaturePad';

export default function DeliverHandoverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const jobNo = (params.job_no as string) || 'REP-260527-007';
  const jobIdParam = (params.job_id as string) || '';
  const initialDeviceModel = (params.device as string) || 'อุปกรณ์ซ่อม';
  const initialCustomerName = (params.customer_name as string) || 'ไม่ระบุชื่อ';
  const initialTotalPrice = Number(params.price) || 0;

  const [deviceModel, setDeviceModel] = useState<string>(initialDeviceModel);
  const [customerName, setCustomerName] = useState<string>(initialCustomerName);
  const [totalPrice, setTotalPrice] = useState<number>(initialTotalPrice);

  // Fetch real job data if jobNo present
  useEffect(() => {
    fetchJobDetails();
  }, [jobNo, jobIdParam]);

  const fetchJobDetails = async () => {
    try {
      const targetIdStr = jobIdParam || jobNo.replace(/[^0-9]/g, '');
      const numericId = parseInt(targetIdStr, 10);
      if (isNaN(numericId)) return;

      const res = await getRepair(numericId);
      if (res.success && res.data) {
        const jobData = res.data;
        if (jobData.total_amount) setTotalPrice(Number(jobData.total_amount));
        const fullDev = [jobData.brand, jobData.model].filter(Boolean).join(' ') || jobData.device_type;
        if (fullDev) setDeviceModel(fullDev);

        const name = `${jobData.first_name || ''} ${jobData.last_name || ''}`.trim();
        if (name) setCustomerName(name);
      }
    } catch (err) {
      console.error('Fetch job details for handover error:', err);
    }
  };

  // Signature state
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // ── Signature handlers ──

  const handleSignature = (signature: string) => {
    setSignatureImage(signature);
    setIsSigning(false);
    setSignatureError(null);
    if (isModalOpen) {
      setIsModalOpen(false);
    }
  };

  const handleEmpty = () => {
    setIsSigning(false);
    Alert.alert('ยังไม่มีลายเซ็น', 'กรุณาเซ็นในกรอบก่อนกดบันทึก');
  };

  const handleSignatureError = (error: Error) => {
    setIsSigning(false);
    setSignatureError(error.message || 'ไม่สามารถเปิดพื้นที่สำหรับเซ็นได้');
  };



  // ── Complete Handover Flow ──

  const handleCompleteHandover = async () => {
    if (uploading) return;
    if (!signatureImage) {
      setAlertConfig({
        visible: true,
        title: 'ยังไม่มีลายเซ็น',
        message: 'กรุณาให้ลูกค้าเซ็นชื่อในกรอบและกดยืนยันก่อนทำรายการส่งมอบ',
        type: 'warning',
      });
      return;
    }

    try {
      setUploading(true);

      const targetIdStr = jobIdParam || jobNo.replace(/[^0-9]/g, '');
      const numericId = parseInt(targetIdStr, 10);

      if (!isNaN(numericId)) {
        const sigRes = await updateRepairSignature(numericId, {
          customer_receive_signature: signatureImage,
        });
        if (sigRes?.filename) {
          setUploadedUrl(sigRes.filename);
        }

        // Action 7 = ส่งมอบเครื่องให้ลูกค้า
        await logRepairJobDetail(numericId, 7);

        await updateRepairStatus(numericId, {
          status_id: 8, // เสร็จสิ้น
        });
      }

      setAlertConfig({
        visible: true,
        title: 'ส่งมอบเครื่องสำเร็จ',
        message: `บันทึกลายเซ็นและส่งมอบงาน ${jobNo} เรียบร้อยแล้ว`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Handover completion error:', err);
      setAlertConfig({
        visible: true,
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'ไม่สามารถส่งมอบเครื่องได้ กรุณาลองใหม่อีกครั้ง',
        type: 'danger',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAlertConfirm = () => {
    const isSuccess = alertConfig.type === 'success';
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    if (isSuccess) {
      const targetIdStr = jobIdParam || jobNo.replace(/[^0-9]/g, '');
      router.replace({
        pathname: '/receipt' as any,
        params: {
          jobId: targetIdStr,
          job_id: targetIdStr,
          job_no: jobNo,
        },
      });
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Navigation Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="arrow-back" size={20} color="#334155" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-base font-bold text-slate-800">ส่งมอบเครื่องซ่อม</Text>
          <Text className="text-xs font-medium text-red-600">ลายเซ็นอิเล็กทรอนิกส์</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsModalOpen(true)}
          className={`w-10 h-10 items-center justify-center rounded-full bg-red-50 ${!signatureImage ? 'opacity-30' : ''}`}
          disabled={!signatureImage}
        >
          <Ionicons name="expand-outline" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 30 }}
        scrollEnabled={!isSigning}
      >
        {/* Repair Summary Card */}
        <RepairSummaryCard
          deviceModel={deviceModel}
          jobNo={jobNo}
          customerName={customerName}
          totalPrice={totalPrice}
        />

        {/* Signature Section */}
        <View className="bg-white rounded-2xl p-5 mt-4 border border-slate-200 shadow-sm shadow-black/5 elevation-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-base font-bold text-slate-800">
              ลายเซ็นลูกค้ารับเครื่อง
            </Text>
            <TouchableOpacity
              onPress={() => setIsModalOpen(true)}
              className="flex-row items-center bg-red-50 px-2.5 py-1 rounded-lg border border-red-200"
            >
              <Ionicons name="expand-outline" size={14} color="#D32F2F" style={{ marginRight: 4 }} />
              <Text className="text-xs font-bold text-[#D32F2F]">เต็มจอ</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-slate-500 mb-3">
            ให้ลูกค้าเซ็นชื่อเพื่อยืนยันการรับเครื่องคืน
          </Text>

          <SignaturePad
            height={220}
            placeholder="ให้ลูกค้าเซ็นชื่อในกรอบนี้"
            onChange={(sig) => {
              setSignatureImage(sig);
              setSignatureError(null);
            }}
            onClear={() => setSignatureImage(null)}
          />

          {signatureError && (
            <Text className="text-xs font-semibold text-red-600 mt-2">{signatureError}</Text>
          )}
        </View>

        {/* Signature Preview */}
        {signatureImage && (
          <View className="bg-white rounded-2xl p-5 mt-4 border border-emerald-200 shadow-sm shadow-black/5 elevation-2">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text className="text-base font-bold text-emerald-800">ลายเซ็นเรียบร้อย</Text>
            </View>

            <View className="border border-slate-200 rounded-xl p-3 bg-slate-50 items-center justify-center mb-3">
              <Image
                source={{ uri: signatureImage }}
                className="w-full h-[120px]"
                contentFit="contain"
              />
            </View>

            {uploadedUrl && (
              <View className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <Text className="text-xs font-bold text-emerald-800 mb-1">บันทึกในระบบแล้ว</Text>
                <Text className="text-xs text-emerald-700 font-mono" numberOfLines={1}>
                  {uploadedUrl}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="p-4 bg-white border-t border-slate-200">
        <TouchableOpacity
          className={`h-12 rounded-full flex-row items-center justify-center gap-2 shadow-lg shadow-green-600/25 elevation-3 ${
            uploading ? 'bg-green-500 opacity-60' : 'bg-green-600 active:opacity-90'
          }`}
          activeOpacity={0.85}
          onPress={handleCompleteHandover}
          disabled={uploading}
        >
          {uploading ? (
            <Text className="text-white font-bold text-sm">กำลังบันทึกลายเซ็นและอัปเดตระบบ...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              <Text className="text-white font-bold text-sm">เสร็จสิ้นการส่งมอบ</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Full-Screen Modal Signature */}
      <Modal visible={isModalOpen} animationType="slide" transparent={false}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
            <Text className="text-base font-bold text-slate-800">เซ็นชื่อเต็มหน้าจอ</Text>
            <TouchableOpacity
              onPress={() => setIsModalOpen(false)}
              className="p-1.5 rounded-full bg-slate-200"
            >
              <Ionicons name="close" size={22} color="#334155" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 p-3">
            <SignaturePad
              height={450}
              placeholder="ให้ลูกค้าเซ็นชื่อเต็มหน้าจอที่นี่"
              onChange={(sig) => {
                setSignatureImage(sig);
                setSignatureError(null);
              }}
              onClear={() => setSignatureImage(null)}
            />
            <View className="mt-4">
              <TouchableOpacity
                className="bg-[#D32F2F] py-3.5 rounded-xl items-center justify-center shadow-md"
                onPress={() => setIsModalOpen(false)}
              >
                <Text className="text-white font-bold text-base">ยืนยันลายเซ็น</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Success Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText="ตกลง"
        onConfirm={handleAlertConfirm}
      />
    </SafeAreaView>
  );
}
