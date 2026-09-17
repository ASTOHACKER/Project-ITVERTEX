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

  // Button visibility driven by statusId only (labels may change, IDs are stable)
  const isTechnicianQuoting = Boolean(onPressMakeQuote) && (statusId === 1 || statusId === 2);

  // 2. พนักงาน: แสดงปุ่มตรวจสอบและส่งต่อใบเสนอราคา ในสถานะ 3
  const isStaffVerifying = Boolean(onPressVerifyQuote) && statusId === 3;

  const showQuoteBtn = isTechnicianQuoting || isStaffVerifying;
  const quoteHandler = isTechnicianQuoting ? onPressMakeQuote : onPressVerifyQuote;

  // 3-4. พนักงาน: ส่งมอบ + ตรวจชำระ ในสถานะ 7
  const showHandoverBtn = Boolean(onPressHandover) && statusId === 7;
  const showPaymentCheckBtn = Boolean(onPressPaymentCheck) && statusId === 7;


  return (
    <View className="mb-4">
      {/* Header Bar — 48px touch target, clearer count */}
      <TouchableOpacity
        className={`flex-row items-center justify-between min-h-[48px] px-4 rounded-2xl border ${count > 0
            ? 'bg-white border-slate-200 shadow-sm shadow-black/5'
            : 'bg-slate-100/70 border-slate-200 opacity-60'
          } mb-2`}
        activeOpacity={count > 0 ? 0.7 : 1}
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={`${title} ${count} รายการ`}
      >
        <View className="flex-row items-center gap-2.5">
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: indicatorColor }}
          />
          <Text
            className={`text-[15px] ${count > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
              }`}
          >
            {title}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View
            className={`px-2.5 py-1 rounded-full ${count > 0 ? 'bg-slate-900' : 'bg-slate-200'
              }`}
          >
            <Text
              className={`text-xs font-bold ${count > 0 ? 'text-white' : 'text-slate-400'
                }`}
            >
              {count}
            </Text>
          </View>
          {count > 0 && (
            <Ionicons
              name={isActive ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#475569"
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
              statusId={statusId}
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
