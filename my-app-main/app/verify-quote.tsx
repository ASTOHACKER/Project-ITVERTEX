// 1. React & React Native
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

// 2. Third-party / Expo
import { useLocalSearchParams, useRouter } from 'expo-router';

// 3. API helpers
import { getRepair, updateRepairStatus, logRepairJobDetail } from '@/lib/api';

// 4. Components
import ConfirmSendModal from '@/components/ui/ConfirmSendModal';
import TechnicianQuoteCard from '@/components/Staff_verify_quote/TechnicianQuoteCard';
import PageHeader from '@/components/ui/PageHeader';
import CustomAlert from '@/components/ui/CustomAlert';

interface QuoteItem {
  id: string;
  name: string;
  price: number;
}

export default function VerifyQuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const jobNoParam = (params.job_no as string) || (params.job_id as string) || '';
  const initialDeviceModel = (params.device as string) || 'อุปกรณ์ซ่อม';

  const [loading, setLoading] = useState(true);
  const [jobNumericId, setJobNumericId] = useState<number | null>(null);
  const [deviceModel, setDeviceModel] = useState<string>(initialDeviceModel);
  const [isSent, setIsSent] = useState(false);

  // Modals visibility
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);

  // Quote Data
  const [parts, setParts] = useState<QuoteItem[]>([]);
  const [services, setServices] = useState<QuoteItem[]>([]);
  const [actualSymptom, setActualSymptom] = useState<string>('');

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    confirmText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Fetch quote data from DB
  useEffect(() => {
    const fetchQuoteData = async () => {
      const numId = parseInt(jobNoParam.replace(/[^0-9]/g, ''), 10);
      if (isNaN(numId)) {
        setLoading(false);
        return;
      }
      setJobNumericId(numId);

      try {
        const res = await getRepair(numId);
        if (res.success && res.data) {
          const jobData = res.data;

          const fullDevice = [jobData.brand, jobData.model].filter(Boolean).join(' ') || jobData.device_type || initialDeviceModel;
          setDeviceModel(fullDevice);
          if (jobData.actual_symptom) setActualSymptom(jobData.actual_symptom);

          if (jobData.quotation?.parts || jobData.quotation?.services) {
            if (jobData.quotation.parts) {
              setParts(jobData.quotation.parts.map((p: any) => ({
                id: String(p.details_id || p.item_id || Math.random()),
                name: p.item_name || p.name || 'อะไหล่',
                price: Number(p.total_price || p.unit_price * (p.quantity || 1) || 0),
              })));
            }
            if (jobData.quotation.services) {
              setServices(jobData.quotation.services.map((s: any) => ({
                id: String(s.details_id || s.item_id || Math.random()),
                name: s.item_name || s.name || 'ค่าบริการ',
                price: Number(s.total_price || s.unit_price * (s.quantity || 1) || 0),
              })));
            }
          } else if (jobData.quotation?.items && jobData.quotation.items.length > 0) {
            const fetchedParts: QuoteItem[] = [];
            const fetchedServices: QuoteItem[] = [];

            jobData.quotation.items.forEach((item: any) => {
              const itemName = item.item_name || item.name || 'รายการซ่อม';
              const price = Number(item.total_price || item.unit_price * (item.quantity || 1) || item.price || 0);

              if (item.item_type_id === 1 || itemName.includes('อะไหล่') || itemName.includes('พัดลม') || itemName.includes('จอ') || itemName.includes('แบต')) {
                fetchedParts.push({ id: String(item.details_id || item.quote_detail_id || item.id || Math.random()), name: itemName, price });
              } else {
                fetchedServices.push({ id: String(item.details_id || item.quote_detail_id || item.id || Math.random()), name: itemName, price });
              }
            });

            if (fetchedParts.length > 0) setParts(fetchedParts);
            if (fetchedServices.length > 0) setServices(fetchedServices);
          }
 else {
            // Fallback default mockup
            setParts([{ id: '1', name: 'อะไหล่อุปกรณ์ซ่อม', price: Math.max((jobData.total_amount || 1300) - 500, 0) }]);
            setServices([{ id: '2', name: 'ค่าแรงซ่อมและทดสอบ', price: 500 }]);
          }
        }
      } catch (err) {
        console.error('fetchQuoteData error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteData();
  }, [jobNoParam]);

  // เปิดป๊อปอัปยืนยันก่อนกดส่ง
  const handleOpenConfirmModal = () => {
    setConfirmModalVisible(true);
  };

  const [sending, setSending] = useState(false);

  // ยืนยันส่งให้ลูกค้า -> อัปเดตสถานะใน DB เป็น 4 (รอการอนุมัติ)
  const handleConfirmSend = async () => {
    if (sending) return;
    setSending(true);

    try {
      if (jobNumericId) {
        // 4 = รอการอนุมัติ (ส่งใบเสนอราคาให้ลูกค้าพิจารณาแล้ว)
        const res = await updateRepairStatus(jobNumericId, { status_id: 4 });
        if (!res.success) throw new Error(res.message);

        // Action 3 = ออกใบเสนอราคา
        await logRepairJobDetail(jobNumericId, 3, undefined, 'ส่งใบเสนอราคาให้ลูกค้าพิจารณา');
      }

      setConfirmModalVisible(false);
      setIsSent(true);
      setAlertConfig({
        visible: true,
        title: 'ส่งใบเสนอราคาสำเร็จ',
        message: 'ส่งใบเสนอราคาให้ลูกค้าพิจารณาเรียบร้อยแล้ว (สถานะเปลี่ยนเป็นรอการอนุมัติ)',
        type: 'success',
        confirmText: 'ตกลง',
      });
    } catch (err) {
      console.error('Error logging confirm send:', err);
      setAlertConfig({
        visible: true,
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถส่งใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง',
        type: 'danger',
        confirmText: 'ตกลง',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Top Header Bar */}
      <PageHeader title="ตรวจสอบและส่งต่อ" bgColor="#D32F2F" />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#D32F2F" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <TechnicianQuoteCard
            deviceModel={deviceModel}
            parts={parts}
            services={services}
            actualSymptom={actualSymptom}
            isSent={isSent}
            onForwardToCustomer={handleOpenConfirmModal}
          />
        </ScrollView>
      )}

      {/* Confirmation Modal Before Send */}
      <ConfirmSendModal
        visible={isConfirmModalVisible}
        onClose={() => !sending && setConfirmModalVisible(false)}
        onConfirm={handleConfirmSend}
        loading={sending}
      />

      {/* Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        onConfirm={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (alertConfig.type === 'success' || alertConfig.type === 'warning') {
            router.back();
          }
        }}
      />
    </View>
  );
}
