// 1. React & React Native
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

// 3. Components & Types
import RepairItemRow from './RepairItemRow';
import type { RepairItem } from './types';

interface RepairStatusSectionProps {
  id?: string;
  statusId?: number;
  title: string;
  count: number;
  indicatorColor: string;
  items: RepairItem[];
  defaultExpanded?: boolean;
  onPressDetails?: (item: RepairItem) => void;
  onPressMakeQuote?: (item: RepairItem) => void;
  onPressVerifyQuote?: (item: RepairItem) => void;
  onPressSchedule?: (item: RepairItem) => void;
  onPressHandover?: (item: RepairItem) => void;
  onPressPaymentCheck?: (item: RepairItem) => void;
}

export default function RepairStatusSection({
  statusId,
  title,
  count,
  indicatorColor,
  items,
  defaultExpanded = false,
  onPressDetails,
  onPressMakeQuote,
  onPressVerifyQuote,
  onPressSchedule,
  onPressHandover,
  onPressPaymentCheck,
}: RepairStatusSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    if (count > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  const isActive = count > 0 && isExpanded;

  // 1. ช่าง: แสดงปุ่มสร้างใบเสนอราคา ในสถานะ 1 หรือ 2 (รอตรวจเช็ค / ดำเนินการตรวจเช็ค)
  const isTechnicianQuoting = Boolean(onPressMakeQuote) && (
    statusId === 1 ||
    statusId === 2 ||
    title.includes('ตรวจเช็ค')
  );

  // 2. พนักงาน: แสดงปุ่มตรวจสอบและส่งต่อใบเสนอราคา ในสถานะ 3 (ดำเนินการเสนอราคา)
  const isStaffVerifying = Boolean(onPressVerifyQuote) && (
    statusId === 3 ||
    title.includes('ดำเนินการเสนอราคา')
  );

  const showQuoteBtn = isTechnicianQuoting || isStaffVerifying;
  const quoteHandler = isTechnicianQuoting ? onPressMakeQuote : onPressVerifyQuote;

  // 3. พนักงาน: แสดงปุ่มส่งมอบเครื่องให้ลูกค้าเซ็น ในสถานะ 7 (รอชำระ)
  const showHandoverBtn = Boolean(onPressHandover) && (
    statusId === 7 ||
    title.includes('รอชำระ')
  );

  // 4. พนักงาน: แสดงปุ่มตรวจสอบชำระเงิน ในสถานะ 7 (รอชำระ)
  const showPaymentCheckBtn = Boolean(onPressPaymentCheck) && (
    statusId === 7 ||
    title.includes('รอชำระ')
  );


  return (
    <View className="mb-4">
      {/* Header Bar */}
      <TouchableOpacity
        className={`flex-row items-center justify-between h-11 px-3.5 rounded-xl border ${count > 0
            ? 'bg-white border-slate-200 shadow-sm shadow-black/5'
            : 'bg-slate-100/70 border-slate-200 opacity-60'
          } mb-2`}
        activeOpacity={count > 0 ? 0.7 : 1}
        onPress={toggleExpand}
      >
        <View className="flex-row items-center gap-2.5">
          <View
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: indicatorColor }}
          />
          <Text
            className={`text-sm ${count > 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-500'
              }`}
          >
            {title}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View
            className={`px-2 py-0.5 rounded-full ${count > 0 ? 'bg-slate-100' : 'bg-slate-200'
              }`}
          >
            <Text
              className={`text-xs font-bold ${count > 0 ? 'text-slate-800' : 'text-slate-400'
                }`}
            >
              {count}
            </Text>
          </View>
          {count > 0 && (
            <Ionicons
              name={isActive ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#64748B"
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Items */}
      {isActive && (
        <View className="pt-1">
          {items.map((item) => (
            <RepairItemRow
              key={item.id}
              item={item}
              statusColor={indicatorColor}
              showQuoteBtn={showQuoteBtn}
              showHandoverBtn={showHandoverBtn}
              showPaymentCheckBtn={showPaymentCheckBtn}
              onPressDetails={onPressDetails}
              onPressMakeQuote={quoteHandler}
              onPressHandover={onPressHandover}
              onPressPaymentCheck={onPressPaymentCheck}
            />
          ))}
        </View>
      )}
    </View>
  );
}
