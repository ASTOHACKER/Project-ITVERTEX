// 1. React & React Native
import { Text, View } from 'react-native';

interface DocumentInfoCardProps {
  jobNo: string;
  createdAt?: string;
  paymentDate?: string | null;
  returnDate?: string | null;
  receivedBy?: string;
  inspectorName?: string;
  repairerName?: string;
}

export default function DocumentInfoCard({
  jobNo,
  createdAt,
  paymentDate,
  returnDate,
  receivedBy,
  inspectorName,
  repairerName,
}: DocumentInfoCardProps) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr || dateStr === '-' || dateStr === 'undefined' || dateStr === 'null') return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm shadow-black/5 elevation-2">
      {/* เลขที่ใบรับซ่อม */}
      <View className="flex-row justify-between py-2.5">
        <Text className="text-sm text-[#888888] flex-[1.2]">เลขที่ใบรับซ่อม</Text>
        <Text className="text-sm text-slate-800 font-bold flex-[2] text-right">{jobNo}</Text>
      </View>

      <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />

      {/* 1. วันที่รับเครื่องมา (วันที่สร้างใบซ่อม) */}
      <View className="flex-row justify-between py-2.5">
        <Text className="text-sm text-[#888888] flex-[1.2]">วันที่รับเครื่องมา</Text>
        <Text className="text-sm text-slate-800 flex-[2] text-right font-medium">{formatDate(createdAt)}</Text>
      </View>

      <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />

      {/* 2. วันที่ชำระ (วันที่พนักงานยืนยันการชำระ) */}
      <View className="flex-row justify-between py-2.5">
        <Text className="text-sm text-[#888888] flex-[1.2]">วันที่ชำระ</Text>
        <Text className="text-sm text-slate-800 flex-[2] text-right font-medium">{formatDate(paymentDate)}</Text>
      </View>

      <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />

      {/* 3. วันรับเครื่องคืน (วันที่ลูกค้าเซ็นลายเซ็น) */}
      <View className="flex-row justify-between py-2.5">
        <Text className="text-sm text-[#888888] flex-[1.2]">วันรับเครื่องคืน</Text>
        <Text className="text-sm text-slate-800 flex-[2] text-right font-medium">{formatDate(returnDate)}</Text>
      </View>

      <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />

      {/* บุคลากรที่ดูแล */}
      <View className="flex-row justify-between py-2.5">
        <Text className="text-sm text-[#888888] flex-[1.2]">คนรับเครื่อง (พนักงาน)</Text>
        <Text className="text-sm text-slate-800 font-medium flex-[2] text-right">{receivedBy || '-'}</Text>
      </View>

      <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />

      <View className="flex-row justify-between py-2.5">
        <Text className="text-sm text-[#888888] flex-[1.2]">คนตรวจเครื่อง (ช่าง)</Text>
        <Text className="text-sm text-slate-800 font-medium flex-[2] text-right">{inspectorName || '-'}</Text>
      </View>

      <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />

      <View className="flex-row justify-between py-2.5">
        <Text className="text-sm text-[#888888] flex-[1.2]">คนซ่อมเครื่อง (ช่าง)</Text>
        <Text className="text-sm text-slate-800 font-medium flex-[2] text-right">{repairerName || '-'}</Text>
      </View>
    </View>
  );
}
