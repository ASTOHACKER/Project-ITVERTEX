// 1. React & React Native
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 3. API & Auth helpers
import { getRepair, updateRepairStatus, logRepairJobDetail } from '@/lib/api';
import { getUser } from '@/lib/auth';

// 4. Components
import CustomerInfoCard from '@/components/Technicain_detail/CustomerInfoCard';
import DetailActionButtons from '@/components/Technicain_detail/DetailActionButtons';
import DeviceInfoCard from '@/components/Technicain_detail/DeviceInfoCard';
import DocumentInfoCard from '@/components/Technicain_detail/DocumentInfoCard';
import PaymentInfoCard from '@/components/Technicain_detail/PaymentInfoCard';
import SignaturesCard from '@/components/Technicain_detail/SignaturesCard';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import CustomAlert from '@/components/ui/CustomAlert';

// ── สถานะที่ช่างสามารถเปลี่ยนไปได้ (เฉพาะขอบเขตของช่าง) ──
const TECH_STATUS_OPTIONS: Record<string, string[]> = {
  'รอตรวจเช็ค': ['ดำเนินการตรวจเช็ค'],
  'ดำเนินการตรวจเช็ค': ['ดำเนินการเสนอราคา'],
  'ดำเนินการเสนอราคา': [],
  'รอการอนุมัติ': [],
  'อนุมัติแล้ว/รอซ่อม': ['กำลังซ่อม', 'รอชำระ'], // ช่างเริ่มซ่อม หรือ ซ่อมเสร็จ เปลี่ยนเป็นรอชำระ
  'กำลังซ่อม': ['รอชำระ'], // เมื่อซ่อมเสร็จ เปลี่ยนเป็นรอชำระ
  'รอชำระ': [],
  'เสร็จสิ้น': [],
  'ยกเลิกซ่อม': [],
};

// ── สถานะที่พนักงานหน้าร้านสามารถเปลี่ยนไปได้ (เฉพาะขอบเขตของพนักงาน) ──
const STAFF_STATUS_OPTIONS: Record<string, string[]> = {
  'รอตรวจเช็ค': [], // หน้าร้านรับเครื่องแล้ว รอช่างตรวจเช็ค
  'ดำเนินการตรวจเช็ค': [], // ช่างกำลังตรวจเช็ค
  'ดำเนินการเสนอราคา': [], // ช่างเป็นผู้ออกและส่งใบเสนอราคาให้ลูกค้าโดยตรง
  'รอการอนุมัติ': [], // ลูกค้าเป็นผู้กดอนุมัติหรือยกเลิก
  'อนุมัติแล้ว/รอซ่อม': [], // ช่างเป็นผู้ดำเนินการซ่อม
  'ยกเลิกซ่อม': ['รอชำระ'], // จากยกเลิกซ่อม ➔ เปลี่ยนเป็นรอชำระ (ค่าตรวจเช็ค 300 บาท)
  'รอชำระ': ['เสร็จสิ้น'], // จากรอชำระ ➔ ส่งมอบและรับเงินเสร็จสิ้น
  'เสร็จสิ้น': [],
};

// ── สถานะที่ผู้จัดการสามารถเปลี่ยนไปได้ ──
// ผู้จัดการมีบทบาทตรวจสอบและกำกับดูแลภาพรวม (View Only) ไม่มีการแก้ไขสถานะงานซ่อม
const MANAGER_STATUS_OPTIONS: Record<string, string[]> = {};

interface JobData {
  id: string;
  job_number: string;
  customer_name: string;
  phone: string;
  email?: string;
  device_type: string;
  brand: string;
  model: string;
  serial_number: string;
  symptoms: string;
  actual_symptom?: string;
  accessories: string;
  password?: string;
  important_software?: string;
  warranty_info?: string;
  technician_name: string;
  inspector_name?: string;
  repairer_name?: string;
  status: string;
  status_id?: number;
  created_at: string;
  received_by?: string;
  return_date?: string;
  appointment_date?: string | null;
  payment_date?: string | null;
  payment_method_id?: number | null;
  payment_method_name?: string | null;
  slip_image?: string | null;
  slip_filename?: string | null;
  total_amount?: number;
  customer_signature?: string | null;
  quotation?: {
    quotation_id: number;
    quote_status_name?: string;
    total_repair_price?: string | number;
    total_cancel_price?: string | number;
    customer_remark?: string | null;
    items?: Array<{
      details_id: number;
      item_name: string;
      item_type_id: number;
      item_type_name: string;
      quantity: string | number;
      unit_price: string | number;
      total_price: string | number;
    }>;
    parts?: any[];
    services?: any[];
    total_parts?: number;
    total_services?: number;
  } | null;
  action_logs?: Array<{
    job_id_detail: number;
    action_type_id: number;
    action_type_name: string;
    action_date: string;
    created_at: string;
    user_name: string;
    role_name?: string;
  }>;
}

