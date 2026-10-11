// 1. React & React Native
import { Text, View } from 'react-native';

interface DeviceInfoCardProps {
  deviceType?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  symptoms?: string | null;
  actualSymptom?: string | null;
  accessories?: string | null;
  password?: string | null;
  importantSoftware?: string | null;
  warrantyInfo?: string | null;
}

export default function DeviceInfoCard({
  deviceType,
  brand,
  model,
  serialNumber,
  symptoms,
  actualSymptom,
  accessories,
  password,
  importantSoftware,
  warrantyInfo,
}: DeviceInfoCardProps) {
  const formatBrandModel = (b?: string | null, m?: string | null) => {
    const brandStr = (b || '').trim();
    const modelStr = (m || '').trim();
    if (brandStr.includes('ประกอบเอง') || brandStr.includes('Custom PC')) {
      if (!modelStr || modelStr.includes('สเปกประกอบเอง') || modelStr.includes('ไม่ระบุ')) {
        return 'คอมพิวเตอร์ประกอบเอง (Custom PC)';
      }
      return `ประกอบเอง (Custom PC) ${modelStr}`;
    }
    return [brandStr, modelStr].filter(Boolean).join(' / ') || '-';
  };

  const brandModel = formatBrandModel(brand, model);
  const deviceLabel = deviceType || '-';

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2 ml-1">
        <View className="w-1 h-4 bg-[#D32F2F] mr-2 rounded-sm" />
        <Text className="text-sm font-bold text-[#D32F2F]">ข้อมูลอุปกรณ์ (DEVICE)</Text>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-sm shadow-black/5 elevation-2">
        <View className="flex-row items-center justify-between py-2.5">
          <Text className="text-sm text-slate-500 shrink-0 mr-3">ประเภทอุปกรณ์</Text>
          <Text className="text-sm text-slate-900 font-bold flex-1 text-right">{deviceLabel}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row items-center justify-between py-2.5">
          <Text className="text-sm text-slate-500 shrink-0 mr-3">ยี่ห้อ / รุ่น</Text>
          <Text className="text-sm text-slate-900 font-bold flex-1 text-right leading-5">{brandModel}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row items-center justify-between py-2.5">
          <Text className="text-sm text-slate-500 shrink-0 mr-3">Serial No.</Text>
          <Text className="text-sm text-slate-800 flex-1 text-right">{serialNumber || '-'}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row items-center justify-between py-2.5">
          <Text className="text-sm text-slate-500 shrink-0 mr-3">รหัสผ่านเครื่อง</Text>
          <Text className="text-sm text-slate-800 flex-1 text-right">{password || '-'}</Text>
        </View>
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row items-center justify-between py-2.5">
          <Text className="text-sm text-slate-500 shrink-0 mr-3">โปรแกรมสำคัญ</Text>
          <Text className="text-sm text-slate-800 flex-1 text-right leading-5">{importantSoftware || '-'}</Text>
        </View>
        {warrantyInfo ? (
          <>
            <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
            <View className="flex-row items-center justify-between py-2.5">
              <Text className="text-sm text-slate-500 shrink-0 mr-3">ประกันเครื่อง</Text>
              <Text className="text-sm text-slate-800 flex-1 text-right">{warrantyInfo}</Text>
            </View>
          </>
        ) : null}
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row items-start justify-between py-2.5">
          <Text className="text-sm text-slate-500 shrink-0 mr-3">อาการที่แจ้ง</Text>
          <Text className="text-sm text-slate-800 flex-1 text-right leading-5">{symptoms || '-'}</Text>
        </View>
        {actualSymptom ? (
          <>
            <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
            <View className="flex-row items-start justify-between py-2.5">
              <Text className="text-sm text-slate-500 shrink-0 mr-3">อาการจริงหลังตรวจ</Text>
              <Text className="text-sm font-semibold text-slate-900 flex-1 text-right leading-5">{actualSymptom}</Text>
            </View>
          </>
        ) : null}
        <View className="h-px border-t-[0.5px] border-slate-200 border-dashed" />
        <View className="flex-row items-start justify-between py-2.5">
          <Text className="text-sm text-slate-500 shrink-0 mr-3">อุปกรณ์ที่ติดมาด้วย</Text>
          <Text className="text-sm text-slate-800 flex-1 text-right leading-5">{accessories || '-'}</Text>
        </View>
      </View>
    </View>
  );
}
