// 1. React & React Native
import { useState, useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// 2. Third-party / Expo
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 3. API helpers
import { getRepairs } from '@/lib/api';

// 4. Components
import Header from '@/components/Shared_Dashboard/Header';
import SearchFilterBar from '@/components/ui/SearchFilterBar';
import RepairDetailsModal from '@/components/Shared_Repairs/RepairDetailsModal';
import RepairStatusSection from '@/components/Shared_Repairs/RepairStatusSection';
import type { RepairItem } from '@/components/Shared_Repairs/types';

type DeliverFilter = 'all' | 'payment' | 'pickup' | 'repairing';

export default function StaffDeliverScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [activeSegment, setActiveSegment] = useState<DeliverFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RepairItem | null>(null);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [waitingPickupItems, setWaitingPickupItems] = useState<RepairItem[]>([]);
  const [pendingPaymentItems, setPendingPaymentItems] = useState<RepairItem[]>([]);
  const [repairedContactItems, setRepairedContactItems] = useState<RepairItem[]>([]);

  const fetchDeliverItems = useCallback(async () => {
    try {
      const res = await getRepairs();

      if (!res.success) {
        console.error('Fetch repairs error:', res.message);
        return;
      }

      // กรองเฉพาะ status_id 5, 6, 7, 8, 9
      const items: RepairItem[] = (res.data || [])
        .filter((row: any) => [5, 6, 7, 8, 9].includes(row.status_id))
        .map((row: any) => {
          const jobNo = `REP-${String(row.job_id).padStart(6, '0')}`;
          const custName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';

          let computedStatus = 'รอชำระ';
          if (row.status_id === 8) {
            computedStatus = 'เสร็จสิ้น';
          } else if (row.status_id === 7) {
            computedStatus = row.payment_verified ? 'พร้อมส่งมอบ (ชำระแล้ว)' : 'รอชำระ';
          } else if (row.status_id === 9) {
            computedStatus = 'ยกเลิกซ่อม (รอชำระค่าตรวจ)';
          } else if (row.status_id === 6) {
            computedStatus = 'กำลังซ่อม';
          } else if (row.status_id === 5) {
            computedStatus = 'อนุมัติแล้ว/รอซ่อม';
          }

          let formattedDate = '-';
          if (row.created_at) {
            try {
              const d = new Date(row.created_at);
              if (!isNaN(d.getTime())) {
                formattedDate = d.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
              }
            } catch {}
          }

          const rawAmount = Number(row.total_amount);
          const finalPrice = !isNaN(rawAmount) && rawAmount > 0 ? rawAmount : (row.status_id === 9 ? 300 : 0);

          return {
            id: String(row.job_id),
            job_no: jobNo,
            customer_name: custName,
            phone: row.phone || '-',
            device: `${row.brand || ''} ${row.model || ''}`.trim() || row.device_type || 'อุปกรณ์',
            device_type: row.device_type || 'อุปกรณ์',
            brand: row.brand || '',
            model: row.model || '',
            symptom: row.symptoms || row.symptom_details || row.symptom || 'ไม่ระบุอาการเสีย',
            symptoms: row.symptoms || row.symptom_details || row.symptom || 'ไม่ระบุอาการเสีย',
            symptom_details: row.symptom_details || row.symptoms || row.symptom || 'ไม่ระบุอาการเสีย',
            actual_symptom: row.actual_symptom || '',
            status: computedStatus,
            price: finalPrice,
            total_amount: finalPrice,
            date: formattedDate,
            created_at: row.created_at,
            technician: row.repairer_name || row.inspector_name || row.technician_name || 'ช่างประจำศูนย์',
            payment_verified: Boolean(row.payment_verified),
            status_id: row.status_id,
          };
        });

      setWaitingPickupItems(items.filter((i) => i.status_id === 8 || (i.status_id === 7 && i.payment_verified)));
      setPendingPaymentItems(items.filter((i) => (i.status_id === 7 && !i.payment_verified) || i.status_id === 9));
      setRepairedContactItems(items.filter((i) => i.status_id === 5 || i.status_id === 6));
    } catch (err) {
      console.error('Error fetching deliver items:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDeliverItems();
      const interval = setInterval(() => {
        fetchDeliverItems();
      }, 5000);
      return () => clearInterval(interval);
    }, [fetchDeliverItems])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeliverItems();
  };

  const handlePressDetails = (item: RepairItem) => {
    setSelectedItem(item);
    setDetailsVisible(true);
  };

  const handleOpenFullDocument = (item: RepairItem) => {
    router.push({
      pathname: '/detail',
      params: {
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        phone: item.phone,
        role: 'staff',
        edit: 'true',
      },
    });
  };

  const handlePressHandover = (item: RepairItem) => {
    router.push({
      pathname: '/deliver-handover',
      params: {
        job_id: item.id,
        job_no: item.job_no,
        customer_name: item.customer_name,
        device: item.device || 'อุปกรณ์',
        price: String(item.price || 300),
        role: 'staff',
      },
    });
  };

  const filterFn = (item: RepairItem) => {
    if (!searchText.trim()) return true;
    const s = searchText.toLowerCase();
    return (
      item.job_no.toLowerCase().includes(s) ||
      item.customer_name.toLowerCase().includes(s) ||
      item.phone.includes(s) ||
      (item.device || '').toLowerCase().includes(s)
    );
  };

  const filteredWaitingPickup = waitingPickupItems.filter(filterFn);
  const filteredPendingPayment = pendingPaymentItems.filter(filterFn);
  const filteredRepairedContact = repairedContactItems.filter(filterFn);

  return (
    <View className="flex-1 bg-slate-50">
      <Header title="IT VERTEX" subtitle="ส่งมอบงานซ่อม & ชำระเงิน (พนักงาน)" />

      <View className="flex-1 p-4 pt-2">
        {/* KPI Counter Banners */}
        <View className="flex-row items-center gap-2 mb-3">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSegment('payment')}
            className={`flex-1 p-3 rounded-2xl border ${
              activeSegment === 'payment'
                ? 'bg-amber-500 border-amber-500 shadow-sm'
                : 'bg-white border-slate-200'
            }`}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Ionicons
                name="cash-outline"
                size={18}
                color={activeSegment === 'payment' ? '#FFFFFF' : '#D97706'}
              />
              <Text
                className={`text-lg font-bold font-heading ${
                  activeSegment === 'payment' ? 'text-white' : 'text-amber-600'
                }`}
              >
                {filteredPendingPayment.length}
              </Text>
            </View>
            <Text
              className={`text-xs font-heading ${
                activeSegment === 'payment' ? 'text-white font-bold' : 'text-slate-600'
              }`}
            >
              รอชำระเงิน
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSegment('pickup')}
            className={`flex-1 p-3 rounded-2xl border ${
              activeSegment === 'pickup'
                ? 'bg-emerald-600 border-emerald-600 shadow-sm'
                : 'bg-white border-slate-200'
            }`}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Ionicons
                name="cube-outline"
                size={18}
                color={activeSegment === 'pickup' ? '#FFFFFF' : '#059669'}
              />
              <Text
                className={`text-lg font-bold font-heading ${
                  activeSegment === 'pickup' ? 'text-white' : 'text-emerald-700'
                }`}
              >
                {filteredWaitingPickup.length}
              </Text>
            </View>
            <Text
              className={`text-xs font-heading ${
                activeSegment === 'pickup' ? 'text-white font-bold' : 'text-slate-600'
              }`}
            >
              พร้อมส่งมอบ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveSegment('repairing')}
            className={`flex-1 p-3 rounded-2xl border ${
              activeSegment === 'repairing'
                ? 'bg-blue-600 border-blue-600 shadow-sm'
                : 'bg-white border-slate-200'
            }`}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Ionicons
                name="hammer-outline"
                size={18}
                color={activeSegment === 'repairing' ? '#FFFFFF' : '#2563EB'}
              />
              <Text
                className={`text-lg font-bold font-heading ${
                  activeSegment === 'repairing' ? 'text-white' : 'text-blue-600'
                }`}
              >
                {filteredRepairedContact.length}
              </Text>
            </View>
            <Text
              className={`text-xs font-heading ${
                activeSegment === 'repairing' ? 'text-white font-bold' : 'text-slate-600'
              }`}
            >
              กำลังซ่อม
            </Text>
          </TouchableOpacity>
        </View>

        <SearchFilterBar
          value={searchText}
          onChangeText={setSearchText}
          showFilter={false}
          placeholder="ค้นหาตามเลขงาน, ลูกค้า, เบอร์โทร หรืออุปกรณ์..."
        />

        {/* Filter Segment Pills */}
        <View className="flex-row items-center gap-1.5 mb-3">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'payment', label: 'รอชำระ' },
            { key: 'pickup', label: 'ส่งมอบแล้ว/พร้อมรับ' },
            { key: 'repairing', label: 'กำลังซ่อม' },
          ].map((tab) => {
            const isSelected = activeSegment === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => setActiveSegment(tab.key as DeliverFilter)}
                className={`px-3 py-1.5 rounded-full border ${
                  isSelected ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-heading ${
                    isSelected ? 'text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#DC2626" />
            <Text className="mt-3 text-sm text-slate-500 font-body">กำลังโหลดรายการส่งมอบจากฐานข้อมูล...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#DC2626']} />
            }
          >
            {(activeSegment === 'all' || activeSegment === 'payment') && (
              <RepairStatusSection
                title="รอชำระเงิน (ตรวจสอบสลิป/รับเงินสด)"
                count={filteredPendingPayment.length}
                indicatorColor="#EAB308"
                items={filteredPendingPayment}
                defaultExpanded={true}
                onPressDetails={handlePressDetails}
                onPressHandover={handlePressHandover}
                onPressPaymentCheck={(item) =>
                  router.push({
                    pathname: '/verify-payment',
                    params: {
                      jobId: item.id,
                      job_no: item.job_no,
                      customer_name: item.customer_name,
                      amount: String(item.price || 300),
                      role: 'staff',
                    },
                  })
                }
              />
            )}

            {(activeSegment === 'all' || activeSegment === 'pickup') && (
              <RepairStatusSection
                title="รอลูกค้ารับเครื่อง / ส่งมอบเสร็จสิ้น"
                count={filteredWaitingPickup.length}
                indicatorColor="#22C55E"
                items={filteredWaitingPickup}
                defaultExpanded={true}
                onPressDetails={handlePressDetails}
                onPressHandover={handlePressHandover}
              />
            )}

            {(activeSegment === 'all' || activeSegment === 'repairing') && (
              <RepairStatusSection
                title="อนุมัติแล้ว/รอซ่อม (อยู่ระหว่างซ่อม)"
                count={filteredRepairedContact.length}
                indicatorColor="#3B82F6"
                items={filteredRepairedContact}
                defaultExpanded={false}
                onPressDetails={handlePressDetails}
                onPressHandover={handlePressHandover}
              />
            )}
          </ScrollView>
        )}
      </View>

      <RepairDetailsModal
        visible={isDetailsVisible}
        item={selectedItem}
        onClose={() => {
          setDetailsVisible(false);
          setSelectedItem(null);
        }}
        onOpenFullDocument={handleOpenFullDocument}
      />
    </View>
  );
}
