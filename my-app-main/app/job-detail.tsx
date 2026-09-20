// 1. React & React Native
import { useState, useCallback } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API helpers
import { updateQuotationStatus, updateRepairStatus, getRepair } from '@/lib/api';

// 4. Components & Theme
import CustomerProgressBar from '@/components/Customer/CustomerProgressBar';
import CustomerQuotationCard from '@/components/Customer/CustomerQuotationCard';
import PickupCalendarCard from '@/components/Shared_Repairs/PickupCalendarCard';
import CustomAlert from '@/components/ui/CustomAlert';
import SuccessToast from '@/components/ui/SuccessToast';
import { Colors } from '@/constants/theme';
import { getStatusOnTintColor } from '@/components/Shared_Repairs/statusConfig';

interface QuotationItem {
  name?: string;
  item_name?: string;
  description?: string;
  price?: number;
  unit_price?: number;
  quantity?: number;
  amount?: number;
}

interface RepairJob {
  id: string;
  job_number: string;
  device_type: string;
  brand: string;
  model: string;
  symptoms: string;
  actual_symptom?: string;
  total_amount: number;
  status: string;
  status_id: number;
  items: QuotationItem[];
  quotation_id: number | null;
  total_repair_price: number;
  total_cancel_price: number;
  quotation_status_id: number;
  customer_remark?: string | null;
  created_at: string;
  appointment_date?: string | null;
  payment_method_id?: number | null;
  payment_method_name?: string | null;
  slip_image?: string | null;
  payment_date?: string | null;
}

interface ToastState {
  visible: boolean;
  message: string;
  subtitle?: string;
  type: 'success' | 'info';
  icon?: keyof typeof Ionicons.glyphMap;
}

function getDeviceIcon(deviceType?: string): keyof typeof Ionicons.glyphMap {
  const type = (deviceType || '').toLowerCase();

  if (type.includes('printer') || type.includes('พิมพ์')) return 'print-outline';
  if (type.includes('desktop') || type.includes('pc') || type.includes('คอม')) return 'desktop-outline';
  if (type.includes('phone') || type.includes('มือถือ') || type.includes('โทรศัพท์')) return 'phone-portrait-outline';
  if (type.includes('tablet') || type.includes('แท็บเล็ต')) return 'tablet-portrait-outline';
  return 'laptop-outline';
}

