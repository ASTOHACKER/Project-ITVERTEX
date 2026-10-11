import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/theme';
import type { QuotationFilter } from '@/types/quotation';

interface QuotationFilterTabsProps {
  activeFilter: QuotationFilter;
  setActiveFilter: (filter: QuotationFilter) => void;
  totalCount: number;
  countRejected: number;
  countPending: number;
  countApproved: number;
  countCancelled: number;
}

export default function QuotationFilterTabs({
  activeFilter,
  setActiveFilter,
  totalCount,
  countRejected,
  countPending,
  countApproved,
  countCancelled,
}: QuotationFilterTabsProps) {
  return (
    <View className="mb-2 -mt-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 12, paddingVertical: 2 }}
      >
        {/* Tab: ทั้งหมด */}
        <TouchableOpacity
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.7}
          style={{ minHeight: 44, justifyContent: 'center' }}
          className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${activeFilter === 'all'
              ? 'bg-slate-900 border-slate-900 shadow-sm'
              : 'bg-white border-slate-200'
            }`}
        >
          <Text
            className={`text-xs font-bold font-heading ${activeFilter === 'all' ? 'text-white' : 'text-slate-700'
              }`}
          >
            ทั้งหมด
          </Text>
          <View
            className={`px-1.5 py-0.2 rounded-full ${activeFilter === 'all' ? 'bg-slate-700' : 'bg-slate-100'
              }`}
          >
            <Text
              className={`text-[10px] font-bold ${activeFilter === 'all' ? 'text-white' : 'text-slate-600'
                }`}
            >
              {totalCount}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tab: ขอแก้ไข */}
        <TouchableOpacity
          onPress={() => setActiveFilter('rejected')}
          activeOpacity={0.7}
          style={{ minHeight: 44, justifyContent: 'center' }}
          className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${activeFilter === 'rejected'
              ? 'bg-amber-600 border-amber-600 shadow-sm'
              : countRejected > 0
                ? 'bg-amber-50 border-amber-300'
                : 'bg-white border-slate-200'
            }`}
        >
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: activeFilter === 'rejected' ? '#FFFFFF' : '#D97706' }}
          />
          <Text
            className={`text-xs font-bold font-heading ${activeFilter === 'rejected'
                ? 'text-white'
                : countRejected > 0
                  ? 'text-amber-900'
                  : 'text-slate-700'
              }`}
          >
            ขอแก้ไข
          </Text>
          <View
            className={`px-1.5 py-0.2 rounded-full ${activeFilter === 'rejected'
                ? 'bg-black/20'
                : countRejected > 0
                  ? 'bg-amber-200/70'
                  : 'bg-slate-100'
              }`}
          >
            <Text
              className={`text-[10px] font-bold ${activeFilter === 'rejected'
                  ? 'text-white'
                  : countRejected > 0
                    ? 'text-amber-950'
                    : 'text-slate-600'
                }`}
            >
              {countRejected}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tab: รออนุมัติ */}
        <TouchableOpacity
          onPress={() => setActiveFilter('pending')}
          activeOpacity={0.7}
          className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${activeFilter === 'pending' ? 'shadow-sm' : 'bg-white border-slate-200'
            }`}
          style={
            activeFilter === 'pending'
              ? {
                backgroundColor: Colors.status.status4,
                borderColor: Colors.status.status4,
                minHeight: 44,
                justifyContent: 'center',
              }
              : { minHeight: 44, justifyContent: 'center' }
          }
        >
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: activeFilter === 'pending' ? '#FFFFFF' : Colors.status.status4 }}
          />
          <Text
            className={`text-xs font-bold font-heading ${activeFilter === 'pending' ? 'text-white' : 'text-slate-700'
              }`}
          >
            รออนุมัติ
          </Text>
          <View
            className={`px-1.5 py-0.2 rounded-full ${activeFilter === 'pending' ? 'bg-black/20' : 'bg-slate-100'
              }`}
          >
            <Text
              className={`text-[10px] font-bold ${activeFilter === 'pending' ? 'text-white' : 'text-slate-600'
                }`}
            >
              {countPending}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tab: อนุมัติแล้ว */}
        <TouchableOpacity
          onPress={() => setActiveFilter('approved')}
          activeOpacity={0.7}
          className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${activeFilter === 'approved' ? 'shadow-sm' : 'bg-white border-slate-200'
            }`}
          style={
            activeFilter === 'approved'
              ? {
                backgroundColor: Colors.status.status5,
                borderColor: Colors.status.status5,
                minHeight: 44,
                justifyContent: 'center',
              }
              : { minHeight: 44, justifyContent: 'center' }
          }
        >
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: activeFilter === 'approved' ? '#FFFFFF' : Colors.status.status5 }}
          />
          <Text
            className={`text-xs font-bold font-heading ${activeFilter === 'approved' ? 'text-white' : 'text-slate-700'
              }`}
          >
            อนุมัติแล้ว
          </Text>
          <View
            className={`px-1.5 py-0.2 rounded-full ${activeFilter === 'approved' ? 'bg-black/20' : 'bg-slate-100'
              }`}
          >
            <Text
              className={`text-[10px] font-bold ${activeFilter === 'approved' ? 'text-white' : 'text-slate-600'
                }`}
            >
              {countApproved}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Tab: ยกเลิก */}
        <TouchableOpacity
          onPress={() => setActiveFilter('cancelled')}
          activeOpacity={0.7}
          className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${activeFilter === 'cancelled' ? 'shadow-sm' : 'bg-white border-slate-200'
            }`}
          style={
            activeFilter === 'cancelled'
              ? {
                backgroundColor: Colors.status.status9,
                borderColor: Colors.status.status9,
                minHeight: 44,
                justifyContent: 'center',
              }
              : { minHeight: 44, justifyContent: 'center' }
          }
        >
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: activeFilter === 'cancelled' ? '#FFFFFF' : Colors.status.status9 }}
          />
          <Text
            className={`text-xs font-bold font-heading ${activeFilter === 'cancelled' ? 'text-white' : 'text-slate-700'
              }`}
          >
            ยกเลิก
          </Text>
          <View
            className={`px-1.5 py-0.2 rounded-full ${activeFilter === 'cancelled' ? 'bg-black/20' : 'bg-slate-100'
              }`}
          >
            <Text
              className={`text-[10px] font-bold ${activeFilter === 'cancelled' ? 'text-white' : 'text-slate-600'
                }`}
            >
              {countCancelled}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
