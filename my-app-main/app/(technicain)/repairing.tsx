// 1. React & React Native
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

// 3. API helpers
import { deleteQuotation, getQuotations } from '@/lib/api';

// 4. Components & Theme
import Header from '@/components/Shared_Dashboard/Header';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import CustomAlert from '@/components/ui/CustomAlert';
import QuotationDetailModal from '@/components/Technicain_detail/QuotationDetailModal';
import { Colors } from '@/constants/theme';

interface QuotationItem {
  quotation_id: number;
  job_id: number;
  quote_no: string;
  job_no: string;
  quote_status_id: number;
  quote_status_name: string;
  repair_status_id: number;
  repair_status_name: string;
  total_repair_price: string | number;
  total_cancel_price: string | number;
  customer_remark: string | null;
  customer_name: string;
  phone: string;
  email?: string;
  brand?: string;
  model?: string;
  device_type?: string;
  symptom_details?: string;
  actual_symptom?: string;
  total_parts: string | number;
  total_services: string | number;
  item_count: string | number;
  created_at: string;
}

export default function TechnicianQuotationScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'rejected' | 'pending' | 'approved' | 'cancelled'>('all');

  // Quotation Detail Modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingQuoteNo, setDeletingQuoteNo] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const loadQuotations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getQuotations();
      if (res?.success && Array.isArray(res.data)) {
        setQuotations(res.data);
      } else {
        setQuotations([]);
      }
    } catch (err: any) {
      console.error('Error loading quotations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadQuotations();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadQuotations(true);
  };

  // Filter count calculations
  const countRejected = quotations.filter(
    (q) => (q.quote_status_id === 5 || q.quote_status_id === 4 || (q.customer_remark && q.repair_status_id === 3))
  ).length;

  const countPending = quotations.filter((q) => q.quote_status_id === 1).length;
  const countApproved = quotations.filter((q) => q.quote_status_id === 2).length;
  const countCancelled = quotations.filter((q) => q.quote_status_id === 3).length;

  // Filter & Search logic
  const filteredQuotations = quotations.filter((item) => {
    if (activeFilter === 'rejected') {
      const isRejected = item.quote_status_id === 5 || item.quote_status_id === 4 || (item.customer_remark && item.repair_status_id === 3);
      if (!isRejected) return false;
    } else if (activeFilter === 'pending') {
      if (item.quote_status_id !== 1) return false;
    } else if (activeFilter === 'approved') {
      if (item.quote_status_id !== 2) return false;
    } else if (activeFilter === 'cancelled') {
      if (item.quote_status_id !== 3) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (item.quote_no || '').toLowerCase().includes(q) ||
      (item.job_no || '').toLowerCase().includes(q) ||
      (item.customer_name || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.model || '').toLowerCase().includes(q) ||
      (item.brand || '').toLowerCase().includes(q) ||
      (item.actual_symptom || '').toLowerCase().includes(q)
    );
  });

  const handlePromptDelete = (item: QuotationItem) => {
    setDeletingId(item.quotation_id);
    setDeletingQuoteNo(item.quote_no || `QUO-${item.quotation_id}`);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await deleteQuotation(deletingId);
      if (res?.success) {
        setDeleteModalVisible(false);
        setAlertConfig({
          visible: true,
          title: 'สำเร็จ',
          message: 'ลบใบเสนอราคาเรียบร้อยแล้ว สถานะงานซ่อมถูกรีเซ็ตกลับเป็นขั้นตอนตรวจเช็ค',
          type: 'success',
        });
        loadQuotations(true);
      } else {
        throw new Error(res?.message || 'ไม่สามารถลบใบเสนอราคาได้');
      }
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'ไม่สามารถลบใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง',
        type: 'danger',
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleOpenDetail = (item: QuotationItem) => {
    setSelectedQuoteId(item.quotation_id);
    setDetailModalVisible(true);
  };

  const handleEdit = (item: QuotationItem) => {
    router.push({
      pathname: '/make-quote',
      params: {
        job_no: item.job_no,
        job_id: String(item.job_id),
        quote_id: String(item.quotation_id),
        customer_name: item.customer_name,
      },
    });
  };

  const handleViewJob = (item: QuotationItem) => {
    router.push({
      pathname: '/detail',
      params: {
        job_id: String(item.job_id),
        job_no: item.job_no,
        customer_name: item.customer_name,
        phone: item.phone,
      },
    });
  };

  // Device icon matching RepairItemRow (commented out with its icons)
  // const getDeviceIcon = (deviceType?: string) => {
  //   const type = (deviceType || '').toLowerCase();
  //   if (type.includes('printer') || type.includes('พิมพ์')) {
  //     return 'print-outline' as const;
  //   }
  //   if (type.includes('pc') || type.includes('desktop') || type.includes('คอม')) {
  //     return 'desktop-outline' as const;
  //   }
  //   return 'laptop-outline' as const;
  // };

  // Status Badge matching RepairItemRow pill design
  const renderStatusBadge = (item: QuotationItem) => {
    const isModification =
      item.quote_status_id === 5 ||
      item.quote_status_id === 4 ||
      (Boolean(item.customer_remark) && item.repair_status_id === 3);

    let statusColor = Colors.status.status4;
    let label = 'รอลูกค้าอนุมัติ';

    if (isModification) {
      statusColor = Colors.warning || '#D97706';
      label = 'ขอแก้ไข';
    } else if (item.quote_status_id === 1) {
      statusColor = Colors.status.status4 || '#A855F7';
      label = 'รอลูกค้าอนุมัติ';
    } else if (item.quote_status_id === 2) {
      statusColor = Colors.status.status5 || '#3B82F6';
      label = 'อนุมัติแล้ว';
    } else if (item.quote_status_id === 3) {
      statusColor = Colors.status.status9 || '#EF4444';
      label = 'ลูกค้ายกเลิก';
    } else if (item.quote_status_name) {
      label = item.quote_status_name;
    }

    return (
      <View
        className="px-2.5 py-1 rounded-full flex-row items-center gap-1.5"
        style={{ backgroundColor: `${statusColor}15` }}
      >
        <View
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <Text className="text-xs font-bold font-heading" style={{ color: statusColor }}>
          {label}
        </Text>
      </View>
    );
  };

  const isModificationQuote = (item: QuotationItem) =>
    item.quote_status_id === 5 ||
    item.quote_status_id === 4 ||
    (Boolean(item.customer_remark) && item.repair_status_id === 3);

  const resultSummary = useMemo(() => {
    if (searchQuery.trim() || activeFilter !== 'all') return `พบ ${filteredQuotations.length} รายการ`;
    return `ทั้งหมด ${quotations.length} ใบเสนอราคา`;
  }, [filteredQuotations.length, quotations.length, searchQuery, activeFilter]);

  // ── Mobile-first card: single column, thumb reach, 44px targets ──
  const renderQuotationCard = (item: QuotationItem) => {
    const isModification = isModificationQuote(item);
    const grandTotal = Number(item.total_repair_price || 0).toLocaleString();
    const deviceTitle =
      [item.brand, item.model].filter(Boolean).join(' ') || item.device_type || 'อุปกรณ์';

    return (
      <TouchableOpacity
        key={item.quotation_id}
        activeOpacity={0.85}
        onPress={() => handleOpenDetail(item)}
        className={`rounded-2xl p-4 mb-3 border shadow-sm shadow-black/5 elevation-2 ${
          isModification ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'
        }`}
      >
        {/* Row 1: doc no + status */}
        <View className="flex-row items-start justify-between gap-2 pb-2.5 border-b border-slate-100 mb-2.5">
          <View className="flex-1 min-w-0">
            <Text className="text-[15px] font-bold text-slate-900 font-heading" numberOfLines={1}>
              {item.quote_no}
            </Text>
            <TouchableOpacity
              onPress={() => handleViewJob(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="bg-red-50 self-start px-2 py-1 rounded-md mt-1.5 border border-red-100 flex-row items-center gap-1 active:bg-red-100"
            >
              {/* <Ionicons name="build" size={11} color="#D32F2F" /> */}
              <Text className="text-[11px] font-bold text-[#D32F2F] font-heading">
                {item.job_no}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="shrink-0 pt-0.5">{renderStatusBadge(item)}</View>
        </View>

        {/* Row 2: device */}
        <View className="flex-row items-center gap-2 mb-1.5">
          {/* <View className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 items-center justify-center shrink-0"> */}
            {/* <Ionicons name={getDeviceIcon(item.device_type)} size={16} color="#0284C7" /> */}
          {/* </View> */}
          <Text className="text-[15px] font-bold text-slate-900 flex-1 font-heading" numberOfLines={1}>
            {deviceTitle}
          </Text>
        </View>

        {/* Row 3: customer + phone */}
        <View className="flex-row items-center gap-2 mb-2.5">
          {/* <Ionicons name="person-outline" size={13} color="#64748B" /> */}
          <Text className="text-[13px] font-medium text-slate-700 font-body flex-1" numberOfLines={1}>
            {item.customer_name || 'ลูกค้าทั่วไป'}
          </Text>
          {Boolean(item.phone && item.phone !== '-') && (
            <View className="flex-row items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shrink-0">
              {/* <Ionicons name="call-outline" size={11} color="#64748B" /> */}
              <Text className="text-xs text-slate-600 font-body">{item.phone}</Text>
            </View>
          )}
        </View>

        {/* Row 4: symptom bubble */}
        <View className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mb-2.5">
          <View className="flex-row items-start gap-1.5">
            {/* <Ionicons name="alert-circle-outline" size={14} color="#D97706" style={{ marginTop: 2 }} /> */}
            <Text className="text-[13px] text-slate-600 flex-1 leading-5 font-body" numberOfLines={2}>
              <Text className="font-bold text-slate-700 font-heading">
                {item.actual_symptom ? 'ตรวจพบ: ' : 'อาการ: '}
              </Text>
              {item.actual_symptom || item.symptom_details || '-'}
            </Text>
          </View>
        </View>

        {isModification && item.customer_remark ? (
          <View className="bg-amber-100/90 border border-amber-300 rounded-xl px-3 py-2 mb-2.5 flex-row items-start gap-1.5">
            {/* <Ionicons name="chatbubble-ellipses-outline" size={14} color="#92400E" style={{ marginTop: 2 }} /> */}
            <Text className="text-xs font-medium text-amber-900 flex-1 leading-4" numberOfLines={2}>
              ลูกค้าขอแก้ไข: &ldquo;{item.customer_remark}&rdquo;
            </Text>
          </View>
        ) : null}

        {/* Row 5: price + count */}
        <View className="flex-row items-baseline justify-between mb-3">
          <Text className="text-xs text-slate-500 font-body">
            ยอดเสนอราคา{item.item_count ? ` • ${item.item_count} รายการ` : ''}
          </Text>
          <Text className="text-lg font-bold text-[#D32F2F] font-heading">
            {grandTotal} <Text className="text-xs font-normal text-slate-500">บาท</Text>
          </Text>
        </View>

        {/* Row 6: thumb-first actions, 44px min */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => handleOpenDetail(item)}
            activeOpacity={0.75}
            style={{ minHeight: 44 }}
            className="flex-1 bg-sky-50 border border-sky-200 rounded-xl flex-row items-center justify-center gap-1.5"
          >
            {/* <Ionicons name="document-text-outline" size={15} color="#0284c7" /> */}
            <Text className="text-[13px] font-bold text-sky-700 font-heading">รายละเอียด</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            activeOpacity={0.8}
            style={{ minHeight: 44, backgroundColor: isModification ? '#F59E0B' : '#2563EB' }}
            className="flex-1 rounded-xl flex-row items-center justify-center gap-1.5 shadow-sm"
          >
            <Ionicons name="create-outline" size={15} color="#ffffff" />
            <Text className="text-[13px] font-bold text-white font-heading">แก้ไข</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePromptDelete(item)}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ minHeight: 44, minWidth: 44 }}
            accessibilityLabel={`ลบ ${item.quote_no}`}
            accessibilityRole="button"
            className="bg-rose-50 border border-rose-200 rounded-xl items-center justify-center px-3 active:bg-rose-100"
          >
            <Ionicons name="trash-outline" size={17} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* ── App Standard Header ── */}
      <Header title="IT VERTEX" subtitle="รายการใบเสนอราคา" />

      {/* ── Content Container (Aligned with RepairListScreen) ── */}
      <View className="flex-1 w-full max-w-5xl mx-auto px-4 pt-2 pb-0">
        {/* Search Bar matching the rest of the app */}
        <SearchFilterBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          showFilter={false}
        />

        {/* Horizontal Filter Tabs — 44px touch, thumb scroll */}
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
              className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${
                activeFilter === 'all'
                  ? 'bg-slate-900 border-slate-900 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-bold font-heading ${
                  activeFilter === 'all' ? 'text-white' : 'text-slate-700'
                }`}
              >
                ทั้งหมด
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'all' ? 'bg-slate-700' : 'bg-slate-100'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    activeFilter === 'all' ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {quotations.length}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Tab: ขอแก้ไข */}
            <TouchableOpacity
              onPress={() => setActiveFilter('rejected')}
              activeOpacity={0.7}
              style={{ minHeight: 44, justifyContent: 'center' }}
              className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${
                activeFilter === 'rejected'
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
                className={`text-xs font-bold font-heading ${
                  activeFilter === 'rejected'
                    ? 'text-white'
                    : countRejected > 0
                    ? 'text-amber-900'
                    : 'text-slate-700'
                }`}
              >
                ขอแก้ไข
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'rejected'
                    ? 'bg-black/20'
                    : countRejected > 0
                    ? 'bg-amber-200/70'
                    : 'bg-slate-100'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    activeFilter === 'rejected'
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
              className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${
                activeFilter === 'pending'
                  ? 'shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
              style={
                activeFilter === 'pending'
                  ? { backgroundColor: Colors.status.status4, borderColor: Colors.status.status4, minHeight: 44, justifyContent: 'center' }
                  : { minHeight: 44, justifyContent: 'center' }
              }
            >
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: activeFilter === 'pending' ? '#FFFFFF' : Colors.status.status4 }}
              />
              <Text
                className={`text-xs font-bold font-heading ${
                  activeFilter === 'pending' ? 'text-white' : 'text-slate-700'
                }`}
              >
                รออนุมัติ
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'pending' ? 'bg-black/20' : 'bg-slate-100'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    activeFilter === 'pending' ? 'text-white' : 'text-slate-600'
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
              className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${
                activeFilter === 'approved'
                  ? 'shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
              style={
                activeFilter === 'approved'
                  ? { backgroundColor: Colors.status.status5, borderColor: Colors.status.status5, minHeight: 44, justifyContent: 'center' }
                  : { minHeight: 44, justifyContent: 'center' }
              }
            >
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: activeFilter === 'approved' ? '#FFFFFF' : Colors.status.status5 }}
              />
              <Text
                className={`text-xs font-bold font-heading ${
                  activeFilter === 'approved' ? 'text-white' : 'text-slate-700'
                }`}
              >
                อนุมัติแล้ว
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'approved' ? 'bg-black/20' : 'bg-slate-100'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    activeFilter === 'approved' ? 'text-white' : 'text-slate-600'
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
              className={`flex-row items-center gap-1.5 px-3.5 rounded-xl border ${
                activeFilter === 'cancelled'
                  ? 'shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
              style={
                activeFilter === 'cancelled'
                  ? { backgroundColor: Colors.status.status9, borderColor: Colors.status.status9, minHeight: 44, justifyContent: 'center' }
                  : { minHeight: 44, justifyContent: 'center' }
              }
            >
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: activeFilter === 'cancelled' ? '#FFFFFF' : Colors.status.status9 }}
              />
              <Text
                className={`text-xs font-bold font-heading ${
                  activeFilter === 'cancelled' ? 'text-white' : 'text-slate-700'
                }`}
              >
                ยกเลิก
              </Text>
              <View
                className={`px-1.5 py-0.2 rounded-full ${
                  activeFilter === 'cancelled' ? 'bg-black/20' : 'bg-slate-100'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    activeFilter === 'cancelled' ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {countCancelled}
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Quotation Content: cards on phone, table on tablet/desktop ── */}
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#D32F2F" />
            <Text className="mt-3 text-sm text-slate-500 font-body">กำลังโหลดรายการใบเสนอราคา...</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D32F2F']} />
            }
          >
            {/* Result count — scanability on small screens */}
            <View className="flex-row items-center justify-between px-1 pb-2">
              <Text className="text-xs font-semibold text-slate-500 font-body">{resultSummary}</Text>
              {!isWide && filteredQuotations.length > 0 ? (
                <Text className="text-[11px] text-slate-400 font-body">แตะการ์ดเพื่อดูรายละเอียด</Text>
              ) : null}
            </View>
            {filteredQuotations.length === 0 ? (
              <View className="items-center justify-center py-24 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
                  <Ionicons name="document-text-outline" size={32} color="#94a3b8" />
                </View>
                <Text className="text-base font-bold text-slate-700 font-heading text-center">
                  ไม่พบรายการใบเสนอราคา
                </Text>
                <Text className="text-xs text-slate-400 font-body text-center mt-1">
                  {searchQuery || activeFilter !== 'all'
                    ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ'
                    : 'ยังไม่มีการสร้างใบเสนอราคาในระบบ'}
                </Text>
              </View>
            ) : isWide ? (
              <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm shadow-black/5 elevation-2 mb-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ minWidth: 980, width: '100%' }}>
                    {/* ── Table Header (tablet/desktop only) ── */}
                    <View className="bg-slate-50 flex-row py-3.5 px-4 border-b border-slate-200 items-center">
                      <Text className="text-slate-700 font-bold text-xs font-heading w-[140px]">เลขที่เอกสาร</Text>
                      <Text className="text-slate-700 font-bold text-xs font-heading w-[160px]">ลูกค้า</Text>
                      <Text className="text-slate-700 font-bold text-xs font-heading flex-1 min-w-[240px]">อุปกรณ์ / ผลตรวจเช็คอาการ</Text>
                      <Text className="text-slate-700 font-bold text-xs font-heading w-[140px] text-right pr-2">ยอดรวมเสนอราคา</Text>
                      <Text className="text-slate-700 font-bold text-xs font-heading w-[130px] text-center">สถานะ</Text>
                      <Text className="text-slate-700 font-bold text-xs font-heading w-[200px] text-center">จัดการ</Text>
                    </View>

                    {/* ── Table Rows ── */}
                    {filteredQuotations.map((item, index) => {
                      const isModification = isModificationQuote(item);

                      const grandTotal = Number(item.total_repair_price || 0).toLocaleString();
                      const isEven = index % 2 === 0;

                      return (
                        <View
                          key={item.quotation_id}
                          className={`flex-row py-3.5 px-4 items-center border-b border-slate-100 ${
                            isModification
                              ? 'bg-amber-50/60'
                              : isEven
                              ? 'bg-white'
                              : 'bg-slate-50/40'
                          }`}
                        >
                          {/* คอลัมน์ 1: เลขที่เอกสาร */}
                          <View className="w-[140px] pr-2">
                            <TouchableOpacity
                              onPress={() => handleOpenDetail(item)}
                              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                              className="flex-row items-center gap-1 active:opacity-70"
                            >
                              <Text className="text-[13px] font-bold text-slate-900 font-heading underline">
                                {item.quote_no}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleViewJob(item)}
                              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                              className="bg-red-50 self-start px-2 py-1 rounded-md mt-1.5 border border-red-100 flex-row items-center gap-1 active:bg-red-100"
                            >
                              {/* <Ionicons name="build" size={11} color="#D32F2F" /> */}
                              <Text className="text-[11px] font-bold text-[#D32F2F] font-heading">
                                {item.job_no}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* คอลัมน์ 2: ลูกค้า */}
                          <View className="w-[160px] pr-2">
                            <Text className="text-[13px] font-bold text-slate-800 font-heading" numberOfLines={1}>
                              {item.customer_name}
                            </Text>
                            <Text className="text-xs text-slate-500 font-body mt-0.5">
                              {item.phone || '-'}
                            </Text>
                          </View>

                          {/* คอลัมน์ 3: อุปกรณ์ / อาการ */}
                          <View className="flex-1 min-w-[240px] pr-3">
                            <View className="flex-row items-center gap-1.5">
                              {/* <Ionicons name={getDeviceIcon(item.device_type)} size={14} color="#0284C7" /> */}
                              <Text className="text-[13px] font-bold text-slate-800 font-heading" numberOfLines={1}>
                                {[item.brand, item.model].filter(Boolean).join(' ') || item.device_type || 'อุปกรณ์'}
                              </Text>
                            </View>
                            <Text className="text-xs text-slate-600 font-body mt-0.5 pl-5" numberOfLines={2}>
                              {item.actual_symptom ? (
                                <Text className="text-amber-800 font-medium">ตรวจพบ: {item.actual_symptom}</Text>
                              ) : (
                                `อาการ: ${item.symptom_details || '-'}`
                              )}
                            </Text>
                            {isModification && item.customer_remark ? (
                              <View className="bg-amber-100/90 rounded-lg px-2 py-1 self-start mt-1.5 ml-5 border border-amber-300">
                                <Text className="text-[11px] font-bold text-amber-900" numberOfLines={2}>
                                  ลูกค้าขอแก้ไข: &ldquo;{item.customer_remark}&rdquo;
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {/* คอลัมน์ 4: ยอดรวมเสนอราคา */}
                          <View className="w-[140px] pr-2 items-end justify-center">
                            <Text className="text-[15px] font-bold text-[#D32F2F] font-heading">
                              {grandTotal} <Text className="text-xs font-normal text-slate-600">บาท</Text>
                            </Text>
                          </View>

                          {/* คอลัมน์ 5: สถานะ */}
                          <View className="w-[130px] px-1 items-center justify-center">
                            {renderStatusBadge(item)}
                          </View>

                          {/* คอลัมน์ 6: ปุ่มจัดการ */}
                          <View className="w-[200px] flex-row items-center justify-center gap-2">
                            <TouchableOpacity
                              style={{ minHeight: 44, justifyContent: 'center' }}
                              className="bg-sky-50 px-3 rounded-xl flex-row items-center gap-1 border border-sky-200 active:opacity-80"
                              onPress={() => handleOpenDetail(item)}
                            >
                              {/* <Ionicons name="document-text-outline" size={14} color="#0284c7" /> */}
                              <Text className="text-xs font-bold text-sky-700 font-heading">รายละเอียด</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{ minHeight: 44, justifyContent: 'center' }}
                              className={`px-3 rounded-xl flex-row items-center gap-1 active:opacity-80 ${
                                isModification ? 'bg-amber-500' : 'bg-blue-600'
                              }`}
                              onPress={() => handleEdit(item)}
                            >
                              <Ionicons name="create-outline" size={14} color="#ffffff" />
                              <Text className="text-xs font-bold text-white font-heading">แก้ไข</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
                              className="bg-rose-50 border border-rose-200 rounded-xl flex-row items-center justify-center px-2.5 active:bg-rose-100"
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityLabel={`ลบ ${item.quote_no}`}
                              accessibilityRole="button"
                              onPress={() => handlePromptDelete(item)}
                            >
                              <Ionicons name="trash-outline" size={15} color="#e11d48" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ) : (
              <View className="pb-4">
                {filteredQuotations.map((item) => renderQuotationCard(item))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Quotation Detail Modal */}
      <QuotationDetailModal
        visible={detailModalVisible}
        quotationId={selectedQuoteId}
        onClose={() => setDetailModalVisible(false)}
        onEdit={(qId, jNo, jId, cName) => {
          router.push({
            pathname: '/make-quote',
            params: {
              job_no: jNo,
              job_id: String(jId),
              quote_id: String(qId),
              customer_name: cName,
            },
          });
        }}
        onViewJob={(jId, jNo, cName, cPhone) => {
          router.push({
            pathname: '/detail',
            params: {
              job_id: String(jId),
              job_no: jNo,
              customer_name: cName,
              phone: cPhone,
            },
          });
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="ยืนยันการลบใบเสนอราคา"
        itemName={deletingQuoteNo}
        message="การลบใบเสนอราคาจะรีเซ็ตสถานะงานซ่อมกลับไปเป็นขั้นตอนตรวจเช็ค และล้างรายการอะไหล่/บริการในใบเสนอราคานี้"
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteModalVisible(false);
            setDeletingId(null);
          }
        }}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
