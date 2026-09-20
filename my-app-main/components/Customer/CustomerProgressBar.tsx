// 1. React & React Native
import { View, Text } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

const NORMAL_STEPS = [
  'รับเครื่อง',
  'ตรวจเช็ค',
  'เสนอราคา',
  'รอซ่อม',
  'รอชำระ',
  'เสร็จสิ้น',
];

const CANCELLED_STEPS = [
  'รับเครื่อง',
  'ตรวจเช็ค',
  'เสนอราคา',
  'ยกเลิกซ่อม',
  'รอชำระ',
  'เสร็จสิ้น',
];

// Mapping status to step index
const getStepIndex = (status: string, statusId?: number) => {
  // DB status_id:
  // 1=รอตรวจเช็ค, 2=ดำเนินการตรวจเช็ค, 3=ดำเนินการเสนอราคา, 4=รอการอนุมัติ,
  // 5=อนุมัติแล้ว/รอซ่อม, 9=ยกเลิกซ่อม, 7=รอชำระ, 8=เสร็จสิ้น
  if (statusId === 1) return 0; // รับเครื่อง
  if (statusId === 2) return 1; // ตรวจเช็ค
  if (statusId === 3 || statusId === 4) return 2; // เสนอราคา / รอการอนุมัติ
  if (statusId === 5 || statusId === 6) return 3; // อนุมัติแล้ว/รอซ่อม
  if (statusId === 9) return 3; // ยกเลิกซ่อม (ขั้นตอนเดียวกับรอซ่อม แต่อยู่ใน flow ยกเลิก)
  if (statusId === 7) return 4; // รอชำระ (ค่าตรวจเช็ค 300 หรือค่าซ่อม)
  if (statusId === 8) return 5; // เสร็จสิ้น
  
  // Fallback by name
  if (status?.includes('เสร็จ') || status?.includes('ชำระแล้ว')) return 5;
  if (status?.includes('รอชำระ')) return 4;
  if (status?.includes('ยกเลิก')) return 3;
  if (status?.includes('อนุมัติ') || status?.includes('ซ่อม')) return 3;
  if (status?.includes('เสนอ')) return 2;
  if (status?.includes('เช็ค')) return 1;
  return 0;
};

interface CustomerProgressBarProps {
  status: string;
  statusId?: number;
  isCancelled?: boolean;
}

export default function CustomerProgressBar({ status, statusId, isCancelled }: CustomerProgressBarProps) {
  const isJobCancelled = Boolean(
    isCancelled || 
    statusId === 9 || 
    status?.includes('ยกเลิก')
  );

  const steps = isJobCancelled ? CANCELLED_STEPS : NORMAL_STEPS;
  const currentIndex = getStepIndex(status, statusId);

  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100">
      <Text className="text-base font-bold text-slate-800 mb-6 font-heading">ความคืบหน้า</Text>
      
      <View className="flex-row justify-between items-center relative px-2">
        {/* Background Line */}
        <View className="absolute left-6 right-6 h-0.5 bg-slate-200 top-3" />
        
        {/* Active Line */}
        <View 
          className="absolute left-6 h-0.5 bg-red-600 top-3" 
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCancelStep = step === 'ยกเลิกซ่อม';
          
          return (
            <View key={step} className="items-center z-10" style={{ width: 46 }}>
              <View 
                className={`w-6 h-6 rounded-full items-center justify-center mb-2 ${
                  isActive 
                    ? (isCancelStep ? 'bg-rose-500' : 'bg-red-600') 
                    : 'bg-slate-200'
                }`}
              >
                {isActive ? (
                  isCancelStep ? (
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  )
                ) : (
                  <Text className="text-slate-500 text-[10px] font-bold">{index + 1}</Text>
                )}
              </View>
              <Text 
                className={`text-[9px] text-center font-body ${
                  isActive 
                    ? (isCancelStep ? 'text-rose-600 font-bold' : 'text-red-600 font-bold') 
                    : 'text-slate-400'
                }`}
                numberOfLines={1}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
