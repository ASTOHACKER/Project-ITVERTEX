// 1. React & React Native
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 3. API helpers
import { createQuotation, getQuotation, getRepair, logRepairJobDetail, updateQuotation } from '@/lib/api';
import { CANCEL_INSPECTION_FEE } from '@/constants/status';

// 4. Components
import PartsCostCard from '@/components/Technicain_make_quote/PartsCostCard';
import ServiceFeeCard from '@/components/Technicain_make_quote/ServiceFeeCard';
import SymptomCard from '@/components/Technicain_make_quote/SymptomCard';
import CustomAlert from '@/components/ui/CustomAlert';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';

import type { PartItem, ServiceItem } from '@/types/quotation';

export default function MakeQuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Params
  const jobIdParam = (params.job_id as string) || (params.id as string) || '';
  const jobNoParam = (params.job_no as string) || '';
  const jobNo = jobNoParam || (jobIdParam ? `REP-${String(jobIdParam).padStart(6, '0')}` : '');
  const customerNameParam = (params.customer_name as string) || '';

  const [jobId, setJobId] = useState<string>(jobIdParam || '');
  const [quoteId, setQuoteId] = useState<number | null>(
    params.quote_id ? parseInt(String(params.quote_id), 10) : null
  );
  const [customerName, setCustomerName] = useState(customerNameParam);
  const [deviceName, setDeviceName] = useState('');
  const [loading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form inputs (อาการที่ลูกค้าแจ้ง vs อาการจริงหลังตรวจเช็ค)
  const [initialSymptom, setInitialSymptom] = useState('');
  const [actualSymptom, setActualSymptom] = useState('');
  const [customerRemark, setCustomerRemark] = useState('');
  const [quoteStatusId, setQuoteStatusId] = useState<number | null>(null);

  const [partInputName, setPartInputName] = useState('');
  const [partInputPrice, setPartInputPrice] = useState('');
  const [partInputQty, setPartInputQty] = useState('1');
  const [serviceInputName, setServiceInputName] = useState('');
  const [serviceInputPrice, setServiceInputPrice] = useState('');

  // Lists
  const [parts, setParts] = useState<PartItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // ── Fetch job data ──
  useEffect(() => {
    if (!jobNo && !jobIdParam) {
      setIsLoading(false);
      return;
    }
    fetchJob();
  }, [jobNo, jobIdParam]);

  async function fetchJob() {
    try {
      setIsLoading(true);
      const numericId = parseInt(jobIdParam, 10) || (jobNo ? parseInt(jobNo.split('-').pop() || '', 10) || parseInt(jobNo.replace(/[^0-9]/g, ''), 10) : NaN);

      if (!isNaN(numericId) && numericId > 0) {
        const res = await getRepair(numericId);
        if (res.success && res.data) {
          const dataJob = res.data;
          setJobId(String(dataJob.job_id || numericId));

          const activeQuoteId = (params.quote_id ? parseInt(String(params.quote_id), 10) : null) || dataJob.quotation_id || dataJob.quotation?.quotation_id || null;
          if (activeQuoteId) {
            setQuoteId(activeQuoteId);
          }

          const fullDevice =
            [dataJob.brand, dataJob.model].filter(Boolean).join(' ') ||
            dataJob.device_type ||
            'อุปกรณ์ซ่อม';
          setDeviceName(fullDevice);

          const initSym = dataJob.symptoms || dataJob.symptom_details || dataJob.symptom || '';
          setInitialSymptom(initSym);

          if (dataJob.actual_symptom) {
            setActualSymptom(dataJob.actual_symptom);
          }

          const fullName = `${dataJob.first_name || ''} ${dataJob.last_name || ''}`.trim();
          if (fullName) {
            setCustomerName(fullName);
          } else if (dataJob.customer_name) {
            setCustomerName(dataJob.customer_name);
          }

          // โหลดข้อมูลใบเสนอราคาเดิมผ่าน getQuotation จาก /lib/api หากมี quote_id
          let quoteData: any = dataJob.quotation;
          if (activeQuoteId) {
            try {
              const qRes = await getQuotation(activeQuoteId);
              if (qRes.success && qRes.data) {
                quoteData = qRes.data;
              }
            } catch (qErr) {
              console.warn('Could not fetch quotation directly:', qErr);
            }
          }

          if (quoteData) {
            setQuoteStatusId(quoteData.quote_status_id || null);

            // หากเป็นสถานะที่อนุมัติแล้ว (2) หรือยกเลิก (3) จะไม่อนุญาตให้แก้ไข
            if (quoteData.quote_status_id === 2 || quoteData.quote_status_id === 3) {
              const statusName =
                quoteData.quote_status_name ||
                (quoteData.quote_status_id === 2 ? 'อนุมัติแล้ว' : 'ลูกค้ายกเลิก');
              showAlert({
                title: 'ไม่สามารถแก้ไขใบเสนอราคานี้ได้',
                message: `ใบเสนอราคานี้อยู่ในสถานะ "${statusName}" แล้ว จึงไม่สามารถทำการแก้ไขหรือเปลี่ยนแปลงรายการได้`,
                type: 'warning',
                confirmText: 'ย้อนกลับ',
                onConfirm: () => {
                  hideAlert();
                  router.back();
                },
              });
              return;
            }

            if (quoteData.actual_symptom) {
              setActualSymptom(quoteData.actual_symptom);
            }
            if (quoteData.customer_remark) {
              setCustomerRemark(quoteData.customer_remark);
            }

            // แยกรายการอะไหล่ (item_type_id = 1) และค่าบริการ (item_type_id = 2) จาก Type ID โดยตรง
            if (quoteData.parts && quoteData.parts.length > 0) {
              setParts(quoteData.parts.map((p: any) => ({
                id: String(p.details_id || p.id || Math.random()),
                name: p.item_name || p.name || 'อะไหล่',
                price: Number(p.unit_price || p.price || 0),
                qty: Number(p.quantity || p.qty || 1),
                item_id: p.item_id,
              })));
            } else if (quoteData.items && quoteData.items.length > 0) {
              const pItems = quoteData.items.filter((it: any) => it.item_type_id === 1);
              if (pItems.length > 0) {
                setParts(pItems.map((p: any) => ({
                  id: String(p.details_id || p.id || Math.random()),
                  name: p.item_name || p.name || 'อะไหล่',
                  price: Number(p.unit_price || p.price || 0),
                  qty: Number(p.quantity || p.qty || 1),
                  item_id: p.item_id,
                })));
              }
            }

            if (quoteData.services && quoteData.services.length > 0) {
              setServices(quoteData.services.map((s: any) => ({
                id: String(s.details_id || s.id || Math.random()),
                name: s.item_name || s.name || 'ค่าบริการ',
                price: Number(s.unit_price || s.price || 0),
                qty: Number(s.quantity || s.qty || 1),
                item_id: s.item_id,
              })));
            } else if (quoteData.items && quoteData.items.length > 0) {
              const sItems = quoteData.items.filter((it: any) => it.item_type_id === 2);
              if (sItems.length > 0) {
                setServices(sItems.map((s: any) => ({
                  id: String(s.details_id || s.id || Math.random()),
                  name: s.item_name || s.name || 'ค่าบริการ',
                  price: Number(s.unit_price || s.price || 0),
                  qty: Number(s.quantity || s.qty || 1),
                  item_id: s.item_id,
                })));
              }
            }
          }
        } else {
          setJobId(String(numericId));
          setDeviceName('อุปกรณ์ซ่อม');
        }
      } else {
        const fallbackId = parseInt(jobIdParam, 10);
        if (!isNaN(fallbackId) && fallbackId > 0) setJobId(String(fallbackId));
        setDeviceName('อุปกรณ์ซ่อม');
      }
    } catch (err) {
      console.error('Fetch job for quote error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Alert State
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

  // Delete Confirmation State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    type: 'part' | 'service';
  } | null>(null);

  const handlePromptDeletePart = (id: string) => {
    const target = parts.find((p) => p.id === id);
    setItemToDelete({
      id,
      name: target ? target.name : 'รายการอะไหล่',
      type: 'part',
    });
    setDeleteModalVisible(true);
  };

  const handlePromptDeleteService = (id: string) => {
    const target = services.find((s) => s.id === id);
    setItemToDelete({
      id,
      name: target ? target.name : 'รายการค่าบริการ',
      type: 'service',
    });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'part') {
      if (parts.length <= 1 && services.length > 0) {
        setDeleteModalVisible(false);
        setItemToDelete(null);
        showAlert({
          title: 'ไม่สามารถลบอะไหล่ทั้งหมดได้',
          message: 'ค่าบริการมีได้ก็ต้องมีรายการอะไหล่ก่อน หากต้องการลบอะไหล่ทั้งหมด กรุณาลบรายการค่าบริการออกก่อน',
          type: 'warning',
          confirmText: 'เข้าใจแล้ว',
          onConfirm: hideAlert,
        });
        return;
      }
      setParts((prev) => prev.filter((p) => p.id !== itemToDelete.id));
    } else {
      setServices((prev) => prev.filter((s) => s.id !== itemToDelete.id));
    }
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  // Add Part
  const handleAddPart = (itemFromDb?: any) => {
    const qNum = Math.max(1, parseInt(partInputQty, 10) || 1);
    if (itemFromDb) {
      setParts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: itemFromDb.item_name,
          price: Math.max(0, parseFloat(itemFromDb.selling_price || itemFromDb.unit_price || 0)),
          qty: qNum,
          item_id: itemFromDb.item_id,
        },
      ]);
      setPartInputQty('1');
      return;
    }

    if (!partInputName.trim() || !partInputPrice.trim()) return;
    const priceNum = parseFloat(partInputPrice);
    if (isNaN(priceNum)) return;
    if (priceNum < 0) {
      showAlert({
        title: 'ราคาไม่ถูกต้อง',
        message: 'ราคาอะไหล่ต้องไม่เป็นค่าติดลบ',
        type: 'warning',
      });
      return;
    }

    setParts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: partInputName.trim(),
        price: priceNum,
        qty: qNum,
      },
    ]);
    setPartInputName('');
    setPartInputPrice('');
    setPartInputQty('1');
  };

  // Remove Part (prompt confirmation)
  const handleRemovePart = (id: string) => {
    handlePromptDeletePart(id);
  };

  // Update Part Qty
  const handleUpdatePartQty = (id: string, newQty: number) => {
    if (newQty <= 0) return;
    setParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, newQty) } : p))
    );
  };

  // Add Service (ค่าบริการไม่มีจำนวน — ล็อก qty = 1 เสมอ)
  const handleAddService = (itemFromDb?: any) => {
    if (parts.length === 0) {
      showAlert({
        title: 'ยังไม่มีรายการอะไหล่',
        message: 'ค่าบริการมีได้ก็ต้องมีรายการอะไหล่ก่อน กรุณาเพิ่มรายการอะไหล่อย่างน้อย 1 รายการก่อนเพิ่มค่าบริการ',
        type: 'warning',
        confirmText: 'เข้าใจแล้ว',
        onConfirm: hideAlert,
      });
      return;
    }
    if (itemFromDb) {
      setServices((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: itemFromDb.item_name,
          price: Math.max(0, parseFloat(itemFromDb.selling_price || itemFromDb.unit_price || 0)),
          qty: 1,
          item_id: itemFromDb.item_id,
        },
      ]);
      return;
    }

    if (!serviceInputName.trim() || !serviceInputPrice.trim()) return;
    const priceNum = parseFloat(serviceInputPrice);
    if (isNaN(priceNum)) return;
    if (priceNum < 0) {
      showAlert({
        title: 'ราคาไม่ถูกต้อง',
        message: 'ค่าบริการต้องไม่เป็นค่าติดลบ',
        type: 'warning',
      });
      return;
    }

    setServices((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: serviceInputName.trim(),
        price: priceNum,
        qty: 1,
      },
    ]);
    setServiceInputName('');
    setServiceInputPrice('');
  };

  // Remove Service (prompt confirmation)
  const handleRemoveService = (id: string) => {
    handlePromptDeleteService(id);
  };

  // Totals
  const totalPartsCost = parts.reduce((sum, p) => sum + p.price * (p.qty || 1), 0);
  const totalServicesCost = services.reduce((sum, s) => sum + s.price * (s.qty || 1), 0);
  const grandTotal = totalPartsCost + totalServicesCost;

  // Submit Quote
  const handleSubmitQuote = () => {
    if (saving) return;

    if (!actualSymptom.trim()) {
      showAlert({
        title: 'กรุณาระบุอาการเสียจริง',
        message: 'กรุณากรอกผลการตรวจเช็คอาการเสียจริงของช่างก่อนส่งข้อมูลเสนอราคา',
        type: 'warning',
        confirmText: 'เข้าใจแล้ว',
        onConfirm: hideAlert,
      });
      return;
    }

    if (parts.length === 0 && services.length === 0) {
      showAlert({
        title: 'ไม่มีรายการค่าใช้จ่าย',
        message: 'กรุณาเพิ่มรายการอะไหล่และค่าบริการอย่างน้อยประเภทละ 1 รายการก่อนส่งข้อมูลเสนอราคา',
        type: 'warning',
        confirmText: 'เข้าใจแล้ว',
        onConfirm: hideAlert,
      });
      return;
    }

    if (services.length > 0 && parts.length === 0) {
      showAlert({
        title: 'เงื่อนไขไม่ถูกต้อง',
        message: 'ค่าบริการมีได้ก็ต้องมีรายการอะไหล่อย่างน้อย 1 รายการก่อน กรุณาเพิ่มรายการอะไหล่',
        type: 'warning',
        confirmText: 'เข้าใจแล้ว',
        onConfirm: hideAlert,
      });
      return;
    }

    if (parts.length > 0 && services.length === 0) {
      showAlert({
        title: 'ยังไม่มีรายการค่าบริการ',
        message: 'ไม่สามารถสร้างหรือแก้ไขใบเสนอราคาที่มีเฉพาะอะไหล่ได้ กรุณาเพิ่มรายการค่าบริการหรือค่าแรงอย่างน้อย 1 รายการ',
        type: 'warning',
        confirmText: 'เข้าใจแล้ว',
        onConfirm: hideAlert,
      });
      return;
    }

    showAlert({
      title: 'ยืนยันการเสนอราคา',
      message: `คุณต้องการส่งข้อมูลเสนอราคายอดรวม ${grandTotal.toLocaleString()} บาท ใช่หรือไม่?`,
      type: 'info',
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      onCancel: hideAlert,
      onConfirm: async () => {
        if (quoteStatusId === 2 || quoteStatusId === 3) {
          showAlert({
            title: 'ไม่สามารถแก้ไขได้',
            message: 'ใบเสนอราคานี้ได้รับการอนุมัติหรือลูกค้ายกเลิกแล้ว จึงไม่สามารถบันทึกการแก้ไขได้',
            type: 'warning',
          });
          return;
        }
        setSaving(true);
        try {
          const numericId = parseInt(jobId, 10) || parseInt(jobIdParam, 10) || (jobNo ? parseInt(jobNo.split('-').pop() || '', 10) : 0);
          if (!numericId || numericId <= 0) throw new Error('ไม่พบรหัสงานซ่อมที่ถูกต้อง');

          const quoteData = {
            job_id: numericId,
            type: 'quote',
            total_repair_price: grandTotal,
            total_cancel_price: CANCEL_INSPECTION_FEE,
            symptom: actualSymptom.trim(),
            actual_symptom: actualSymptom.trim(),
            parts: parts.map((p) => ({
              name: p.name,
              price: p.price,
              qty: p.qty,
              item_id: p.item_id,
            })),
            services: services.map((s) => ({
              name: s.name,
              price: s.price,
              qty: s.qty,
              item_id: s.item_id,
            })),
            total_parts: totalPartsCost,
            total_services: totalServicesCost,
            total: grandTotal,
          };

          const res = quoteId
            ? await updateQuotation(quoteId, quoteData)
            : await createQuotation(quoteData);
          if (!res.success) throw new Error(res.message || 'ไม่สามารถบันทึกใบเสนอราคาได้');

          const actionTypeId = 3; // 3 = ออกใบเสนอราคา
          await logRepairJobDetail(numericId, actionTypeId);

          setTimeout(() => {
            showAlert({
              title: 'สำเร็จ',
              message: quoteId
                ? 'ปรับปรุงใบเสนอราคาพร้อมแจ้งลูกค้ารออนุมัติเรียบร้อยแล้ว'
                : 'บันทึกใบเสนอราคาพร้อมอาการเสียจริงเรียบร้อยแล้ว',
              type: 'success',
              confirmText: 'กลับไปหน้ารายการใบเสนอราคา',
              onConfirm: () => {
                hideAlert();
                router.replace('/(technicain)/repairing');
              },
            });
          }, 100);
        } catch (err: any) {
          console.error('Save quote error:', err);
          showAlert({
            title: 'ผิดพลาด',
            message: err.message || 'เกิดข้อผิดพลาดในการบันทึก',
            type: 'danger',
            confirmText: 'ตกลง',
            onConfirm: hideAlert,
          });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Red Header */}
      <View className="bg-[#DC2626] px-5 pb-4 z-10" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="chevron-back" size={28} color="#ffffff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">ทำใบเสนอราคา</Text>
            <Text className="text-white text-[13px] opacity-80 shrink">
              {deviceName} • {jobNo} • {customerName}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, alignItems: 'center' }}
      >
        <View className="w-full max-w-[600px]">
          {loading ? (
            <View className="flex-1 justify-center items-center py-20">
              <ActivityIndicator size="large" color="#DC2626" />
              <Text className="mt-3 text-sm text-slate-500">กำลังโหลดข้อมูล...</Text>
            </View>
          ) : (
            <>
              {/* Alert ข้อความที่ลูกค้าขอแก้ไข/เพิ่มเติม */}
              {customerRemark ? (
                <View className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4 shadow-sm">
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#d97706" />
                    <Text className="text-amber-900 font-bold text-sm font-heading">
                      ลูกค้าขอเพิ่มเติม / ปรับปรุงใบเสนอราคา:
                    </Text>
                  </View>
                  <Text className="text-amber-950 text-sm pl-7 leading-5 font-body">
                    &ldquo;{customerRemark}&rdquo;
                  </Text>
                </View>
              ) : null}

              {/* อาการเสีย: อาการลูกค้าแจ้ง vs อาการจริงหลังตรวจเช็ค */}
              <SymptomCard
                initialSymptom={initialSymptom}
                actualSymptom={actualSymptom}
                onChangeActualSymptom={setActualSymptom}
              />

              {/* ค่าอะไหล่ */}
              <PartsCostCard
                parts={parts}
                partInputName={partInputName}
                setPartInputName={setPartInputName}
                partInputPrice={partInputPrice}
                setPartInputPrice={setPartInputPrice}
                partInputQty={partInputQty}
                setPartInputQty={setPartInputQty}
                onAddPart={handleAddPart}
                onRemovePart={handleRemovePart}
                onUpdatePartQty={handleUpdatePartQty}
                totalPartsCost={totalPartsCost}
              />

              {/* ค่าบริการ/ค่าแรง */}
              <ServiceFeeCard
                services={services}
                serviceInputName={serviceInputName}
                setServiceInputName={setServiceInputName}
                serviceInputPrice={serviceInputPrice}
                setServiceInputPrice={setServiceInputPrice}
                onAddService={handleAddService}
                onRemoveService={handleRemoveService}
                totalServicesCost={totalServicesCost}
              />

              {/* ยอดรวมทั้งหมด */}
              <View className="flex-row justify-between items-center py-4 px-1 border-t border-slate-200 mb-5">
                <Text className="text-base font-bold text-slate-800">ยอดรวมค่าซ่อม</Text>
                <Text className="text-2xl font-bold text-[#D32F2F]">
                  {grandTotal.toLocaleString()} <Text className="text-sm text-slate-800">บาท</Text>
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className={`bg-[#DC2626] h-[52px] rounded-xl flex-row justify-center items-center gap-2 shadow-lg shadow-[#DC2626]/20 elevation-3 active:opacity-90 ${saving ? 'opacity-70' : ''}`}
                onPress={handleSubmitQuote}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                    <Text className="text-white text-base font-bold font-heading">บันทึกและส่งใบเสนอราคา</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Custom Reusable Alert Modal */}
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

      {/* Delete Item Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="ยืนยันการลบรายการ"
        itemName={itemToDelete?.name}
        message="คุณต้องการลบรายการนี้ออกจากใบเสนอราคาหรือไม่?"
        confirmText="ลบรายการ"
        cancelText="ยกเลิก"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setItemToDelete(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}
