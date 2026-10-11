// 1. React & React Native
import { View, Text } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

const NORMAL_STEPS = [
  'รับเครื่อง',
  'ตรวจเช็ค',
  'รออนุมัติ',
  'กำลังซ่อม',
  'รอชำระ',
  'รอมารับ',
  'เสร็จสิ้น',
];

const CANCELLED_STEPS = [
  'รับเครื่อง',
  'ตรวจเช็ค',
  'รออนุมัติ',
  'ยกเลิกซ่อม',
  'รอชำระ',
  'รอมารับ',
  'เสร็จสิ้น',
];

// Mapping status to step index
const getStepIndex = (status: string, statusId?: number | string) => {
  const numId = Number(statusId);
  if (numId === 1) return 0; // รับเครื่อง
  if (numId === 2 || numId === 3) return 1; // ตรวจเช็ค / เสนอราคา
  if (numId === 4) return 2; // รออนุมัติ
  if (numId === 5) return 3; // กำลังซ่อม
  if (numId === 9) return 3; // ยกเลิกซ่อม
  if (numId === 7) return 4; // รอชำระ
  if (numId === 6) return 5; // รอลูกค้ามารับเครื่อง
  if (numId === 8) return 6; // เสร็จสิ้น
  
  // Fallback by name
  const s = status || '';
  if (s.includes('เสร็จ') || s.includes('ส่งมอบ') || s.includes('ชำระแล้ว')) return 6;
  if (s.includes('มารับ') || s.includes('พร้อมรับ')) return 5;
  if (s.includes('รอชำระ')) return 4;
  if (s.includes('อนุมัติแล้ว') || s.includes('รอซ่อม') || s.includes('ซ่อม')) return 3;
  if (s.includes('ยกเลิก')) return 3;
  if (s.includes('รออนุมัติ') || s.includes('รอการอนุมัติ') || s.includes('เสนอราคา')) return 2;
  if (s.includes('เช็ค') || s.includes('ตรวจ')) return 1;
  return 0;
};

interface CustomerProgressBarProps {
  status: string;
  statusId?: number | string;
  isCancelled?: boolean;
}

const getStatusColor = (statusId: number, statusText: string, isJobCancelled: boolean, isCompletedJob: boolean) => {
  if (isJobCancelled) return '#EF4444';
  if (isCompletedJob) return '#10B981';
  if (statusId === 6 || statusText.includes('มารับ') || statusText.includes('พร้อมรับ')) return '#0EA5E9';
  if (statusId === 7 || statusText.includes('รอชำระ')) return '#EAB308';
  if (statusId === 4 || statusText.includes('รออนุมัติ') || statusText.includes('รอการอนุมัติ')) return '#A855F7';
  if (statusId === 5 || statusText.includes('อนุมัติแล้ว') || statusText.includes('กำลังซ่อม') || statusText.includes('รอซ่อม') || statusText.includes('ซ่อม')) return '#6366F1';
  if (statusId === 2 || statusId === 3 || statusText.includes('เช็ค') || statusText.includes('เสนอราคา')) return '#D97706';
  return '#10B981';
};

