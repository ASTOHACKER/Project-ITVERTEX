// 1. React & React Native
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

// 2. Third-party / Expo
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API helpers
import { getRepair } from '@/lib/api';

interface RepairJob {
  id: string;
  job_number: string;
  customer_name: string;
  phone: string;
  device_type: string;
  brand: string;
  model: string;
  serial_number: string;
  symptoms: string;
  items: any[];
  status: string;
  created_at: string;
}

export default function ReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string; job_id?: string; job_no?: string; id?: string }>();
  const targetId = params.jobId || params.job_id || params.id || (params.job_no ? params.job_no.replace(/[^0-9]/g, '') : '');
  const [job, setJob] = useState<RepairJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (targetId) fetchJob();
    else setLoading(false);
  }, [targetId]);

  async function fetchJob() {
    try {
      setLoading(true);
      const res = await getRepair(targetId);
      if (res.success && res.data) {
        const data = res.data;
        setJob({
          id: String(data.job_id || targetId),
          job_number: `REP-${String(data.job_id || targetId).padStart(6, '0')}`,
          customer_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'ไม่ระบุชื่อ',
          phone: data.phone || '-',
          device_type: data.device_type || '-',
          brand: data.brand || '-',
          model: data.model || '-',
          serial_number: data.serial_number || '-',
          symptoms: data.symptom || data.symptoms || '-',
          items: data.quotation?.items || [],
          status: data.status_name || (data.status_id === 8 ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'),
          created_at: data.created_at || new Date().toISOString(),
        });
      } else {
        setJob(null);
      }
    } catch (err: any) {
      console.error('Receipt fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const items = job?.items && Array.isArray(job.items) ? job.items : [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price || item.unit_price) || 0), 0);
  const vat = Math.round(subtotal * 0.07 * 100) / 100;
  const grandTotal = subtotal + vat;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatNumber = (n: number) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleConfirmPayment = async () => {
    if (!job) return;
    try {
      setJob({ ...job, status: 'ชำระแล้ว' });
      Alert.alert('สำเร็จ', 'ยืนยันการชำระเงินเรียบร้อยแล้ว');
    } catch (err: any) {
      Alert.alert('ล้มเหลว', err.message);
    }
  };

  const printToPDF = () => {
    Alert.alert('พิมพ์ใบเสร็จ', 'ส่งคำสั่งพิมพ์ไปยังเครื่องพิมพ์');
  };

  const shareAsText = async () => {
    if (!job) return;
    try {
      const message = `IT VERTEX ใบเสร็จค่าซ่อม\nเลขที่: ${job.job_number}\nลูกค้า: ${job.customer_name}\nยอดชำระ: ${formatNumber(grandTotal)} บาท`;
      await Share.share({ message });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center bg-slate-50">
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text className="mt-4 text-slate-500 text-base">กำลังโหลดใบเสร็จ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center bg-slate-50">
          <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
          <Text className="mt-4 text-slate-500 text-base">ไม่พบข้อมูลใบเสร็จ</Text>
          <TouchableOpacity
            className="mt-4 px-6 py-2.5 rounded-xl border border-[#D32F2F]"
            onPress={() => router.back()}
          >
            <Text className="text-[#D32F2F] font-bold">กลับ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = job.status === 'ชำระแล้ว' || job.status === 'เสร็จสิ้น' || job.status === 'ส่งมอบแล้ว';

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-4 bg-[#D32F2F]"
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">ใบเสร็จค่าซ่อม</Text>
        <View className="w-6" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Receipt Card */}
        <View className="bg-white rounded-2xl p-5 w-full shadow-sm shadow-black/10 elevation-4 mb-5 relative overflow-hidden">
          {/* Paid Stamp */}
          {isPaid && (
            <View className="absolute top-4 right-4 z-10">
              <View className="border-[2.5px] border-green-600 rounded-lg px-2 py-1 items-center bg-green-600/5 -rotate-12">
                <Text className="text-green-600 text-base font-bold tracking-widest">PAID</Text>
                <Text className="text-green-600 text-[10px] font-bold -mt-0.5">ชำระแล้ว</Text>
              </View>
            </View>
          )}

          <View className="items-center mb-2.5 pt-2.5">
            <Text className="text-xl font-extrabold text-[#D32F2F] mb-1">IT VERTEX</Text>
            <Text className="text-xs text-slate-500 text-center">ระบบจัดการร้านซ่อมคอมพิวเตอร์</Text>
          </View>

          <View className="border-t border-dashed border-slate-200 my-4 w-full" />

          <View className="flex-row justify-between px-1">
            <View>
              <Text className="text-[11px] text-slate-400 mb-0.5">เลขที่งานซ่อม</Text>
              <Text className="text-sm font-semibold text-slate-800">{job.job_number || '-'}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] text-slate-400 mb-0.5">วันที่</Text>
              <Text className="text-sm font-semibold text-slate-800">{formatDate(job.created_at)}</Text>
            </View>
          </View>

          <View className="border-t border-dashed border-slate-200 my-4 w-full" />

          {/* Customer & Device */}
          <View className="px-1">
            <Text className="text-sm font-bold text-[#D32F2F] mb-2.5">ข้อมูลลูกค้า & อุปกรณ์</Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1"><Text className="text-slate-400 font-medium">ชื่อลูกค้า:</Text> {job.customer_name || '-'}</Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1"><Text className="text-slate-400 font-medium">เบอร์โทร:</Text> {job.phone || '-'}</Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1"><Text className="text-slate-400 font-medium">อุปกรณ์:</Text> {job.device_type || '-'} {job.brand || ''} {job.model || ''}</Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1"><Text className="text-slate-400 font-medium">S/N:</Text> {job.serial_number || '-'}</Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1"><Text className="text-slate-400 font-medium">อาการเสีย:</Text> {job.symptoms || '-'}</Text>
          </View>

          <View className="border-t border-dashed border-slate-200 my-4 w-full" />

          {/* Items */}
          <View className="px-1">
            <Text className="text-sm font-bold text-[#D32F2F] mb-2.5">รายการบริการ / อะไหล่</Text>
            {items.length > 0 ? items.map((item: any, i: number) => (
              <View key={i} className="flex-row justify-between items-center mb-2">
                <Text className="text-[13px] text-slate-700 flex-1 pr-2">{i + 1}. {item.name || item.item_name || item.description || 'รายการ'}</Text>
                <Text className="text-[13px] font-semibold text-slate-800">{formatNumber(Number(item.price || item.unit_price) || 0)} ฿</Text>
              </View>
            )) : (
              <Text className="text-slate-400 text-[13px] text-center py-3">ยังไม่มีรายการ</Text>
            )}
          </View>

          <View className="border-t border-dashed border-slate-200 my-4 w-full" />

          {/* Totals */}
          <View className="px-1">
            <View className="flex-row justify-between items-center my-1">
              <Text className="text-[13px] text-slate-500">รวมเป็นเงิน</Text>
              <Text className="text-[13px] font-medium text-slate-800">{formatNumber(subtotal)} บาท</Text>
            </View>
            <View className="flex-row justify-between items-center my-1">
              <Text className="text-[13px] text-slate-500">ภาษีมูลค่าเพิ่ม (VAT 7%)</Text>
              <Text className="text-[13px] font-medium text-slate-800">{formatNumber(vat)} บาท</Text>
            </View>
            <View className="flex-row justify-between items-center bg-red-50 p-3 rounded-lg mt-2">
              <Text className="text-[15px] font-bold text-[#D32F2F]">ยอดชำระสุทธิ</Text>
              <Text className="text-lg font-bold text-[#D32F2F]">{formatNumber(grandTotal)} บาท</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="w-full gap-3 pb-8">
          {!isPaid && (
            <TouchableOpacity
              className="bg-green-600 py-3.5 rounded-xl items-center flex-row justify-center shadow-sm shadow-green-600/20 elevation-2"
              onPress={handleConfirmPayment}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" className="mr-2" />
              <Text className="text-white text-[15px] font-bold">ยืนยันการชำระเงิน</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-[#D32F2F] py-3.5 rounded-xl items-center flex-row justify-center shadow-sm shadow-[#D32F2F]/20 elevation-2"
            onPress={printToPDF}
          >
            <Ionicons name="print-outline" size={20} color="#fff" className="mr-2" />
            <Text className="text-white text-[15px] font-bold">พิมพ์ใบเสร็จ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-violet-600 py-3.5 rounded-xl items-center flex-row justify-center shadow-sm shadow-violet-600/20 elevation-2"
            onPress={shareAsText}
          >
            <Ionicons name="share-outline" size={20} color="#fff" className="mr-2" />
            <Text className="text-white text-[15px] font-bold">แชร์เป็นข้อความ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