export default function TechnicianDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const jobNo = (params.job_number as string) || (params.job_no as string) || '';
  const [currentRole, setCurrentRole] = useState<string>((params.role as string) || 'technician');

  useEffect(() => {
    async function loadRole() {
      if (params.role) {
        setCurrentRole(params.role as string);
        return;
      }
      try {
        const user = await getUser();
        if (user) {
          setCurrentUser(user);
          if (user.role_name) {
            const r = user.role_name.toLowerCase();
            if (r.includes('manag')) setCurrentRole('manager');
            else if (r.includes('staff')) setCurrentRole('staff');
            else setCurrentRole('technician');
          }
        }
      } catch {
        // keep fallback
      }
    }
    loadRole();
  }, [params.role]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ── Fetch job data ──
  useEffect(() => {
    if (!jobNo) {
      setIsLoading(false);
      return;
    }
    fetchJob();
  }, [jobNo]);

  async function fetchJob() {
    try {
      setIsLoading(true);

      let foundJob: JobData | null = null;
      let initialCustomerName = (params.customer_name as string) || '';
      let initialPhone = (params.phone as string) || '';

      const numericId = parseInt(jobNo.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(numericId)) {
        const res = await getRepair(numericId);

        if (res.success && res.data) {
          const dataJob = res.data;

          let custName =
            dataJob.customer_name ||
            (dataJob.first_name
              ? `${dataJob.first_name || ''} ${dataJob.last_name || ''}`.trim()
              : initialCustomerName);
          let custPhone = dataJob.phone || initialPhone;
          let custEmail = dataJob.email || '-';

          const STATUS_MAP: Record<number, string> = {
            1: 'รอตรวจเช็ค',
            2: 'ดำเนินการตรวจเช็ค',
            3: 'ดำเนินการเสนอราคา',
            4: 'รอการอนุมัติ',
            5: 'อนุมัติแล้ว/รอซ่อม',
            6: 'กำลังซ่อม',
            7: 'รอชำระ',
            8: 'เสร็จสิ้น',
            9: 'ยกเลิกซ่อม',
          };

          let warrantyText = '-';
          if (dataJob.warranty_year && Number(dataJob.warranty_year) > 0) {
            warrantyText = `${dataJob.warranty_year} ปี`;
            if (dataJob.warranty_end_date) {
              try {
                const end = new Date(dataJob.warranty_end_date);
                if (!isNaN(end.getTime())) {
                  warrantyText += ` (หมด ${end.toLocaleDateString('th-TH')})`;
                }
              } catch { }
            }
          } else if (dataJob.warranty_year === 0) {
            warrantyText = 'หมดประกัน / ไม่มีประกัน';
          }

          foundJob = {
            id: String(dataJob.job_id),
            job_number: `REP-${String(dataJob.job_id).padStart(6, '0')}`,
            customer_name: custName || 'ไม่ระบุชื่อ',
            phone: custPhone || 'ไม่ระบุเบอร์',
            email: custEmail,
            device_type: dataJob.device_type || 'อุปกรณ์',
            brand: dataJob.brand || '',
            model: dataJob.model || '',
            serial_number: dataJob.serial_number || '-',
            symptoms:
              dataJob.symptoms ||
              dataJob.symptom_details ||
              dataJob.symptom ||
              '-',
            actual_symptom: dataJob.actual_symptom || '',
            accessories: dataJob.included_accessories || dataJob.accessories || '-',
            password: dataJob.device_password || dataJob.password || '-',
            important_software: dataJob.important_software || dataJob.important_programs || '-',
            warranty_info: warrantyText,
            technician_name: dataJob.inspector_name || dataJob.technician_name || 'ช่างเทคนิค',
            inspector_name: dataJob.inspector_name || '-',
            repairer_name: dataJob.repairer_name || '-',
            status: STATUS_MAP[dataJob.status_id] || dataJob.status_name || 'รอตรวจเช็ค',
            status_id: dataJob.status_id,
            created_at: dataJob.created_at || new Date().toISOString(),
            received_by: dataJob.received_by || '-',
            return_date: dataJob.return_date || null,
            appointment_date: dataJob.appointment_date || null,
            payment_date: dataJob.payment_date || null,
            payment_method_id: dataJob.payment_method_id || null,
            payment_method_name: dataJob.payment_method_name || null,
            slip_filename: dataJob.slip_image || null,
            total_amount: Number(dataJob.total_amount) || (dataJob.quotation?.total_repair_price ? Number(dataJob.quotation.total_repair_price) : 0),
            slip_image: (() => {
              const slip = dataJob.slip_image;
              if (!slip) return null;
              if (slip.startsWith('data:') || slip.startsWith('http://') || slip.startsWith('https://')) return slip;
              const apiOrigin = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api').replace(/\/api\/?$/, '');
              // รองรับทั้ง path แบบเก่า (slip_xxx.png) และแบบใหม่ (slips/slip_xxx.png)
              const cleanPath = slip.startsWith('/') ? slip : `/pubilc/${slip}`;
              return `${apiOrigin}${cleanPath}`;
            })(),
            customer_signature: (() => {
              const sig = dataJob.customer_receive_signature;
              if (!sig) return null;
              if (sig.startsWith('data:') || sig.startsWith('http://') || sig.startsWith('https://')) return sig;
              const apiOrigin = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api').replace(/\/api\/?$/, '');
              // รองรับทั้ง path แบบเก่า (signature_xxx.png) และแบบใหม่ (signatures/signature_xxx.png)
              const cleanPath = sig.startsWith('/') ? sig : `/pubilc/${sig}`;
              return `${apiOrigin}${cleanPath}`;
            })(),
            quotation: dataJob.quotation || null,
            action_logs: dataJob.action_logs || [],
          };
        }
      }

      if (foundJob) {
        setJob(foundJob);
        setStatus(foundJob.status);
      } else {
        setJob(null);
      }
    } catch (err) {
      console.error('Fetch job detail error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const statusOptions = (job?.status && currentRole !== 'manager')
    ? (currentRole === 'staff'
      ? STAFF_STATUS_OPTIONS[job.status]
      : TECH_STATUS_OPTIONS[job.status]) || []
    : [];

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (config: Omit<typeof alertConfig, 'visible'>) => {
    setAlertConfig({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const applyStatusUpdate = async (targetStatus: string) => {
    if (!job) return;
    setSaving(true);
    try {
      const numericId = parseInt(job.id, 10);

      if (!isNaN(numericId)) {
        const STATUS_ID_MAP: Record<string, number> = {
          'รอตรวจเช็ค': 1,
          'ดำเนินการตรวจเช็ค': 2,
          'ดำเนินการเสนอราคา': 3,
          'รอการอนุมัติ': 4,
          'อนุมัติแล้ว/รอซ่อม': 5,
          'กำลังซ่อม': 6,
          'รอชำระ': 7,
          'เสร็จสิ้น': 8,
          'ยกเลิกซ่อม': 9,
        };
        const statusId = STATUS_ID_MAP[targetStatus] || 2;

        const res = await updateRepairStatus(numericId, {
          status_id: statusId,
          user_id: currentUser?.id,
        });
        if (!res.success) throw new Error(res.message);

        const ACTION_TYPE_MAP: Record<number, number> = {
          1: 1, // รับเครื่องซ่อม
          2: 2, // เริ่มตรวจเช็คสภาพเครื่อง
          3: 3, // ออกใบเสนอราคา
          4: 3, // รอการอนุมัติ
          5: 4, // อนุมัติแล้ว/รอซ่อม
          6: 4, // เริ่มดำเนินการซ่อม
          7: 5, // ซ่อมเสร็จสิ้น / ทดสอบเครื่อง
          8: 7, // ส่งมอบเครื่องให้ลูกค้า
          9: 8, // ยกเลิกการซ่อม
        };
        let actionTypeId = ACTION_TYPE_MAP[statusId] || 2;
        let actionRemark: string | undefined = undefined;

        if (statusId === 6) {
          actionTypeId = 4;
          actionRemark = 'ช่างเริ่มดำเนินการซ่อมเครื่อง';
        } else if (statusId === 7) {
          if (job.status === 'ยกเลิกซ่อม') {
            actionTypeId = 6;
            actionRemark = 'พนักงานปรับสถานะรอชำระค่าตรวจเช็ค (ยกเลิกซ่อม)';
          } else {
            actionTypeId = 5;
            actionRemark = 'ช่างซ่อมเสร็จสิ้น / ทดสอบเครื่อง เปลี่ยนสถานะเป็นรอชำระ';
          }
        } else if (statusId === 2) {
          actionTypeId = 2;
          actionRemark = 'ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง';
        }

        await logRepairJobDetail(numericId, actionTypeId, currentUser?.id, actionRemark);
      }

      setIsEditing(false);
      setStatus(targetStatus);
      await fetchJob();

      setTimeout(() => {
        showAlert({
          title: 'สำเร็จ',
          message: `อัปเดตสถานะเป็น "${targetStatus}" เรียบร้อยแล้ว`,
          type: 'success',
          confirmText: 'ตกลง',
          onConfirm: hideAlert,
        });
      }, 100);
    } catch (err: any) {
      console.error('Update status error:', err);
      showAlert({
        title: 'ผิดพลาด',
        message: err.message || 'ไม่สามารถอัปเดตสถานะได้',
        type: 'danger',
        confirmText: 'ตกลง',
        onConfirm: hideAlert,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = (targetStatus: string, title: string, message: string) => {
    showAlert({
      title,
      message,
      type: 'info',
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onCancel: hideAlert,
      onConfirm: async () => {
        hideAlert();
        await applyStatusUpdate(targetStatus);
      },
    });
  };

  const handleConfirm = () => {
    if (!status || !job) return;
    showAlert({
      title: 'ยืนยันการบันทึก',
      message: `คุณต้องการเปลี่ยนสถานะเป็น "${status}" ใช่หรือไม่?`,
      type: 'info',
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onCancel: hideAlert,
      onConfirm: async () => {
        hideAlert();
        await applyStatusUpdate(status);
      },
    });
  };

  const handleCancel = () => {
    setStatus(job?.status || '');
    setIsEditing(false);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <View className="flex-1 bg-slate-100">
        <View className="bg-[#DC2626] px-5 pb-4 z-10" style={{ paddingTop: insets.top + 10 }}>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="chevron-back" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">ใบรับซ่อม</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center py-10">
          <ActivityIndicator size="large" color="#DC2626" />
          <Text className="mt-3 text-sm text-slate-500">กำลังโหลดข้อมูล...</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View className="flex-1 bg-slate-100">
        <View className="bg-[#DC2626] px-5 pb-4 z-10" style={{ paddingTop: insets.top + 10 }}>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="chevron-back" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">ใบรับซ่อม</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center py-10">
          <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
          <Text className="mt-3 text-sm text-slate-500">ไม่พบข้อมูลงานซ่อม</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      {/* Top Header */}
      <View className="bg-[#DC2626] px-5 pb-4 z-10" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                if (currentRole === 'manager') {
                  router.replace('/(meneger)/repairs');
                } else {
                  router.replace('/(technicain)');
                }
              }
            }}
            className="mr-3"
          >
            <Ionicons name="chevron-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">ใบรับซ่อม</Text>
            <Text className="text-white text-[13px] opacity-80">Repair Document</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >


        {/* Customer Section */}
        <CustomerInfoCard
          customerName={job.customer_name}
          phone={job.phone}
          email={job.email}
        />
        {/* Document Header Card */}
        <DocumentInfoCard
          jobNo={job.job_number || jobNo}
          createdAt={job.created_at}
          paymentDate={job.payment_date}
          returnDate={job.return_date}
          receivedBy={job.received_by}
          inspectorName={job.inspector_name}
          repairerName={job.repairer_name}
        />

        {/* Device Section */}
        <DeviceInfoCard
          deviceType={job.device_type}
          brand={job.brand}
          model={job.model}
          serialNumber={job.serial_number}
          symptoms={job.symptoms}
          actualSymptom={job.actual_symptom}
          technicianName={job.technician_name}
          inspectorName={job.inspector_name}
          repairerName={job.repairer_name}
          accessories={job.accessories}
          password={job.password}
          importantSoftware={job.important_software}
          warrantyInfo={job.warranty_info}
        />

        {/* ข้อมูลการชำระเงิน */}
        <PaymentInfoCard
          paymentMethodId={job.payment_method_id}
          paymentMethodName={job.payment_method_name}
          paymentDate={job.payment_date}
          statusId={job.status_id}
          statusName={job.status}
          slipImage={job.slip_image}
          slipFilename={job.slip_filename}
          totalAmount={job.total_amount}
        />

        {/* Signatures Section */}
        <SignaturesCard
          customerSignature={job.customer_signature}
        />

        {/* ── Quick Action Hub (Role-Tailored Productivity Bar) ── */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-200 shadow-sm">
          <View className="flex-row items-center gap-2 mb-3">
            {/* <View className="w-7 h-7 rounded-lg bg-red-50 items-center justify-center">
              <Ionicons name="flash-outline" size={16} color="#DC2626" />
            </View> */}
            <Text className="text-sm font-bold text-slate-800 font-heading">
              การดำเนินการด่วนสำหรับ {currentRole === 'technician' ? 'ช่างซ่อม' : currentRole === 'staff' ? 'พนักงานหน้าร้าน' : 'ผู้จัดการ'}
            </Text>
          </View>

          {/* Technician Quick Actions */}
          {currentRole === 'technician' && (
            <View className="flex-col gap-2.5">
              {job.status === 'รอตรวจเช็ค' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="bg-amber-600 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                  onPress={() => {
                    handleQuickStatusChange(
                      'ดำเนินการตรวจเช็ค',
                      'ยืนยันเริ่มตรวจเช็ค',
                      'ต้องการเริ่มตรวจเช็คสภาพเครื่องนี้และปรับสถานะเป็น "ดำเนินการตรวจเช็ค" หรือไม่?'
                    );
                  }}
                >
                  <Ionicons name="search" size={18} color="#FFFFFF" />
                  <Text className="text-white text-sm font-bold font-heading">เริ่มตรวจเช็คสภาพเครื่อง</Text>
                </TouchableOpacity>
              )}

              {(job.status === 'ดำเนินการตรวจเช็ค' || job.status === 'ดำเนินการเสนอราคา' || job.status === 'รอตรวจเช็ค' || job.quotation) && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="bg-sky-600 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                  onPress={() => {
                    router.push({
                      pathname: '/make-quote',
                      params: {
                        job_id: job.id,
                        job_no: job.job_number,
                        customer_name: job.customer_name,
                        phone: job.phone,
                      },
                    });
                  }}
                >
                  <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
                  <Text className="text-white text-sm font-bold font-heading">
                    {job.quotation ? 'ดู / ปรับปรุงใบเสนอราคา' : 'สร้างใบเสนอราคาใหม่ (เลือกอะไหล่ & ค่าบริการ)'}
                  </Text>
                </TouchableOpacity>
              )}

              {job.status === 'อนุมัติแล้ว/รอซ่อม' && (
                <View className="flex-col gap-2">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="bg-sky-600 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                    onPress={() => {
                      handleQuickStatusChange(
                        'กำลังซ่อม',
                        'ยืนยันเริ่มลงมือซ่อม',
                        'ต้องการเปลี่ยนสถานะเป็น "กำลังซ่อม" เพื่อเริ่มลงมือซ่อมเครื่องใช่หรือไม่?'
                      );
                    }}
                  >
                    <Ionicons name="hammer-outline" size={18} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold font-heading">เริ่มดำเนินการซ่อมเครื่อง (สถานะ: กำลังซ่อม)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="bg-emerald-600 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                    onPress={() => {
                      handleQuickStatusChange(
                        'รอชำระ',
                        'ยืนยันซ่อมเสร็จสิ้น',
                        'ยืนยันว่าซ่อมเสร็จสมบูรณ์และส่งต่องานไปยังขั้นตอน "รอชำระเงิน" ใช่หรือไม่?'
                      );
                    }}
                  >
                    <Ionicons name="checkmark-done-circle-outline" size={18} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold font-heading">ซ่อมเสร็จเรียบร้อย (ส่งต่อรอชำระ)</Text>
                  </TouchableOpacity>
                </View>
              )}

              {job.status === 'กำลังซ่อม' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="bg-emerald-600 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                  onPress={() => {
                    handleQuickStatusChange(
                      'รอชำระ',
                      'ยืนยันซ่อมเสร็จสิ้น',
                      'ยืนยันว่าซ่อมเสร็จสมบูรณ์และส่งต่องานไปยังขั้นตอน "รอชำระเงิน" ใช่หรือไม่?'
                    );
                  }}
                >
                  <Ionicons name="checkmark-done-circle-outline" size={18} color="#FFFFFF" />
                  <Text className="text-white text-sm font-bold font-heading">ซ่อมเสร็จสิ้นสมบูรณ์ (ส่งต่อรอชำระ)</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Staff Quick Actions */}
          {currentRole === 'staff' && (
            <View className="flex-col gap-2.5">
              {(job.status === 'รอชำระ' || job.status_id === 7) && (
                <View className="flex-col gap-2">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="bg-emerald-600 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                    onPress={() => {
                      router.push({
                        pathname: '/verify-payment' as any,
                        params: {
                          jobId: job.id,
                          job_id: job.id,
                          job_no: job.job_number,
                          customer_name: job.customer_name,
                          amount: String(job.total_amount || 300),
                          role: 'staff',
                        },
                      });
                    }}
                  >
                    <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold font-heading">ตรวจสอบการชำระเงิน / สลิปโอน</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    className="bg-amber-500 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                    onPress={() => {
                      router.push({
                        pathname: '/deliver-handover' as any,
                        params: {
                          job_id: job.id,
                          jobId: job.id,
                          job_no: job.job_number,
                          customer_name: job.customer_name,
                          device: `${job.brand || ''} ${job.model || ''}`.trim() || job.device_type,
                          price: String(job.total_amount || 300),
                          role: 'staff',
                        },
                      });
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold font-heading">ส่งมอบเครื่องพร้อมเซ็นชื่อดิจิทัล</Text>
                  </TouchableOpacity>
                </View>
              )}

              {(job.status === 'เสร็จสิ้น' || job.status_id === 8) && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="bg-slate-800 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
                  onPress={() => {
                    router.push({
                      pathname: '/receipt' as any,
                      params: {
                        jobId: job.id,
                        job_id: job.id,
                        job_no: job.job_number,
                      },
                    });
                  }}
                >
                  <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
                  <Text className="text-white text-sm font-bold font-heading">พิมพ์ / ดูใบเสร็จรับเงิน (Receipt)</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Manager Quick Note */}
          {currentRole === 'manager' && (
            <Text className="text-xs text-slate-500 font-body">
              ผู้จัดการมีสิทธิ์ตรวจสอบข้อมูลภาพรวม ประวัติงานซ่อม อะไหล่ และเอกสารทั้งหมด (โหมดตรวจสอบ)
            </Text>
          )}
        </View>

        {/* Status Dropdown Picker & Confirm Block */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm shadow-black/5 elevation-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-slate-800">สถานะ</Text>
            {isEditing ? (
              <TouchableOpacity
                className="flex-row items-center bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 w-[200px] justify-between"
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Text className="text-sm text-slate-800">{status}</Text>
                <Ionicons
                  name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#1e293b"
                />
              </TouchableOpacity>
            ) : (
              <Text className="text-sm text-slate-800 mr-1">{status}</Text>
            )}
          </View>

          {/* Inline Dropdown Options (Visible in Edit Mode only) */}
          {isEditing && isDropdownOpen && (
            <View className="mt-2 border border-slate-200 rounded-lg bg-white overflow-hidden">
              {statusOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  className="py-2.5 px-3 border-b border-slate-100"
                  onPress={() => {
                    setStatus(opt);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text className={`text-sm ${status === opt ? 'text-[#D32F2F] font-bold' : 'text-slate-800'}`}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Action buttons (Visible in Edit Mode only) */}
          <DetailActionButtons
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            visible={isEditing}
            loading={saving}
          />
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) - Visible only when current role can edit this status
          Manager = view-only, ซ่อนปุ่มเมื่อชำระเงินแล้วและรอการยืนยันจากพนักงาน */}
      <FloatingActionButton
        onPress={() => setIsEditing(true)}
        icon="create-outline"
        bgColor="#DC2626"
        visible={
          !isEditing &&
          currentRole !== 'manager' &&
          statusOptions.length > 0 &&
          // ถ้าสถานะ 'รอชำระ' + มี payment_method_id แล้ว = ลูกค้าชำระแล้ว
          // ช่างไม่ต้องทำอะไร เฉพาะ Staff เท่านั้นที่สามารถยืนยันและเปลี่ยนเป็น 'เสร็จสิ้น'
          !(currentRole === 'technician' && job?.status === 'รอชำระ' && job?.payment_method_id != null)
        }
      />

      {/* Reusable Custom Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={() => {
          const cb = alertConfig.onConfirm;
          hideAlert();
          cb?.();
        }}
        onCancel={
          alertConfig.onCancel
            ? () => {
              const cb = alertConfig.onCancel;
              hideAlert();
              cb?.();
            }
            : undefined
        }
      />
    </View>
  );
}
