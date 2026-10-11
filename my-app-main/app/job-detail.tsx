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
import { REPAIR_STATUS, QUOTE_STATUS, CANCEL_INSPECTION_FEE } from '@/constants/status';

// 4. Components & Theme
import CustomerProgressBar from '@/components/Customer/CustomerProgressBar';
import CustomerQuotationCard from '@/components/Customer/CustomerQuotationCard';
import PickupCalendarCard from '@/components/Shared_Repairs/PickupCalendarCard';
import CustomAlert from '@/components/ui/CustomAlert';
import SuccessToast from '@/components/ui/SuccessToast';
import type { RepairJob } from '@/types/repair';

interface ToastState {
  visible: boolean;
  message: string;
  subtitle?: string;
  type: 'success' | 'info';
  icon?: keyof typeof Ionicons.glyphMap;
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
        const canPrice = Number(q?.total_cancel_price) || CANCEL_INSPECTION_FEE;

        const isJobCancelled = Boolean(
          data.is_cancelled ||
          Number(data.status_id) === 9 ||
          Number(q?.quote_status_id) === 3 ||
          Number(data.quote_status_id) === 3 ||
          data.status_name?.includes('ยกเลิก')
        );

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
          is_cancelled: isJobCancelled,
          items: q?.items || [],
          quotation_id: data.quotation_id || (q ? q.quotation_id : null),
          total_repair_price: repPrice,
          total_cancel_price: canPrice,
          quotation_status_id: q?.quote_status_id || data.quote_status_id || (isJobCancelled ? 3 : 1),
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
        }, 10000); // 10 วินาที เพื่อประสิทธิภาพและประหยัดแบตเตอรี่
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
      const numericJobId = parseInt(String(job.id || job.job_id || ''), 10);
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
      const numericJobId = parseInt(String(job.id || job.job_id || ''), 10);
      const res = await updateQuotationStatus(job.quotation_id as number, { quote_status_id: 3 });
      if (!res.success) throw new Error(res.message);

      if (!isNaN(numericJobId)) {
        await updateRepairStatus(numericJobId, { status_id: REPAIR_STATUS.CANCELLED });
      }

      setJob((prev) => (prev ? { ...prev, status_id: REPAIR_STATUS.CANCELLED, status: 'ยกเลิกซ่อม', quotation_status_id: QUOTE_STATUS.CANCELLED } : null));
      showToast('สำเร็จ', `ยกเลิกการซ่อมเรียบร้อยแล้ว (มีค่าบริการตรวจเช็คสภาพเครื่อง ${CANCEL_INSPECTION_FEE} บาท)`);
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

  const isCancelled =
    job.status_id === 9 ||
    job.status === 'ยกเลิกซ่อม' ||
    job.status === 'ยกเลิก' ||
    Boolean(job.status?.includes('ยกเลิก')) ||
    job.quotation_status_id === 3 ||
    Boolean(job.is_cancelled);
  const isCompleted = (job.status_id === 8 || job.status === 'เสร็จสิ้น') && !isCancelled;
  const isReadyForPickup = (job.status_id === 6 || job.status === 'รอลูกค้ามารับเครื่อง') && !isCancelled;
  const isReadyForPayment = (job.status_id === 7 || job.status === 'รอชำระ') && !isCancelled;
  const isWaitingRepair = (job.status_id === 5 || job.status === 'อนุมัติแล้ว/รอซ่อม') && !isCancelled;

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

  const getStatusConfig = (status: string, statusId?: number, isCancelledJob?: boolean) => {
    const s = status || '';
    const id = Number(statusId);

    // ── ตรวจสอบการยกเลิกก่อนเป็นอันดับแรก ──
    if (isCancelledJob || id === 9 || s.includes('ยกเลิก')) {
      return { color: '#DC2626', bg: '#FEE2E2', text: '#B91C1C', icon: 'close-circle' };
    }

    // ── กลุ่มที่ 3: โทนสีเสร็จสิ้น & ปิดงาน ──
    if (id === 8 || s.includes('เสร็จ') || s.includes('ชำระแล้ว')) {
      return { color: '#16A34A', bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle' };
    }

    // ── กลุ่มที่ 2: โทนสีส้ม/อำพัน/เหลือง (ขั้นตอนการรอ & ลูกค้าดำเนินการ) ──
    if (id === 6 || s.includes('มารับเครื่อง') || s.includes('พร้อมรับ')) {
      return { color: '#CA8A04', bg: '#FEF9C3', text: '#854D0E', icon: 'cube' };
    }
    if (id === 7 || s.includes('รอชำระ')) {
      return { color: '#D97706', bg: '#FEF3C7', text: '#B45309', icon: 'cash' };
    }
    if (id === 4 || s.includes('รออนุมัติ') || s.includes('รอการอนุมัติ')) {
      return { color: '#EA580C', bg: '#FFEDD5', text: '#C2410C', icon: 'alert-circle' };
    }

    // ── กลุ่มที่ 1: โทนสีน้ำเงิน/ฟ้า (ขั้นตอนตรวจเช็ค & กำลังซ่อม) ──
    if (id === 5 || s.includes('อนุมัติ') || s.includes('ซ่อม')) {
      return { color: '#1D4ED8', bg: '#EFF6FF', text: '#1E40AF', icon: 'hammer' };
    }
    if (id === 3 || s.includes('เสนอราคา')) {
      return { color: '#4F46E5', bg: '#E0E7FF', text: '#3730A3', icon: 'receipt' };
    }
    if (id === 2 || s.includes('ดำเนินการตรวจเช็ค')) {
      return { color: '#2563EB', bg: '#DBEAFE', text: '#1D4ED8', icon: 'search' };
    }
    return { color: '#0284C7', bg: '#E0F2FE', text: '#0369A1', icon: 'clipboard' };
  };

  const getDeviceIcon = (type?: string, brand?: string) => {
    const t = `${type || ''} ${brand || ''}`.toLowerCase();
    if (t.includes('print') || t.includes('ปริ้น') || t.includes('canon') || t.includes('epson') || t.includes('brother') || t.includes('hp')) {
      return 'print-outline';
    }
    if (t.includes('phone') || t.includes('มือถือ') || t.includes('โทรศัพท์') || t.includes('iphone') || t.includes('samsung') || t.includes('oppo') || t.includes('vivo')) {
      return 'phone-portrait-outline';
    }
    if (t.includes('macbook') || t.includes('laptop') || t.includes('โน้ตบุ๊ก') || t.includes('notebook') || t.includes('asus') || t.includes('acer') || t.includes('tuf') || t.includes('rog') || t.includes('lenovo') || t.includes('dell')) {
      return 'laptop-outline';
    }
    if (t.includes('ipad') || t.includes('แท็บเล็ต') || t.includes('tablet')) {
      return 'tablet-portrait-outline';
    }
    if (t.includes('pc') || t.includes('คอมพิวเตอร์') || t.includes('computer') || t.includes('desktop')) {
      return 'desktop-outline';
    }
    return 'hardware-chip-outline';
  };

  const formatDeviceTitle = (brand?: string, model?: string) => {
    const b = (brand || '').trim();
    const m = (model || '').trim();
    if (!b && !m) return 'อุปกรณ์ไม่ระบุชื่อ';
    if (b.includes('ประกอบเอง') || b.includes('Custom PC')) {
      if (!m || m.includes('สเปกประกอบเอง') || m.includes('ไม่ระบุ')) {
        return 'คอมพิวเตอร์ประกอบเอง (Custom PC)';
      }
      return `ประกอบเอง (Custom PC) ${m}`;
    }
    if (!b) return m;
    if (!m) return b;
    return `${b} ${m}`;
  };

  const statusCfg = getStatusConfig(job.status || '', job.status_id, isCancelled);

  const total = isCancelled
    ? (job.total_cancel_price || CANCEL_INSPECTION_FEE)
    : (job.total_repair_price || job.total_amount || (job.items || []).reduce((sum, item) => sum + Number(item.price || item.unit_price || 0), 0));

  const isIntakeStatus = job.status_id === 1 || job.status === 'รอตรวจเช็ค' || job.status === 'รอตรวจสอบ';
  const canShowDocumentButton = isIntakeStatus || isCompleted;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="light" backgroundColor="#DC2626" />

      {/* Header Bar */}
      <View className="bg-[#DC2626] pt-4 pb-6 px-4 flex-row items-center justify-between relative z-10 shadow-sm">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.8}
            className="w-10 h-10 rounded-full bg-white/15 items-center justify-center border border-white/20 active:bg-white/25"
          >
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-lg font-bold font-heading">รายละเอียดงานซ่อม</Text>
            <Text className="font-body text-xs text-red-100">{job.job_number}</Text>
          </View>
        </View>

        {canShowDocumentButton && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/receipt', params: { jobId: job.id, job_no: job.job_number } })}
            className="bg-white/20 px-2.5 py-1.5 rounded-xl border border-white/30 flex-row items-center active:bg-white/30"
          >
            <Ionicons name="document-text-outline" size={15} color="#ffffff" style={{ marginRight: 4 }} />
            <Text className="text-white text-xs font-bold font-heading">
              {isCompleted ? 'ใบเสร็จ' : 'ใบรับซ่อม'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 relative z-0" contentContainerClassName="p-4 pb-12">

        {/* Device & Status Overview Card */}
        <View className="bg-white rounded-3xl p-4 mb-4 shadow-sm border border-slate-100">
          <View className="flex-row items-start justify-between mb-3.5 gap-2">
            <View className="flex-row items-center gap-3 flex-1 min-w-0">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center border shrink-0"
                style={{
                  backgroundColor: statusCfg.bg,
                  borderColor: `${statusCfg.color}35`,
                }}
              >
                <Ionicons
                  name={getDeviceIcon(job.device_type, job.brand) as any}
                  size={24}
                  color={statusCfg.color}
                />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-base font-bold text-slate-900 font-heading leading-tight" numberOfLines={2}>
                  {formatDeviceTitle(job.brand, job.model)}
                </Text>
                <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                  <Text className="text-xs text-slate-400 font-body">
                    {job.device_type || 'อุปกรณ์ไอที'}
                  </Text>
                  <Text className="text-xs text-slate-300">•</Text>
                  <Text className="text-xs font-bold text-slate-500 font-heading">
                    {job.job_number}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Badge */}
            <View
              className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border shrink-0"
              style={{
                backgroundColor: statusCfg.bg,
                borderColor: `${statusCfg.color}40`,
              }}
            >
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: statusCfg.color }}
              />
              <Text
                className="text-xs font-bold font-heading"
                style={{ color: statusCfg.text }}
              >
                {isCancelled ? 'ยกเลิกซ่อม' : job.status}
              </Text>
            </View>
          </View>

          {/* Symptoms Display */}
          <View className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100/90 gap-2">
            <View className="flex-row items-start gap-2">
              <Ionicons name="chatbox-ellipses-outline" size={15} color="#64748B" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 font-body">อาการที่แจ้งซ่อม:</Text>
                <Text className="text-xs text-slate-600 font-body mt-0.5 leading-4">{job.symptoms || '-'}</Text>
              </View>
            </View>

            {job.actual_symptom ? (
              <View className="flex-row items-start gap-2 pt-2 border-t border-slate-200/60">
                <Ionicons name="search-outline" size={15} color="#0284C7" style={{ marginTop: 2 }} />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-sky-800 font-body">ผลการตรวจเช็คจริงโดยช่าง:</Text>
                  <Text className="text-xs text-slate-700 font-body mt-0.5 leading-4">{job.actual_symptom}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Progress Timeline */}
        <CustomerProgressBar status={job.status || 'รอตรวจเช็ค'} statusId={job.status_id || 1} isCancelled={isCancelled} />

        {/* Status Alert Banners */}
        {isWaitingRepair && (
          <View className="bg-emerald-50 rounded-2xl p-4 mb-4 flex-row items-center border border-emerald-200">
            <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 border border-emerald-500">
              <Ionicons name="hammer" size={18} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-emerald-900 font-bold font-heading text-sm">อนุมัติแล้ว / กำลังดำเนินการซ่อม</Text>
              <Text className="text-emerald-700 text-xs font-body mt-0.5">
                ยอดรวม {total.toLocaleString()} บาท — ช่างกำลังดำเนินการซ่อมและทดสอบระบบตามรายการที่อนุมัติ
                {job.appointment_date ? ` (กำหนดรับเครื่อง: ${formatPickupDate(job.appointment_date)})` : ''}
              </Text>
            </View>
          </View>
        )}

        {isReadyForPayment && (
          <View className="bg-amber-50 rounded-2xl p-4 mb-4 flex-row items-center border border-amber-200">
            <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 border border-amber-500">
              <Ionicons name="card-outline" size={18} color="#d97706" />
            </View>
            <View className="flex-1">
              <Text className="text-amber-900 font-bold font-heading text-sm">รอชำระเงินค่าซ่อม</Text>
              <Text className="text-amber-700 text-xs font-body mt-0.5">
                ยอดรวม {total.toLocaleString()} บาท — ช่างซ่อมเสร็จสิ้นแล้ว กรุณาชำระเงินเพื่อเตรียมรับเครื่อง
              </Text>
            </View>
          </View>
        )}

        {isReadyForPickup && (
          <View className="bg-sky-50 rounded-2xl p-4 mb-4 flex-row items-center border border-sky-200">
            <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 border border-sky-500">
              <Ionicons name="cube" size={18} color="#0284C7" />
            </View>
            <View className="flex-1">
              <Text className="text-sky-900 font-bold font-heading text-sm">ชำระเงินเรียบร้อยแล้ว (รอมารับเครื่อง)</Text>
              <Text className="text-sky-700 text-xs font-body mt-0.5">
                ยอดรวม {total.toLocaleString()} บาท — สามารถติดต่อรับเครื่องที่ร้านและเซ็นรับเครื่องกับเจ้าหน้าที่ได้เลย
                {job.appointment_date ? ` (นัดรับ: ${formatPickupDate(job.appointment_date)})` : ''}
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

        {/* ปฏิทินกำหนดวันรับเครื่องให้ลูกค้าดู (แสดงเฉพาะเมื่อพร้อมรับ หรือมีนัดหมายระหว่างซ่อม) */}
        {!isCompleted && isReadyForPickup ? (
          <PickupCalendarCard defaultExpanded={false} />
        ) : (!isCompleted && job.appointment_date && (isWaitingRepair || isReadyForPayment || isCancelled)) ? (
          <PickupCalendarCard defaultExpanded={false} />
        ) : null}

        {/* Repair Job Specifications & Record Card */}
        <View className="bg-white rounded-3xl p-4 mb-4 shadow-sm border border-slate-100">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-7 h-7 rounded-lg bg-slate-100 items-center justify-center">
              <Ionicons name="information-circle-outline" size={16} color="#475569" />
            </View>
            <Text className="text-sm font-bold text-slate-800 font-heading">
              ข้อมูลงานซ่อม
            </Text>
          </View>

          <View className="gap-2.5">
            <View className="flex-row items-center justify-between py-1 border-b border-slate-50">
              <Text className="text-xs text-slate-400 font-body shrink-0 w-24">หมายเลขงาน</Text>
              <Text className="text-xs font-bold text-slate-800 font-heading flex-1 text-right">{job.job_number}</Text>
            </View>

            <View className="flex-row items-center justify-between py-1 border-b border-slate-50">
              <Text className="text-xs text-slate-400 font-body shrink-0 w-24">ประเภทอุปกรณ์</Text>
              <Text className="text-xs font-medium text-slate-700 font-body flex-1 text-right">{job.device_type || 'อุปกรณ์ไอที'}</Text>
            </View>

            <View className="flex-row items-start justify-between py-1 border-b border-slate-50">
              <Text className="text-xs text-slate-400 font-body shrink-0 w-24 pt-0.5">ยี่ห้อ / รุ่น</Text>
              <Text className="text-xs font-medium text-slate-700 font-body flex-1 text-right leading-5">
                {formatDeviceTitle(job.brand, job.model)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1">
              <Text className="text-xs text-slate-400 font-body shrink-0 w-24">วันที่ส่งเครื่อง</Text>
              <Text className="text-xs font-medium text-slate-700 font-body flex-1 text-right">
                {job.created_at ? formatPickupDate(job.created_at) : 'วันนี้'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quotation Card (Dual Option: อนุมัติการซ่อม & ยกเลิกซ่อม) */}
        {(job.quotation_id || job.status_id === 3 || job.status_id === 4 || job.status?.includes('เสนอราคา') || isWaitingRepair || isReadyForPayment || isCancelled) && (
          <CustomerQuotationCard
            items={job.items}
            actualSymptom={job.actual_symptom}
            status={job.status || 'รอตรวจเช็ค'}
            statusId={job.status_id}
            quotationId={job.quotation_id}
            quoteStatusId={job.quotation_status_id}
            isCancelled={isCancelled}
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

        {/* Action Button: รอลูกค้ามารับเครื่อง */}
        {isReadyForPickup && (
          <View className="mt-4">
            <View className="bg-sky-50 rounded-2xl p-4 border border-sky-200 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="cube" size={20} color="#0284C7" style={{ marginRight: 6 }} />
                  <Text className="text-sky-900 font-bold font-heading text-sm">
                    เครื่องพร้อมให้มารับแล้ว
                  </Text>
                </View>
                <View className="bg-sky-100 px-2.5 py-0.5 rounded-full flex-row items-center">
                  <Ionicons name="checkmark-circle" size={11} color="#0369a1" style={{ marginRight: 3 }} />
                  <Text className="text-[11px] font-bold text-sky-800">
                    ชำระเงินเรียบร้อย
                  </Text>
                </View>
              </View>
              <Text className="text-sky-700 text-xs font-body mb-3">
                เจ้าหน้าที่ตรวจสอบการชำระเงินเรียบร้อยแล้ว ลูกค้าสามารถติดต่อรับเครื่องที่หน้าร้าน และเซ็นรับเครื่องกับพนักงานได้เลย
              </Text>
              <TouchableOpacity
                className="w-full bg-white border border-sky-300 py-2.5 rounded-xl items-center justify-center flex-row gap-2 active:bg-sky-50"
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/verify-payment', params: { jobId: job.id, amount: total } })}
              >
                <Ionicons name="eye-outline" size={16} color="#0284C7" />
                <Text className="text-sky-800 font-bold font-heading text-xs">
                  ดูรายละเอียดหลักฐานการชำระเงิน
                </Text>
              </TouchableOpacity>
            </View>
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
        message={`หากยกเลิก จะมีค่าบริการตรวจเช็คสภาพเครื่อง ${CANCEL_INSPECTION_FEE} บาท\n\nคุณต้องการยกเลิกใช่หรือไม่?`}
        confirmText="ใช่, ยกเลิกซ่อม"
        cancelText="ไม่ยกเลิก"
        type="danger"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </SafeAreaView>
  );
}
