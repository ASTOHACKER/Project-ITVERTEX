// 1. React & React Native
import { Text, View } from 'react-native';

interface DeviceInfoCardProps {
  deviceType?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  symptoms?: string;
  actualSymptom?: string;
  technicianName?: string;
  inspectorName?: string;
  repairerName?: string;
  accessories?: string;
  password?: string;
  importantSoftware?: string;
  warrantyInfo?: string;
}

export default function DeviceInfoCard({
  deviceType,
  brand,
  model,
  serialNumber,
  symptoms,
  actualSymptom,
  technicianName,
  inspectorName,
  repairerName,
  accessories,
  password,
  importantSoftware,
  warrantyInfo,
}: DeviceInfoCardProps) {
  const brandModel = [brand, model].filter(Boolean).join(' / ') || '-';
  const deviceLabel = deviceType || '-';
  const activeInspector = inspectorName || technicianName || '-';

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2 ml-1">
        <View className="w-1 h-4 bg-[#D32F2F] mr-2 rounded-sm" />
        <Text className="text-sm font-bold text-[#D32F2F]">ข้อมูลอุปกรณ์ (DEVICE)</Text>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/5 elevation-2">
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">ประเภทอุปกรณ์</Text>
          <Text className="text-sm text-slate-800 font-bold flex-[2] text-right">{deviceLabel}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">ยี่ห้อ / รุ่น</Text>
          <Text className="text-sm text-slate-800 font-bold flex-[2] text-right">{brandModel}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">Serial No.</Text>
          <Text className="text-sm text-slate-800 flex-[2] text-right">{serialNumber || '-'}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">รหัสผ่านเครื่อง</Text>
          <Text className="text-sm text-slate-800 flex-[2] text-right">{password || '-'}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">โปรแกรมสำคัญ</Text>
          <Text className="text-sm text-slate-800 flex-[2] text-right">{importantSoftware || '-'}</Text>
        </View>
        {warrantyInfo ? (
          <>
            <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
            <View className="flex-row justify-between py-2.5">
              <Text className="text-sm text-[#888888] flex-[1.2]">ประกันเครื่อง</Text>
              <Text className="text-sm text-slate-800 flex-[2] text-right">{warrantyInfo}</Text>
            </View>
          </>
        ) : null}
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">อาการที่แจ้ง</Text>
          <Text className="text-sm text-slate-800 flex-[2] text-right">{symptoms || '-'}</Text>
        </View>
        {actualSymptom ? (
          <>
            <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
            <View className="flex-row justify-between py-2.5 bg-amber-50/80 px-2 rounded-lg my-1 border border-amber-100">
              <Text className="text-sm font-bold text-amber-800 flex-[1.2]">อาการจริงหลังตรวจ</Text>
              <Text className="text-sm font-bold text-[#D32F2F] flex-[2] text-right">{actualSymptom}</Text>
            </View>
          </>
        ) : null}
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row justify-between py-2.5">
          <Text className="text-sm text-[#888888] flex-[1.2]">อุปกรณ์ที่ติดมาด้วย</Text>
          <Text className="text-sm text-slate-800 flex-[2] text-right">{accessories || '-'}</Text>
        </View>
      </View>
    </View>
  );
}