export default function JobDetailScreen() {
  const router = useRouter();
  const { id, jobId } = useLocalSearchParams<{ id?: string, jobId?: string }>();
  // Use id or jobId depending on how it was passed
  const targetId = id || jobId;
  
  const [job, setJob] = useState<RepairJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const fetchJob = useCallback(async (isSilent = false) => {
    if (!targetId) return;
    try {
      if (!isSilent) setLoading(true);
      const res = await getRepair(targetId as string);
      if (res.success && res.data) {
        const data = res.data;
        const q = data.quotation;
        const repPrice = Number(q?.total_repair_price) || (Number(data.total_amount) > 0 ? Number(data.total_amount) : 0);
        const canPrice = Number(q?.total_cancel_price) || 300;

        setJob({
          id: String(data.job_id || targetId),
          job_number: `REP-${String(data.job_id || targetId).padStart(6, '0')}`,
          device_type: data.device_type || '-',
          brand: data.brand || '-',
          model: data.model || '-',
          symptoms: data.symptoms || data.symptom_details || data.symptom || '-',
          actual_symptom: data.actual_symptom || '',
          total_amount: Number(data.total_amount) || 0,
          status: data.status_name || (data.status_id === 8 ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'),
          status_id: data.status_id || 1,
          items: q?.items || [],
          quotation_id: data.quotation_id || (q ? q.quotation_id : null),
          total_repair_price: repPrice,
          total_cancel_price: canPrice,
          quotation_status_id: q?.quote_status_id || 1,
          customer_remark: q?.customer_remark || data.customer_remark || null,
          created_at: data.created_at || new Date().toISOString(),
          appointment_date: data.appointment_date || null,
          payment_method_id: data.payment_method_id || null,
          payment_method_name: data.payment_method_name || null,
          slip_image: data.slip_image || null,
          payment_date: data.payment_date || null,
        });
      } else {
        setJob(null);
      }
    } catch (err: any) {
      console.error('JobDetail fetch error:', err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [targetId]);

  useFocusEffect(
    useCallback(() => {
      if (targetId) {
        fetchJob();
        const interval = setInterval(() => {
          fetchJob(true);
        }, 5000);
        return () => clearInterval(interval);
      }
    }, [fetchJob, targetId])
  );

  const showToast = (title: string, message: string) => {
    const isSuccess = title === 'สำเร็จ';
    setToast({
      visible: true,
      message: title,
      subtitle: message,
      type: isSuccess ? 'success' : 'info',
      icon: isSuccess ? 'checkmark-circle' : 'alert-circle',
    });
  };

  const hideToast = useCallback(() => {
    setToast((current) => ({ ...current, visible: false }));
  }, []);

  const confirmApprove = async () => {
    if (actionLoading || !job?.quotation_id) return;
    setShowApproveConfirm(false);
    setActionLoading(true);
    try {
      const numericJobId = parseInt(job.id, 10);
      const res = await updateQuotationStatus(job.quotation_id as number, { quote_status_id: 2 });
      if (!res.success) throw new Error(res.message);

      if (!isNaN(numericJobId)) {
        await updateRepairStatus(numericJobId, { status_id: 5 });
      }

      setJob((prev) => (prev ? { ...prev, status_id: 5, status: 'อนุมัติแล้ว/รอซ่อม', quotation_status_id: 2 } : null));
      showToast('สำเร็จ', 'อนุมัติการซ่อมเรียบร้อยแล้ว');
      fetchJob(true);
    } catch (err: any) {
      showToast('ข้อผิดพลาด', err.message || 'ไม่สามารถอนุมัติได้');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = () => {
    if (actionLoading || !job?.quotation_id) return;
    setShowApproveConfirm(true);
  };

  const confirmCancel = async () => {
    if (actionLoading || !job?.quotation_id) return;
    setShowCancelConfirm(false);
    setActionLoading(true);
    try {
      const numericJobId = parseInt(job.id, 10);
      const res = await updateQuotationStatus(job.quotation_id as number, { quote_status_id: 3 });
      if (!res.success) throw new Error(res.message);

      if (!isNaN(numericJobId)) {
        await updateRepairStatus(numericJobId, { status_id: 9 });
      }

      setJob((prev) => (prev ? { ...prev, status_id: 9, status: 'ยกเลิกซ่อม', quotation_status_id: 3 } : null));
      showToast('สำเร็จ', 'ยกเลิกการซ่อมเรียบร้อยแล้ว (มีค่าบริการตรวจเช็คสภาพเครื่อง 300 บาท)');
      fetchJob(true);
    } catch (err: any) {
      showToast('ข้อผิดพลาด', err.message || 'ไม่สามารถยกเลิกได้');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    if (actionLoading || !job?.quotation_id) return;
    setShowCancelConfirm(true);
  };

  const handleRequestModification = async (remark: string) => {
    if (actionLoading || !job?.quotation_id) return;
    setActionLoading(true);
    try {
      // API call to update status to 5 (request modify) with remark
      const res = await updateQuotationStatus(job.quotation_id as number, { quote_status_id: 5, customer_remark: remark });
      if (res.success) {
        showToast('สำเร็จ', 'ส่งคำขอแก้ไขไปยังช่างเรียบร้อยแล้ว');
        setJob((prev) => (prev ? { ...prev, customer_remark: remark, quotation_status_id: 5, status_id: 3, status: 'ดำเนินการเสนอราคา' } : null));
        fetchJob(true);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      showToast('ข้อผิดพลาด', err.message || 'ไม่สามารถส่งคำขอได้');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar style="light" backgroundColor="#DC2626" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#DC2626" />
          <Text className="mt-4 text-slate-500 font-body">กำลังโหลดข้อมูล...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar style="light" backgroundColor="#DC2626" />
        <View className="flex-1 justify-center items-center">
          <Ionicons name="alert-circle-outline" size={60} color="#cbd5e1" />
          <Text className="text-slate-500 font-body mt-4 mb-4">ไม่พบข้อมูลงานซ่อม</Text>
          <TouchableOpacity className="px-6 py-2 border border-red-600 rounded-full" onPress={() => router.back()}>
            <Text className="text-red-600 font-bold font-heading">กลับ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isWaitingRepair = job.status_id === 5 || job.status === 'อนุมัติแล้ว/รอซ่อม';
  const isRepairing = job.status_id === 6 || job.status === 'กำลังซ่อม';
  const isReadyForPayment = job.status_id === 7 || job.status === 'รอชำระ';
  const isCompleted = job.status_id === 8 || job.status === 'เสร็จสิ้น';
  const isCancelled = job.status_id === 9 || job.status === 'ยกเลิกซ่อม' || job.status === 'ยกเลิก';

  const formatPickupDate = (dateStr?: string | null) => {
    if (!dateStr || dateStr === 'undefined' || dateStr === 'null') return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const total = isCancelled
    ? (job.total_cancel_price || 300)
    : (job.total_repair_price || job.total_amount || job.items.reduce((sum, item) => sum + Number(item.price || item.unit_price || 0), 0));

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="light" backgroundColor="#DC2626" />
      
      {/* Header */}
      <View className="bg-[#DC2626] pt-4 pb-6 px-4 flex-row items-center relative z-10">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View>
          <Text className="text-white text-lg font-bold font-heading">รายละเอียดการซ่อม</Text>
          <Text className="font-body text-xs text-red-200">{job.job_number}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 relative z-0" contentContainerClassName="p-4 pb-10">
        
        {/* Device Info Header Card */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100 flex-row">
          <View className="w-14 h-14 bg-sky-50 rounded-2xl mr-4 items-center justify-center border border-sky-100">
            <Ionicons name={getDeviceIcon(job.device_type)} size={28} color="#0284C7" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-800 font-heading">{job.brand} {job.model}</Text>
            <Text className="text-xs text-slate-500 font-body mt-0.5">อาการที่แจ้ง: {job.symptoms}</Text>
            {job.actual_symptom ? (
              <Text className="text-xs font-bold text-red-600 mb-2 font-body mt-0.5">อาการจริง: {job.actual_symptom}</Text>
            ) : (
              <View className="mb-2" />
            )}
            
            <View className="flex-row items-center justify-between">
              <View
                className="px-2.5 py-1 rounded-full flex-row items-center border"
                style={{
                  backgroundColor: `${(Colors.status as any)[`status${job.status_id}`] || '#DC2626'}18`,
                  borderColor: `${(Colors.status as any)[`status${job.status_id}`] || '#DC2626'}35`,
                }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full mr-1.5"
                  style={{ backgroundColor: (Colors.status as any)[`status${job.status_id}`] || '#DC2626' }}
                />
                <Text
                  className="text-[11px] font-bold font-heading"
                  style={{ color: getStatusOnTintColor(job.status_id) }}
                >
                  {job.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Timeline */}
        <CustomerProgressBar status={job.status} statusId={job.status_id} isCancelled={isCancelled} />

        {/* Status Alert Banners */}
        {isWaitingRepair && (
          <View className="bg-emerald-50 rounded-2xl p-4 mb-4 flex-row items-center border border-emerald-200">
            <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 border border-emerald-500">
              <Ionicons name="checkmark" size={18} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-emerald-900 font-bold font-heading text-sm">อนุมัติการซ่อมเรียบร้อยแล้ว</Text>
              <Text className="text-emerald-700 text-xs font-body mt-0.5">
                ยอดรวม {total.toLocaleString()} บาท — ช่างกำลังจัดเตรียมอะไหล่และคิวการซ่อม
                {job.appointment_date ? ` (กำหนดรับเครื่อง: ${formatPickupDate(job.appointment_date)})` : ''}
              </Text>
            </View>
          </View>
        )}

        {isRepairing && (
          <View className="bg-sky-50 rounded-2xl p-4 mb-4 flex-row items-center border border-sky-200">
            <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 border border-sky-500">
              <Ionicons name="hammer" size={18} color="#0284c7" />
            </View>
            <View className="flex-1">
              <Text className="text-sky-900 font-bold font-heading text-sm">ช่างกำลังดำเนินการซ่อมเครื่อง</Text>
              <Text className="text-sky-700 text-xs font-body mt-0.5">
                กำลังลงมือซ่อมและทดสอบระบบตามรายการที่อนุมัติ เมื่อเสร็จแล้วจะส่งต่อรอชำระทันที
                {job.appointment_date ? ` (กำหนดรับเครื่อง: ${formatPickupDate(job.appointment_date)})` : ''}
              </Text>
            </View>
          </View>
        )}

        {isReadyForPayment && (
          <View className="bg-green-100 rounded-2xl p-4 mb-4 flex-row items-center border border-green-200">
            <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 border border-green-500">
              <Ionicons name="checkmark-done" size={18} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-green-900 font-bold font-heading text-sm">ซ่อมแซมเสร็จสิ้นแล้ว (รอชำระ)</Text>
              <Text className="text-green-700 text-xs font-body mt-0.5">
                ยอดรวม {total.toLocaleString()} บาท
                {job.appointment_date ? ` — สามารถมารับเครื่องได้ในวันที่ ${formatPickupDate(job.appointment_date)}` : ''}
              </Text>
            </View>
          </View>
        )}

        {isCancelled && (
          <View className="bg-red-50 rounded-2xl p-4 mb-4 flex-row items-center border border-red-200">
            <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 border border-red-500">
              <Ionicons name="close" size={18} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-red-900 font-bold font-heading text-sm">ยกเลิกซ่อมเรียบร้อย</Text>
              <Text className="text-red-700 text-xs font-body mt-0.5">
                ยอดรวม {total.toLocaleString()} บาท (ค่าตรวจเช็ค)
                {job.appointment_date ? ` — สามารถมารับเครื่องได้ในวันที่ ${formatPickupDate(job.appointment_date)}` : ''}
              </Text>
            </View>
          </View>
        )}

        {isCompleted && (
          <View className="bg-slate-100 rounded-2xl p-4 mb-4 flex-row items-center border border-slate-200">
            <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 border border-slate-400">
              <Ionicons name="checkmark-circle" size={18} color="#475569" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-800 font-bold font-heading text-sm">ส่งมอบเครื่องเสร็จสิ้นแล้ว</Text>
              <Text className="text-slate-600 text-xs font-body mt-0.5">รับเครื่องและชำระเงินเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ</Text>
            </View>
          </View>
        )}

        {/* ปฏิทินกำหนดวันรับเครื่องให้ลูกค้าดู */}
        {job.appointment_date ? (
          <PickupCalendarCard defaultExpanded={false} />
        ) : (isWaitingRepair || isReadyForPayment || isCancelled) ? (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 shadow-sm flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3 border border-amber-100">
              <Ionicons name="calendar-outline" size={20} color="#d97706" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-500 font-body">กำหนดวันรับเครื่อง</Text>
              <Text className="text-sm font-bold text-slate-800 font-heading">
                อยู่ระหว่างประเมินกำหนดวันรับเครื่อง
              </Text>
            </View>
          </View>
        ) : null}

        {/* Quotation Card (Dual Option: อนุมัติการซ่อม & ยกเลิกซ่อม) */}
        {(job.quotation_id || job.status_id === 3 || job.status_id === 4 || job.status.includes('เสนอราคา') || isWaitingRepair || isReadyForPayment || isCancelled) && (
          <CustomerQuotationCard 
            items={job.items}
            actualSymptom={job.actual_symptom}
            status={job.status}
            statusId={job.status_id}
            quotationId={job.quotation_id}
            quoteStatusId={job.quotation_status_id}
            customerRemark={job.customer_remark}
            totalRepairPrice={job.total_repair_price}
            totalCancelPrice={job.total_cancel_price}
            onApprove={handleApprove}
            onCancel={handleCancel}
            onRequestModification={handleRequestModification}
            isProcessing={actionLoading}
          />
        )}

        {/* Action Button / Confirmation Card: Only shown in 'รอชำระ' (ซ่อมเสร็จ) or 'ยกเลิกซ่อม' */}
        {(isReadyForPayment || isCancelled) && !isCompleted && (
          <View className="mt-4 gap-3">
            {(job.payment_method_id || job.slip_image) ? (
              <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#059669" style={{ marginRight: 6 }} />
                    <Text className="text-emerald-900 font-bold font-heading text-sm">
                      แจ้งข้อมูลการชำระเงินเรียบร้อยแล้ว
                    </Text>
                  </View>
                  <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full flex-row items-center">
                    <Ionicons name="lock-closed" size={11} color="#065f46" style={{ marginRight: 3 }} />
                    <Text className="text-[11px] font-bold text-emerald-800">
                      {job.payment_method_id === 2 ? 'โอนเงินแล้ว' : 'ชำระหน้าร้าน'}
                    </Text>
                  </View>
                </View>
                <Text className="text-emerald-700 text-xs font-body mb-3">
                  ระบบได้บันทึกข้อมูลการชำระเงินแล้ว ข้อมูลถูกล็อกและไม่สามารถแก้ไขได้ กรุณาติดต่อรับเครื่องในวันนัดหมาย
                </Text>
                <TouchableOpacity
                  className="w-full bg-white border border-emerald-300 py-2.5 rounded-xl items-center justify-center flex-row gap-2 active:bg-emerald-50"
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/verify-payment', params: { jobId: job.id, amount: total } })}
                >
                  <Ionicons name="eye-outline" size={16} color="#059669" />
                  <Text className="text-emerald-800 font-bold font-heading text-xs">
                    ดูรายละเอียดหลักฐานการชำระเงิน
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                className="w-full bg-[#DC2626] h-[52px] rounded-xl items-center justify-center shadow-md shadow-red-700/20 flex-row gap-2 active:opacity-90"
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/verify-payment', params: { jobId: job.id, amount: total } })}
              >
                <Ionicons name="card-outline" size={20} color="#ffffff" />
                <Text className="text-white font-bold font-heading text-base">
                  ชำระเงิน / แจ้งชำระเงิน ({total.toLocaleString()} บาท)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Button: เสร็จสิ้น (ดูใบเสร็จ) */}
        {isCompleted && (
          <TouchableOpacity 
            className="w-full bg-slate-800 py-3.5 rounded-2xl items-center justify-center shadow-md mt-4 flex-row gap-2 active:opacity-90"
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/receipt', params: { jobId: job.id } })}
          >
            <Ionicons name="receipt-outline" size={20} color="#ffffff" />
            <Text className="text-white font-bold font-heading text-base">ดูใบเสร็จรับเงิน</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      <SuccessToast
        visible={toast.visible}
        message={toast.message}
        subtitle={toast.subtitle}
        type={toast.type}
        icon={toast.icon}
        duration={2800}
        onHide={hideToast}
      />

      <CustomAlert
        visible={showApproveConfirm}
        title="ยืนยันอนุมัติการซ่อม"
        message={`ยอดรวมค่าซ่อม ${total.toLocaleString()} บาท\n\nคุณต้องการอนุมัติการซ่อมใช่หรือไม่?`}
        confirmText="ยืนยันอนุมัติ"
        cancelText="ยกเลิก"
        type="success"
        onConfirm={confirmApprove}
        onCancel={() => setShowApproveConfirm(false)}
      />

      <CustomAlert
        visible={showCancelConfirm}
        title="ยืนยันยกเลิกการซ่อม"
        message={'หากยกเลิก จะมีค่าบริการตรวจเช็คสภาพเครื่อง 300 บาท\n\nคุณต้องการยกเลิกใช่หรือไม่?'}
        confirmText="ใช่, ยกเลิกซ่อม"
        cancelText="ไม่ยกเลิก"
        type="danger"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </SafeAreaView>
  );
}
