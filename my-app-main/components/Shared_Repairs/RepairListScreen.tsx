// 1. React & React Native
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';

// 3. Components
import Header from '@/components/Shared_Dashboard/Header';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import DatePickerModal from '@/components/ui/DatePickerModal';
import RepairStatusSection from '@/components/Shared_Repairs/RepairStatusSection';
import RepairDetailsModal from '@/components/Shared_Repairs/RepairDetailsModal';

// 4. Hooks & Types
import { useRepairJobs } from './useRepairJobs';
import type { RepairItem } from './types';

interface RepairListScreenProps {
  filterStatusIds?: number[];
  subtitle?: string;
  showHeader?: boolean;
  onPressDetails?: (item: RepairItem) => void;
  onPressMakeQuote?: (item: RepairItem) => void;
  onPressVerifyQuote?: (item: RepairItem) => void;
  onPressSchedule?: (item: RepairItem) => void;
  onPressHandover?: (item: RepairItem) => void;
  onPressPaymentCheck?: (item: RepairItem) => void;
  onOpenFullDocument?: (item: RepairItem) => void;
  defaultExpandAll?: boolean;
}

export default function RepairListScreen({
  filterStatusIds,
  subtitle = 'งานทั้งหมด',
  showHeader = true,
  onPressDetails: customOnPressDetails,
  onPressMakeQuote,
  onPressVerifyQuote,
  onPressSchedule,
  onPressHandover,
  onPressPaymentCheck,
  onOpenFullDocument,
  defaultExpandAll = false,
}: RepairListScreenProps) {
  const {
    isLoading,
    searchText,
    setSearchText,
    filterDate,
    setFilterDate,
    filteredGroups,
    refetch,
  } = useRepairJobs({ filterStatusIds });

  const [selectedItem, setSelectedItem] = useState<RepairItem | null>(null);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStatusTab, setSelectedStatusTab] = useState<number | 'all'>('all');
  const [hideEmptyStatuses, setHideEmptyStatuses] = useState(true);

  const totalJobsCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.items.length, 0);
  }, [filteredGroups]);

  const activeGroupsCount = useMemo(() => {
    return filteredGroups.filter((g) => g.items.length > 0).length;
  }, [filteredGroups]);

  const displayedGroups = useMemo(() => {
    if (selectedStatusTab !== 'all') {
      return filteredGroups.filter((g) => g.statusId === selectedStatusTab);
    }
    if (hideEmptyStatuses) {
      return filteredGroups.filter((g) => g.items.length > 0);
    }
    return filteredGroups;
  }, [filteredGroups, selectedStatusTab, hideEmptyStatuses]);

  const handlePressDetails = (item: RepairItem) => {
    if (customOnPressDetails) {
      customOnPressDetails(item);
    } else {
      setSelectedItem(item);
      setDetailsVisible(true);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <View className="flex-1 bg-slate-50">
      {showHeader && <Header title="IT VERTEX" subtitle={subtitle} />}

      <View className="flex-1 w-full max-w-4xl mx-auto p-4 pt-2">
        {/* Search & Date Filter Bar */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className="flex-1">
            <SearchFilterBar
              value={searchText}
              onChangeText={setSearchText}
              showFilter={false}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            className={`h-11 px-3 rounded-lg border flex-row items-center justify-center gap-1.5 -mt-4 ${
              filterDate
                ? 'bg-red-50 border-red-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={filterDate ? '#D32F2F' : '#64748B'}
            />
            <Text
              className={`text-xs font-bold ${
                filterDate ? 'text-red-700' : 'text-slate-600'
              }`}
            >
              {filterDate
                ? `${filterDate.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][filterDate.getMonth()]}`
                : 'เลือกวันที่'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Filter Active Chip */}
        {filterDate && (
          <View className="flex-row items-center justify-between bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="filter-circle" size={18} color="#D32F2F" />
              <Text className="text-xs text-red-800 font-medium font-body">
                กรองเฉพาะวันที่: {filterDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setFilterDate(null)}
              className="p-1"
            >
              <Ionicons name="close-circle" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Status Horizontal Filter Tabs */}
        <View className="mb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 10 }}
          >
            {/* Tab: All */}
            <TouchableOpacity
              onPress={() => setSelectedStatusTab('all')}
              activeOpacity={0.7}
              className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border ${
                selectedStatusTab === 'all'
                  ? 'bg-slate-900 border-slate-900 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-bold font-heading ${
                  selectedStatusTab === 'all' ? 'text-white' : 'text-slate-700'
                }`}
              >
                ทั้งหมด
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  selectedStatusTab === 'all' ? 'bg-slate-700' : 'bg-slate-100'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    selectedStatusTab === 'all' ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {totalJobsCount}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Tabs for each Status (กรองเฉพาะสถานะที่มีงานอยู่เพื่อความกระชับ) */}
            {filteredGroups
              .filter((group) => (hideEmptyStatuses ? group.items.length > 0 : true))
              .map((group) => {
              const isSelected = selectedStatusTab === group.statusId;
              const hasItems = group.items.length > 0;

              return (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setSelectedStatusTab(group.statusId)}
                  activeOpacity={0.7}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                    isSelected
                      ? 'border-transparent shadow-sm'
                      : hasItems
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: group.color }
                      : undefined
                  }
                >
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#FFFFFF' : group.color }}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      isSelected
                        ? 'text-white'
                        : hasItems
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {group.title}
                  </Text>
                  <View
                    className={`px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-black/20'
                        : hasItems
                        ? 'bg-slate-100'
                        : 'bg-slate-200/50'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        isSelected
                          ? 'text-white'
                          : hasItems
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {group.items.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sub-header Controls: Quick Count & Toggle Empty Statuses */}
        <View className="flex-row items-center justify-between pb-2 px-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs font-semibold text-slate-500">
              {selectedStatusTab === 'all'
                ? `พบงานซ่อมทั้งหมด ${totalJobsCount} รายการ`
                : `พบงานในสถานะนี้ ${displayedGroups[0]?.items.length || 0} รายการ`}
            </Text>
          </View>

          {selectedStatusTab === 'all' && (
            <TouchableOpacity
              onPress={() => setHideEmptyStatuses(!hideEmptyStatuses)}
              activeOpacity={0.7}
              className="flex-row items-center gap-1"
            >
              <Ionicons
                name={hideEmptyStatuses ? 'eye-off-outline' : 'eye-outline'}
                size={14}
                color="#64748B"
              />
              <Text className="text-[11px] font-medium text-slate-500">
                {hideEmptyStatuses
                  ? `ซ่อนสถานะว่าง (0)`
                  : `แสดงทุกสถานะ (${filteredGroups.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main List Area */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#D32F2F" />
            <Text className="mt-3 text-sm text-slate-500 font-body">
              กำลังโหลดรายการซ่อม...
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 90 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#D32F2F']}
              />
            }
          >
            {displayedGroups.map((group) => (
              <RepairStatusSection
                key={group.id}
                statusId={group.statusId}
                title={group.title}
                count={group.items.length}
                indicatorColor={group.color}
                items={group.items}
                defaultExpanded={
                  selectedStatusTab !== 'all' ||
                  defaultExpandAll ||
                  group.items.length > 0
                }
                onPressDetails={handlePressDetails}
                onPressMakeQuote={onPressMakeQuote}
                onPressVerifyQuote={onPressVerifyQuote}
                onPressSchedule={onPressSchedule}
                onPressHandover={onPressHandover}
                onPressPaymentCheck={onPressPaymentCheck}
              />
            ))}

            {displayedGroups.length === 0 ||
              (displayedGroups.every((g) => g.items.length === 0) && (
                <View className="py-16 items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 mt-2">
                  <View className="w-16 h-16 rounded-full bg-slate-50 items-center justify-center mb-3">
                    <Ionicons name="file-tray-outline" size={32} color="#94A3B8" />
                  </View>
                  <Text className="text-base font-bold text-slate-700 mb-1">
                    ไม่พบรายการซ่อม
                  </Text>
                  <Text className="text-xs text-slate-400 text-center px-6">
                    {searchText.trim() || filterDate
                      ? 'ไม่มีข้อมูลที่ตรงกับคำค้นหาหรือวันที่เลือก ลองปรับเงื่อนไขตัวกรองใหม่'
                      : 'ยังไม่มีงานซ่อมในสถานะนี้'}
                  </Text>
                  {(searchText.trim().length > 0 || filterDate !== null) && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchText('');
                        setFilterDate(null);
                        setSelectedStatusTab('all');
                      }}
                      className="mt-4 px-4 py-2 bg-slate-100 rounded-xl active:bg-slate-200"
                    >
                      <Text className="text-xs font-semibold text-slate-700">
                        ล้างตัวกรองทั้งหมด
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
          </ScrollView>
        )}
      </View>

      {/* Repair Details Modal */}
      <RepairDetailsModal
        visible={isDetailsVisible}
        item={selectedItem}
        onClose={() => {
          setDetailsVisible(false);
          setSelectedItem(null);
        }}
        onOpenFullDocument={
          onOpenFullDocument
            ? () => {
                if (selectedItem && onOpenFullDocument) {
                  onOpenFullDocument(selectedItem);
                }
              }
            : undefined
        }
      />

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        selectedDate={filterDate}
        onSelectDate={(date) => setFilterDate(date)}
        onClose={() => setShowDatePicker(false)}
      />
    </View>
  );
}
