// 1. React & React Native
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API helpers
import { createPayment, getRepair, verifyPayment, rejectPayment } from '@/lib/api';

// 4. Components
import CustomAlert from '@/components/ui/CustomAlert';

export default function VerifyPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    jobId?: string;
    job_id?: string;
    job_no?: string;
    customer_name?: string;
    amount?: string;
    pickupDate?: string;
    role?: string;
  }>();

  const isStaff = params.role === 'staff';

  const rawJobId =
    params.jobId ||
    params.job_id ||
    (params.job_no ? String(params.job_no).replace(/[^0-9]/g, '') : '');
  const numericJobId = parseInt(rawJobId, 10);
  const displayJobNo =
    params.job_no ||
    (!isNaN(numericJobId)
      ? `REP-${String(numericJobId).padStart(6, '0')}`
      : 'REP-000000');

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingJob, setLoadingJob] = useState(true);

  const [customerName, setCustomerName] = useState<string>(params.customer_name || '');
  const [totalAmount, setTotalAmount] = useState<number>(Number(params.amount || 0));
  const [appointmentDate, setAppointmentDate] = useState<string | null>(params.pickupDate || null);
  const [existingSlipUrl, setExistingSlipUrl] = useState<string | null>(null);
  const [existingSlipFilename, setExistingSlipFilename] = useState<string | null>(null);
  const [existingPaymentMethodId, setExistingPaymentMethodId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectInputText, setRejectInputText] = useState('');

  // In-app alert modal (ใช้แทน window.alert บนเว็บ — มีปุ่มยืนยัน)
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '', type: 'info' });

  const hideAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  const showAppAlert = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'danger' | 'info' = 'info',
    opts?: { confirmText?: string; cancelText?: string; onConfirm?: () => void }
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      confirmText: opts?.confirmText,
      cancelText: opts?.cancelText,
      onConfirm: opts?.onConfirm,
    });
  };

  // ถามยืนยันก่อนบันทึก (มีปุ่มยืนยัน/ยกเลิก)
  const askConfirmBeforeSave = (
    title: string,
    message: string,
    onConfirmAction: () => void,
    type: 'success' | 'warning' | 'danger' | 'info' = 'warning'
  ) => {
    showAppAlert(title, message, type, {
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onConfirm: onConfirmAction,
    });
  };

  // ลูกค้าถือว่าส่งแล้วเมื่อมี payment_method_id และยังไม่ถูก reject
  const hasAlreadySubmitted = Boolean((existingPaymentMethodId || existingSlipUrl) && !rejectReason);

  // Fetch job details on load
  useEffect(() => {
    async function loadJobInfo() {
      if (!rawJobId && !numericJobId) {
        setLoadingJob(false);
        return;
      }
      try {
        const res = await getRepair(numericJobId || rawJobId);
        if (res.success && res.data) {
          const d = res.data;
          if (d.customer_name) setCustomerName(d.customer_name);
          if (d.total_amount && !params.amount) {
            setTotalAmount(Number(d.total_amount));
          }
          if (d.appointment_date && !params.pickupDate) {
            setAppointmentDate(d.appointment_date);
          }
          if (d.payment_method_id) {
            setExistingPaymentMethodId(d.payment_method_id);
            if (d.payment_method_id === 2) setPaymentMethod('transfer');
            else if (d.payment_method_id === 1) setPaymentMethod('cash');
          }
          if (d.payment_verified) {
            setPaymentVerified(true);
          }
          if (d.payment_reject_reason) {
            setRejectReason(d.payment_reject_reason);
          }
          if (d.slip_image) {
            setExistingSlipFilename(d.slip_image);
            const apiOrigin = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api').replace(/\/api\/?$/, '');
            const cleanPath = d.slip_image.startsWith('/') ? d.slip_image : `/pubilc/${d.slip_image}`;
            const fullUrl = d.slip_image.startsWith('http') ? d.slip_image : `${apiOrigin}${cleanPath}`;
            setExistingSlipUrl(fullUrl);
            setSlipImage(fullUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching repair in verify-payment:', err);
      } finally {
        setLoadingJob(false);
      }
    }
    loadJobInfo();
  }, [numericJobId, rawJobId]);

  const formattedAmount = Number(totalAmount || params.amount || 300).toLocaleString();

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr || dateStr === 'undefined' || dateStr === 'null') return 'ยังไม่ได้ระบุ';
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

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAppAlert('สิทธิ์การเข้าถึง', 'ต้องการสิทธิ์เข้าถึงคลังภาพ', 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSlipImage(result.assets[0].uri);
    }
  };

  const isBusy = verifying || rejecting || submitting;

  const handleSubmit = () => {
    if (isBusy) return;
    if (hasAlreadySubmitted && paymentVerified) {
      showAppAlert('ข้อผิดพลาด', 'ข้อมูลการชำระเงินได้รับการยืนยันแล้ว ไม่สามารถแก้ไขได้', 'danger');
      return;
    }

    if (paymentMethod === 'transfer' && !slipImage) {
      showAppAlert('ข้อผิดพลาด', 'กรุณาอัปโหลดสลิปการโอนเงิน', 'warning');
      return;
    }

    // ถามยืนยันก่อนบันทึกจริง
    const methodLabel = paymentMethod === 'cash' ? 'ชำระหน้าร้าน' : 'โอนเงินพร้อมแนบสลิป';
    askConfirmBeforeSave(
      'ยืนยันการส่งข้อมูล?',
      `ยอดชำระ ${formattedAmount} บาท • วิธี${methodLabel}${appointmentDate ? ` • นัดรับ ${formatDate(appointmentDate)}` : ''} กดยืนยันเพื่อบันทึกข้อมูล`,
      () => doSubmit()
    );
  };

  const doSubmit = async () => {
    if (isBusy) return;
    setSubmitting(true);
    try {
      let body: any;
      let isFormData = false;

      if (paymentMethod === 'transfer') {
        const formData = new FormData();
        formData.append('job_id', String(numericJobId || rawJobId));
        formData.append('job_no', String(displayJobNo));
        formData.append('payment_method', 'transfer');
        if (appointmentDate) {
          formData.append('pickup_date', String(appointmentDate));
        }

        if (slipImage && !slipImage.startsWith('http://') && !slipImage.startsWith('https://')) {
          const filename = `slip_${displayJobNo}.jpg`;
          if (Platform.OS === 'web') {
            if (slipImage.startsWith('blob:') || slipImage.startsWith('data:')) {
              const resBlob = await fetch(slipImage);
              const blob = await resBlob.blob();
              formData.append('slip_image', blob, filename);
            } else {
              formData.append('slip_image', slipImage);
            }
          } else {
            const match = /\.(\w+)$/.exec(slipImage);
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            formData.append('slip_image', { uri: slipImage, name: filename, type } as any);
          }
        } else if (existingSlipFilename) {
          formData.append('slip_image', existingSlipFilename);
        }

        body = formData;
        isFormData = true;
      } else {
        body = {
          job_id: numericJobId || rawJobId,
          job_no: displayJobNo,
          payment_method: 'cash',
          pickup_date: appointmentDate,
        };
      }

      await createPayment(body, isFormData);

      // เคลียร์ reject reason เมื่อส่งสำเร็จ
      setRejectReason(null);

      // แจ้งสำเร็จด้วย modal ปุ่มยืนยัน — กดยืนยันแล้วค่อยกลับหน้ารายละเอียดงาน
      showAppAlert('สำเร็จ', 'บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว', 'success', {
        confirmText: 'ยืนยัน',
        onConfirm: () => {
          router.replace({ pathname: '/job-detail', params: { id: String(numericJobId || rawJobId) } });
        },
      });
    } catch (err: any) {
      showAppAlert('ข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกได้', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Staff: ยืนยันการชำระเงิน ──
  const handleVerifyPayment = () => {
    if (isBusy) return;
    askConfirmBeforeSave(
      'ยืนยันการชำระเงิน?',
      `ยืนยันว่าได้รับยอด ${formattedAmount} บาทครบถ้วนแล้ว กดยืนยันเพื่อบันทึก`,
      () => doVerifyPayment()
    );
  };

  const doVerifyPayment = async () => {
    if (isBusy) return;
    setVerifying(true);
    try {
      const res = await verifyPayment(numericJobId || rawJobId);
      if (res.success) {
        setPaymentVerified(true);
        showAppAlert('สำเร็จ', 'ยืนยันการชำระเงินเรียบร้อยแล้ว', 'success', { confirmText: 'ยืนยัน' });
      }
    } catch (err: any) {
      showAppAlert('ข้อผิดพลาด', err.message || 'ไม่สามารถยืนยันได้', 'danger');
    } finally {
      setVerifying(false);
    }
  };

  // ── Staff: ปฏิเสธการชำระเงิน ──
  const handleRejectPayment = () => {
    if (isBusy) return;
    const reason = rejectInputText.trim() || 'สลิปไม่ชัดเจน / ยอดไม่ตรง';
    askConfirmBeforeSave(
      'ยืนยันปฏิเสธ?',
      `ปฏิเสธการชำระเงินยอด ${formattedAmount} บาท (เหตุผล: ${reason}) ลูกค้าจะได้รับแจ้งให้ส่งข้อมูลใหม่`,
      () => doRejectPayment(reason),
      'danger'
    );
  };

  const doRejectPayment = async (reason: string) => {
    if (isBusy) return;
    setRejecting(true);
    try {
      const res = await rejectPayment(numericJobId || rawJobId, reason);
      if (res.success) {
        setExistingPaymentMethodId(null);
        setExistingSlipUrl(null);
        setExistingSlipFilename(null);
        setSlipImage(null);
        setRejectReason(reason);
        setShowRejectInput(false);
        setRejectInputText('');
        showAppAlert('สำเร็จ', 'ปฏิเสธการชำระเงินเรียบร้อย ลูกค้าจะได้รับแจ้งให้ส่งข้อมูลใหม่', 'success', { confirmText: 'ยืนยัน' });
      }
    } catch (err: any) {
      showAppAlert('ข้อผิดพลาด', err.message || 'ไม่สามารถปฏิเสธได้', 'danger');
    } finally {
      setRejecting(false);
    }
  };

  // ── Staff: รับชำระเงินสดหน้าร้านทันที ──
  const handleStaffCashPayment = () => {
    if (isBusy) return;
    askConfirmBeforeSave(
      'ยืนยันรับเงินสด?',
      `บันทึกรับชำระเงินสดหน้าร้านยอด ${formattedAmount} บาทและยืนยันทันที กดยืนยันเพื่อบันทึก`,
      () => doStaffCashPayment()
    );
  };

  const doStaffCashPayment = async () => {
    if (isBusy) return;
    setVerifying(true);
    try {
      await createPayment({
        job_id: numericJobId || rawJobId,
        job_no: displayJobNo,
        payment_method: 'cash',
        pickup_date: appointmentDate || new Date().toISOString().slice(0, 10),
      });
      const res = await verifyPayment(numericJobId || rawJobId);
      if (res.success) {
        setPaymentVerified(true);
        setExistingPaymentMethodId(1);
        showAppAlert('สำเร็จ', 'บันทึกรับชำระเงินสดหน้าร้านและยืนยันเรียบร้อยแล้ว', 'success', { confirmText: 'ยืนยัน' });
      }
    } catch (err: any) {
      showAppAlert('ข้อผิดพลาด', err.message || 'ไม่สามารถทำรายการได้', 'danger');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="light" backgroundColor="#D32F2F" />

      {/* Header */}
      <View className="bg-[#D32F2F] pt-4 pb-6 px-4 flex-row items-center relative z-10">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View>
          <Text className="text-white text-lg font-bold font-heading">
            {isStaff ? 'ตรวจสอบการชำระเงิน' : 'ชำระเงินและนัดรับเครื่อง'}
          </Text>
          <Text className="text-red-200 text-xs font-body">{displayJobNo}</Text>
        </View>
      </View>

      {loadingJob ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text className="text-slate-500 font-body text-xs mt-3">กำลังโหลดข้อมูล...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 relative z-0" contentContainerClassName="p-4 pb-28">
          {/* Invoice Summary Card */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-800 font-bold font-heading text-base">สรุปใบแจ้งหนี้</Text>
              <View className="px-2.5 py-0.5 bg-red-50 rounded-full border border-red-200">
                <Text className="text-[#D32F2F] font-bold text-xs font-heading">{displayJobNo}</Text>
              </View>
            </View>

            {customerName ? (
              <View className="flex-row justify-between items-center py-2 border-b border-slate-100">
                <Text className="text-slate-500 text-xs font-body">ชื่อลูกค้า</Text>
                <Text className="text-slate-800 font-bold text-xs font-body">{customerName}</Text>
              </View>
            ) : null}

            <View className="py-2 border-b border-slate-100">
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 text-xs font-body">กำหนดวันรับเครื่อง</Text>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                  <Text className="text-slate-800 font-bold text-xs font-body">
                    {formatDate(appointmentDate)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between items-center pt-3">
              <Text className="text-slate-800 font-bold font-heading text-base">ยอดรวมสุทธิ</Text>
              <Text className="text-red-600 font-bold font-heading text-xl">{formattedAmount} บาท</Text>
            </View>
          </View>

          {/* VIEW MODE: When Staff is checking */}
          {isStaff ? (
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
                        onPress={() => setModalVisible(true)}
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
                      onChangeText={setRejectInputText}
                      placeholder="เช่น สลิปไม่ชัด, ยอดไม่ตรง..."
                      placeholderTextColor="#94a3b8"
                      editable={!isBusy}
                      className="w-full text-sm text-slate-800 py-1 font-body"
                    />
                  </View>
                  <View className="flex-row gap-2 mt-3">
                    <TouchableOpacity
                      className="flex-1 bg-slate-200 py-2.5 rounded-lg items-center active:bg-slate-300"
                      onPress={() => { setShowRejectInput(false); setRejectInputText(''); }}
                      disabled={isBusy}
                    >
                      <Text className="text-slate-700 font-bold text-xs">ยกเลิก</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 py-2.5 rounded-lg items-center ${isBusy ? 'bg-red-400 opacity-60' : 'bg-red-600 active:bg-red-700'}`}
                      onPress={handleRejectPayment}
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
          ) : hasAlreadySubmitted ? (
            /* CUSTOMER CONFIRMED / LOCKED VIEW (ส่งข้อมูลแล้ว ไม่สามารถแก้ไขได้) */
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-bold text-slate-800 font-heading">
                  ข้อมูลการชำระเงินที่คุณแจ้งไว้
                </Text>
                <View className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Ionicons name="lock-closed" size={12} color="#059669" style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-bold text-emerald-700">
                    {paymentVerified ? 'ยืนยันแล้ว ✓' : 'รอตรวจสอบ'}
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
                        onPress={() => setModalVisible(true)}
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
                    <Ionicons name={paymentVerified ? 'checkmark-circle' : 'time-outline'} size={18} color={paymentVerified ? '#059669' : '#f59e0b'} style={{ marginRight: 8, marginTop: 1 }} />
                    <Text className="text-xs text-slate-600 font-body flex-1 leading-5">
                      {paymentVerified
                        ? 'เจ้าหน้าที่ตรวจสอบและยืนยันการชำระเงินเรียบร้อยแล้ว กำลังจัดเตรียมอุปกรณ์เพื่อส่งมอบ'
                        : 'เจ้าหน้าที่ได้รับหลักฐานการโอนเงินแล้ว กำลังดำเนินการตรวจสอบยอดเงิน'
                      }
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
          ) : (
            /* CUSTOMER SELECTION MODE (ยังไม่ได้เลือก/ยังไม่ได้ส่ง หรือถูก reject แล้ว) */
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
          )}
        </ScrollView>
      )}

      {/* Fullscreen Slip Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/85 items-center justify-center p-4">
          <TouchableOpacity
            className="absolute top-10 right-5 z-10 p-2.5 bg-white/20 rounded-full"
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          {(existingSlipUrl || slipImage) && (
            <Image
              source={{ uri: existingSlipUrl || slipImage || '' }}
              style={{ width: '90%', height: '75%' }}
              resizeMode="contain"
            />
          )}
          {existingSlipFilename && (
            <Text className="text-white text-xs font-body mt-3 text-center">
              {existingSlipFilename}
            </Text>
          )}
        </View>
      </Modal>

      {/* Footer Buttons */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-8">
        {isStaff ? (
          paymentVerified ? (
            /* Staff: ยืนยันแล้ว → ไปหน้าส่งมอบเครื่อง */
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-slate-100 py-3.5 rounded-full items-center active:bg-slate-200"
                onPress={() => router.back()}
              >
                <Text className="text-slate-700 font-bold font-heading text-sm">ย้อนกลับ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#D32F2F] py-3.5 rounded-full items-center shadow-sm active:opacity-90"
                onPress={() => {
                  router.push({
                    pathname: '/deliver-handover' as any,
                    params: {
                      job_id: String(numericJobId || rawJobId),
                      job_no: displayJobNo,
                      customer_name: customerName,
                      role: 'staff',
                    },
                  });
                }}
              >
                <Text className="text-white font-bold font-heading text-sm">ไปหน้าส่งมอบเครื่อง</Text>
              </TouchableOpacity>
            </View>
          ) : (existingPaymentMethodId || existingSlipUrl) ? (
            /* Staff: ลูกค้าส่งข้อมูลแล้ว แต่ยังไม่ได้ verify → แสดงปุ่มยืนยัน/ปฏิเสธ */
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3.5 rounded-full items-center border-2 ${
                  isBusy || showRejectInput ? 'border-slate-200 bg-slate-100 opacity-50' : 'border-red-400 bg-white active:bg-red-50'
                }`}
                onPress={() => setShowRejectInput(true)}
                disabled={isBusy || showRejectInput}
              >
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="close-circle-outline" size={18} color={isBusy || showRejectInput ? "#94a3b8" : "#dc2626"} />
                  <Text className={`font-bold font-heading text-sm ${isBusy || showRejectInput ? 'text-slate-400' : 'text-red-600'}`}>
                    ปฏิเสธ
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3.5 rounded-full items-center shadow-sm ${
                  isBusy ? 'bg-emerald-400 opacity-60' : 'bg-emerald-600 active:bg-emerald-700'
                }`}
                onPress={handleVerifyPayment}
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
                onPress={handleStaffCashPayment}
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
                    <Text className="text-white font-bold font-heading text-sm">รับชำระเงินสดหน้าร้าน (Cash 💵)</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="w-full bg-slate-100 py-3 rounded-full items-center active:bg-slate-200"
                onPress={() => router.back()}
              >
                <Text className="text-slate-700 font-bold font-heading text-sm">ย้อนกลับ</Text>
              </TouchableOpacity>
            </View>
          )
        ) : hasAlreadySubmitted ? (
          <TouchableOpacity
            className="w-full bg-slate-800 py-4 rounded-full items-center shadow-sm active:opacity-90 flex-row justify-center gap-2"
            onPress={() => router.back()}
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
            onPress={handleSubmit}
            disabled={isBusy}
          >
            {submitting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="#fff" size="small" />
                <Text className="text-white font-bold font-heading text-base">กำลังบันทึก...</Text>
              </View>
            ) : (
              <Text className="text-white font-bold font-heading text-base">
                ยืนยันการชำระเงิน
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* In-app alert modal (แทน web.alert — มีปุ่มยืนยัน/ยกเลิก) */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText || 'ยืนยัน'}
        cancelText={alertConfig.cancelText}
        onConfirm={() => {
          const cb = alertConfig.onConfirm;
          hideAlert();
          cb?.();
        }}
        onCancel={alertConfig.cancelText ? hideAlert : undefined}
      />
    </SafeAreaView>
  );
}