const getStatusExplanation = (statusId: number, statusText: string, isJobCancelled: boolean = false) => {
  const id = Number(statusId);
  const s = statusText || '';

  if (isJobCancelled || id === 9 || s.includes('ยกเลิก')) {
    if (id === 8 || s.includes('เสร็จ') || s.includes('ส่งมอบ')) {
      return {
        title: 'ส่งมอบเครื่องคืนเรียบร้อย (ยกเลิกการซ่อม)',
        desc: 'ชำระค่าบริการตรวจเช็คสภาพเครื่องและส่งมอบเครื่องคืนเรียบร้อยแล้ว ขอบคุณที่ไว้วางใจใช้บริการกับเรา',
        icon: 'checkmark-done-circle',
        next: 'ปิดงานยกเลิกสมบูรณ์',
      };
    }
    return {
      title: 'ยกเลิกการซ่อมเรียบร้อย',
      desc: 'งานซ่อมนี้ถูกยกเลิกแล้ว ท่านสามารถติดต่อรับเครื่องคืนได้ที่ศูนย์บริการ พร้อมชำระค่าบริการตรวจเช็คสภาพเครื่อง (300 บาท)',
      icon: 'close-circle',
      next: 'ติดต่อรับเครื่องคืนที่ร้าน',
    };
  }

  if (id === 8 || s.includes('เสร็จ') || s.includes('ส่งมอบ')) {
    return {
      title: 'ส่งมอบเครื่องเสร็จสิ้นแล้ว',
      desc: 'อุปกรณ์ได้รับการซ่อมแซม ทดสอบระบบ และส่งมอบให้แก่ท่านเรียบร้อยแล้ว ขอบคุณที่ไว้วางใจใช้บริการกับเรา',
      icon: 'checkmark-done-circle',
      next: 'ปิดงานซ่อมเรียบร้อย',
    };
  }
  if (id === 6 || s.includes('มารับ') || s.includes('พร้อมรับ')) {
    return {
      title: 'เครื่องซ่อมเสร็จแล้ว พร้อมให้มารับ',
      desc: 'การซ่อมและชำระเงินเสร็จสมบูรณ์ อุปกรณ์พร้อมส่งมอบ สามารถนำหลักฐานหรือแจ้งรหัสงานเพื่อรับเครื่องได้เลย',
      icon: 'cube',
      next: 'ลูกค้ารับเครื่องและตรวจเช็คความเรียบร้อย',
    };
  }
  if (id === 7 || s.includes('รอชำระ')) {
    return {
      title: 'การซ่อมเสร็จสิ้น — รอชำระเงิน',
      desc: 'ช่างได้ดำเนินการซ่อมแซมและทดสอบอุปกรณ์เรียบร้อยแล้ว กรุณาตรวจสอบยอดและแจ้งชำระเงินเพื่อเตรียมรับเครื่อง',
      icon: 'card',
      next: 'ชำระเงินเพื่อรับเครื่อง',
    };
  }
  if (id === 4 || s.includes('รออนุมัติ') || s.includes('รอการอนุมัติ')) {
    return {
      title: 'รอการอนุมัติใบเสนอราคาจากคุณ',
      desc: 'ช่างได้ประเมินราคาอะไหล่และค่าบริการเรียบร้อยแล้ว กรุณาตรวจสอบรายละเอียดใบเสนอราคาด้านล่างและกดยืนยันการซ่อม',
      icon: 'receipt',
      next: 'ลูกค้ายืนยันอนุมัติการซ่อม',
    };
  }
  if (id === 5 || s.includes('อนุมัติแล้ว') || s.includes('กำลังซ่อม') || s.includes('รอซ่อม') || s.includes('ซ่อม')) {
    return {
      title: 'กำลังดำเนินการซ่อมแซม',
      desc: 'ใบเสนอราคาได้รับการอนุมัติเรียบร้อย ช่างเทคโนโลยีกำลังดำเนินการเปลี่ยนอะไหล่และทดสอบระบบตามมาตรฐาน',
      icon: 'hammer',
      next: 'ทดสอบระบบและสรุปยอดชำระ',
    };
  }
  if (id === 3 || s.includes('เสนอราคา')) {
    return {
      title: 'กำลังจัดทำใบเสนอราคา',
      desc: 'ช่างตรวจเช็คสภาพเครื่องเสร็จสิ้นแล้ว อยู่ระหว่างการสรุปรายการอะไหล่และคำนวณค่าบริการเพื่อให้ท่านพิจารณา',
      icon: 'calculator',
      next: 'ออกใบเสนอราคาให้ลูกค้าอนุมัติ',
    };
  }
  if (id === 2 || s.includes('ดำเนินการตรวจเช็ค') || s.includes('ตรวจเช็ค')) {
    return {
      title: 'ช่างกำลังดำเนินการตรวจเช็คเครื่อง',
      desc: 'ช่างเทคโนโลยีกำลังตรวจสอบอาการเสีย วิเคราะห์หาสาเหตุที่แท้จริง และทดสอบการทำงานของชิ้นส่วนต่างๆ อย่างละเอียด',
      icon: 'search',
      next: 'สรุปผลตรวจเช็คและจัดทำใบเสนอราคา',
    };
  }
  return {
    title: 'รับเครื่องเข้าระบบเรียบร้อย',
    desc: 'เจ้าหน้าที่ได้รับอุปกรณ์และบันทึกอาการเสียเข้าระบบแล้ว กำลังส่งต่อให้ช่างเทคนิคเริ่มการตรวจเช็คตามลำดับคิว',
    icon: 'clipboard',
    next: 'ช่างเริ่มดำเนินการตรวจเช็ค',
  };
};

export default function CustomerProgressBar({ status, statusId, isCancelled }: CustomerProgressBarProps) {
  const numStatusId = Number(statusId);
  const statusStr = status || '';
  const isCompletedJob = numStatusId === 8 || statusStr.includes('เสร็จ') || statusStr.includes('ส่งมอบ');
  const isJobCancelled = Boolean(
    isCancelled || 
    numStatusId === 9 || 
    statusStr.includes('ยกเลิก')
  );

  const steps = isJobCancelled ? CANCELLED_STEPS : NORMAL_STEPS;
  const count = steps.length;
  const currentIndex = isCompletedJob ? count - 1 : getStepIndex(status, statusId);
  const activeColor = getStatusColor(numStatusId, statusStr, isJobCancelled, isCompletedJob);
  const explainer = getStatusExplanation(numStatusId, statusStr, isJobCancelled);

  return (
    <View className="bg-white rounded-3xl p-4 mb-4 shadow-sm border border-slate-200/80">
      {/* Spotlight Header */}
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-row items-center gap-2">
          <View
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: activeColor }}
          />
          <Text className="text-sm font-bold text-slate-800 font-heading">
            {isCompletedJob
              ? 'ส่งมอบเครื่องเสร็จสิ้น'
              : isJobCancelled
              ? 'ยกเลิกการซ่อม'
              : `ขั้นตอนที่ ${currentIndex + 1}/${count}: ${steps[currentIndex]}`}
          </Text>
        </View>
      </View>
      
      {/* 7-Stage Stepper Track - Vertically centered via flexbox */}
      <View className="w-full py-1">
        <View className="flex-row items-start justify-between">
          {steps.map((step, index) => {
            const isPassed = index < currentIndex;
            const isCurrent = !isCompletedJob && index === currentIndex;
            const isDone = isCompletedJob || isPassed;
            const isCancelStep = isJobCancelled && step === 'ยกเลิกซ่อม';

            const hasLeftLine = index > 0;
            const isLeftLineActive = isCompletedJob || index <= currentIndex;

            const hasRightLine = index < count - 1;
            const isRightLineActive = isCompletedJob || index < currentIndex;

            return (
              <View key={step} className="items-center flex-1">
                {/* Circle and connecting segments: 100% vertically centered via flexbox */}
                <View className="w-full h-6 flex-row items-center justify-center">
                  {/* Left line segment */}
                  <View
                    className="flex-1 h-[2.5px]"
                    style={{
                      backgroundColor: !hasLeftLine
                        ? 'transparent'
                        : isLeftLineActive
                        ? activeColor
                        : '#E2E8F0',
                    }}
                  />

                  {/* Circle Node */}
                  <View className="items-center justify-center z-10">
                    {isDone ? (
                      <View className="w-5 h-5 rounded-full bg-emerald-500 items-center justify-center border-2 border-white shadow-xs">
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      </View>
                    ) : isCurrent ? (
                      <View
                        className="w-[22px] h-[22px] rounded-full items-center justify-center border-2 border-white shadow-xs"
                        style={{
                          backgroundColor: activeColor,
                        }}
                      >
                        {isCancelStep ? (
                          <Ionicons name="close" size={12} color="#FFFFFF" />
                        ) : (
                          <View className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </View>
                    ) : (
                      <View className="w-3.5 h-3.5 rounded-full bg-slate-200 border-2 border-white" />
                    )}
                  </View>

                  {/* Right line segment */}
                  <View
                    className="flex-1 h-[2.5px]"
                    style={{
                      backgroundColor: !hasRightLine
                        ? 'transparent'
                        : isRightLineActive
                        ? activeColor
                        : '#E2E8F0',
                    }}
                  />
                </View>

                {/* Step label text */}
                <Text
                  className={`text-[8.5px] mt-1.5 font-body text-center leading-tight ${
                    isCurrent
                      ? 'font-bold'
                      : isDone
                      ? 'font-medium text-slate-700'
                      : 'text-slate-400'
                  }`}
                  style={isCurrent ? { color: activeColor } : undefined}
                  numberOfLines={1}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Current Step Status Explainer Briefing */}
      <View className="mt-3.5 pt-3 border-t border-slate-100 flex-row items-start gap-2.5">
        <View
          className="w-8 h-8 rounded-xl items-center justify-center mt-0.5 border"
          style={{
            backgroundColor: `${activeColor}15`,
            borderColor: `${activeColor}30`,
          }}
        >
          <Ionicons name={explainer.icon as any} size={16} color={activeColor} />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold font-heading text-slate-800">
            {explainer.title}
          </Text>
          <Text className="text-[11.5px] text-slate-500 font-body mt-0.5 leading-4">
            {explainer.desc}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-2">
            <Text className="text-[10.5px] font-bold text-slate-400 font-body">ขั้นตอนถัดไป:</Text>
            <View className="bg-slate-100 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-medium text-slate-600 font-body">
                {explainer.next}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

