// 1. React & React Native
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';

// 2. Third-party / Expo
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3. API & Auth helpers
import { getRepairs } from '@/lib/api';
import { getUser } from '@/lib/auth';

type FilterTab = 'all' | 'in_progress' | 'pending_approval' | 'completed';

export default function CustomerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customerName, setCustomerName] = useState<string>('ลูกค้า');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Fetch current customer profile name
  useEffect(() => {
    async function loadProfile() {
      try {
        const u = await getUser();
        if (u) {
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          if (fullName) setCustomerName(fullName);
          else if (u.email) setCustomerName(u.email.split('@')[0]);
        }
      } catch (err) {
        console.error('Error loading customer user:', err);
      }
    }
    loadProfile();
  }, []);

  const fetchMyJobs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await getRepairs();
      setJobs(res.data || []);
    } catch (error) {
      console.error('Error fetching customer jobs:', error);
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyJobs(true);
  }, [fetchMyJobs]);

  useFocusEffect(
    useCallback(() => {
      fetchMyJobs();
      const interval = setInterval(() => {
        fetchMyJobs(true);
      }, 5000);
      return () => clearInterval(interval);
    }, [fetchMyJobs])
  );

  // Status Counts
  const counts = useMemo(() => {
    let inProgress = 0;
    let pendingApproval = 0;
    let completed = 0;

    jobs.forEach((j) => {
      const st = (j.status || j.status_name || '').toLowerCase();
      const stId = Number(j.status_id);

      if (stId === 4 || st.includes('รอการอนุมัติ') || st.includes('รออนุมัติ') || st.includes('เสนอราคา')) {
        pendingApproval++;
      } else if (stId === 8 || st.includes('เสร็จสิ้น') || st.includes('ชำระแล้ว')) {
        completed++;
      } else if (stId !== 9 && !st.includes('ยกเลิก')) {
        inProgress++;
      }
    });

    return { inProgress, pendingApproval, completed, total: jobs.length };
  }, [jobs]);

  // Urgent pending approval job (if any)
  const urgentApprovalJob = useMemo(() => {
    return jobs.find((j) => {
      const st = (j.status || j.status_name || '');
      const stId = Number(j.status_id);
      return stId === 4 || st.includes('รอการอนุมัติ') || st.includes('รออนุมัติ');
    });
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((item) => {
      const targetId = item.id || item.job_id;
      const jobNo = (item.job_number || item.job_no || `REP-${targetId}`).toLowerCase();
      const deviceTitle = `${item.brand || ''} ${item.model || ''} ${item.device_type || ''}`.toLowerCase();
      const symptom = (item.symptoms || item.symptom_details || item.symptom || '').toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      // Search matching
      if (query && !jobNo.includes(query) && !deviceTitle.includes(query) && !symptom.includes(query)) {
        return false;
      }

      // Tab filtering
      const st = (item.status || item.status_name || '').toLowerCase();
      const stId = Number(item.status_id);

      if (activeTab === 'pending_approval') {
        return stId === 4 || st.includes('รอการอนุมัติ') || st.includes('รออนุมัติ') || st.includes('เสนอราคา');
      }
      if (activeTab === 'in_progress') {
        return (
          stId !== 8 &&
          stId !== 9 &&
          stId !== 4 &&
          !st.includes('เสร็จสิ้น') &&
          !st.includes('ยกเลิก') &&
          !st.includes('รออนุมัติ')
        );
      }
      if (activeTab === 'completed') {
        return stId === 8 || st.includes('เสร็จสิ้น') || st.includes('ชำระแล้ว');
      }

      return true;
    });
  }, [jobs, searchQuery, activeTab]);

  const getStatusConfig = (status: string, statusId?: number) => {
    const s = status || '';
    const id = Number(statusId);

    if (id === 8 || s.includes('เสร็จ') || s.includes('ชำระแล้ว')) {
      return { color: '#22C55E', bg: '#DCFCE7', text: '#15803D', icon: 'checkmark-circle' };
    }
    if (id === 9 || s.includes('ยกเลิก')) {
      return { color: '#EF4444', bg: '#FEE2E2', text: '#B91C1C', icon: 'close-circle' };
    }
    if (id === 7 || s.includes('รอชำระ')) {
      return { color: '#EAB308', bg: '#FEF9C3', text: '#A16207', icon: 'cash' };
    }
    if (id === 6 || s.includes('กำลังซ่อม')) {
      return { color: '#0EA5E9', bg: '#E0F2FE', text: '#0369A1', icon: 'hammer' };
    }
    if (id === 5 || s.includes('อนุมัติแล้ว') || s.includes('รอซ่อม')) {
      return { color: '#3B82F6', bg: '#DBEAFE', text: '#1D4ED8', icon: 'time' };
    }
    if (id === 4 || s.includes('รออนุมัติ') || s.includes('รอการอนุมัติ')) {
      return { color: '#A855F7', bg: '#F3E8FF', text: '#7E22CE', icon: 'alert-circle' };
    }
    if (id === 3 || s.includes('เสนอราคา')) {
      return { color: '#F59E0B', bg: '#FEF3C7', text: '#B45309', icon: 'receipt' };
    }
    if (id === 2 || s.includes('ดำเนินการตรวจเช็ค')) {
      return { color: '#D97706', bg: '#FFEDD5', text: '#C2410C', icon: 'search' };
    }
    return { color: '#84CC16', bg: '#ECFCCB', text: '#4D7C0F', icon: 'clipboard' };
  };

  const getDeviceIcon = (deviceType: string) => {
    const t = (deviceType || '').toLowerCase();
    if (t.includes('printer') || t.includes('ปริ้นเตอร์')) return 'print-outline';
    if (t.includes('pc') || t.includes('desktop') || t.includes('คอม')) return 'desktop-outline';
    return 'laptop-outline';
  };

  // Helper for 5-stage progress indicator
  const getProgressStage = (statusId: number, statusName: string): number => {
    const id = Number(statusId);
    if (id === 1) return 1; // รับเครื่อง
    if (id === 2 || id === 3) return 2; // ตรวจเช็ค / ทำใบเสนอราคา
    if (id === 4) return 3; // รออนุมัติ
    if (id === 5 || id === 6) return 4; // กำลังซ่อม
    if (id === 7 || id === 8) return 5; // รอชำระ / พร้อมรับ
    return 1;
  };

  const renderJobCard = ({ item }: { item: any }) => {
    const targetId = item.id || item.job_id;
    const deviceTitle = `${item.brand || ''} ${item.model || ''}`.trim() || item.device_type || 'อุปกรณ์ไอที';
    const jobNo = item.job_number || item.job_no || (targetId ? `REP-${String(targetId).padStart(6, '0')}` : '-');
    const symptomText = item.symptoms || item.symptom_details || item.symptom || 'ไม่ระบุอาการเสีย';
    const statusText = item.status || item.status_name || 'รอตรวจเช็ค';
    const statusId = Number(item.status_id || 1);
    const statusCfg = getStatusConfig(statusText, statusId);
    const progressStage = getProgressStage(statusId, statusText);
    const isNeedsApproval = statusId === 4 || statusText.includes('รอการอนุมัติ') || statusText.includes('รออนุมัติ');
    const isPendingPayment = statusId === 7 || statusText.includes('รอชำระ');

    return (
      <View className="bg-white rounded-2xl mb-4 border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Card Top Strip */}
        <View className="p-4 pb-3">
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center border border-red-100">
                <Ionicons name={getDeviceIcon(item.device_type) as any} size={18} color="#DC2626" />
              </View>
              <View>
                <Text className="text-xs font-bold text-slate-400 font-body">รหัสงาน</Text>
                <Text className="text-sm font-bold text-slate-900 font-heading">{jobNo}</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View
              className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5"
              style={{ backgroundColor: statusCfg.bg }}
            >
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusCfg.color }} />
              <Text className="text-xs font-bold font-heading" style={{ color: statusCfg.text }}>
                {statusText}
              </Text>
            </View>
          </View>

          {/* Device Title & Symptom */}
          <Text className="text-base font-bold text-slate-900 font-heading mb-1" numberOfLines={1}>
            {deviceTitle}
          </Text>
          <View className="bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-100">
            <Text className="text-xs text-slate-500 font-body leading-4" numberOfLines={2}>
              <Text className="font-semibold text-slate-700">อาการเสีย: </Text>
              {symptomText}
            </Text>
          </View>

          {/* 5-Step Visual Progress Bar */}
          <View className="mb-3 pt-1">
            <View className="flex-row items-center justify-between mb-1">
              {['รับเครื่อง', 'ตรวจเช็ค', 'รออนุมัติ', 'กำลังซ่อม', 'พร้อมรับ'].map((stepName, idx) => {
                const stepNum = idx + 1;
                const isPassed = progressStage >= stepNum;
                const isCurrent = progressStage === stepNum;
                return (
                  <View key={stepName} className="items-center flex-1">
                    <View
                      className={`w-5 h-5 rounded-full items-center justify-center ${
                        isCurrent
                          ? 'bg-[#DC2626] border-2 border-red-200'
                          : isPassed
                          ? 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      ) : (
                        <View className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-white' : 'bg-transparent'}`} />
                      )}
                    </View>
                    <Text
                      className={`text-[10px] mt-1 font-body text-center ${
                        isCurrent ? 'font-bold text-[#DC2626]' : isPassed ? 'text-slate-700' : 'text-slate-400'
                      }`}
                      numberOfLines={1}
                    >
                      {stepName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Price Tag if available */}
          {item.total_amount && Number(item.total_amount) > 0 ? (
            <View className="flex-row items-center justify-between py-2 border-t border-slate-100">
              <Text className="text-xs text-slate-500 font-body">ยอดรวมค่าซ่อม</Text>
              <Text className="text-base font-bold text-[#DC2626] font-heading">
                ฿{Number(item.total_amount).toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Card Action Footer */}
        <View className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex-row items-center justify-end gap-2">
          {isNeedsApproval ? (
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-1 bg-purple-600 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
              onPress={() => router.push({ pathname: '/job-detail', params: { id: targetId } })}
            >
              <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold font-heading">ตรวจสอบและอนุมัติใบเสนอราคา</Text>
            </TouchableOpacity>
          ) : isPendingPayment ? (
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-1 bg-amber-500 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
              onPress={() => router.push({ pathname: '/job-detail', params: { id: targetId } })}
            >
              <Ionicons name="card-outline" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold font-heading">ดูวิธีชำระเงิน & นัดรับเครื่อง</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-1 bg-white border border-slate-200 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2"
              onPress={() => router.push({ pathname: '/job-detail', params: { id: targetId } })}
            >
              <Ionicons name="eye-outline" size={16} color="#475569" />
              <Text className="text-slate-700 text-xs font-bold font-heading">ดูรายละเอียดและประวัติงาน</Text>
              <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#DC2626" />

      {/* Modern Tech Clean Header */}
      <View className="bg-[#DC2626] px-5 pt-4 pb-6 rounded-b-[28px] shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <Text className="text-white/80 text-xs font-bold tracking-wider font-heading uppercase">
                IT VERTEX CUSTOMER
              </Text>
            </View>
            <Text className="text-white text-xl font-bold font-heading mt-0.5">
              สวัสดี, {customerName} 👋
            </Text>
          </View>
        </View>

        {/* Quick Lifecycle Counters */}
        <View className="flex-row items-center justify-between gap-2 pt-1">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('in_progress')}
            className={`flex-1 p-2.5 rounded-xl border ${
              activeTab === 'in_progress'
                ? 'bg-white text-slate-900 border-white'
                : 'bg-white/10 border-white/20'
            }`}
          >
            <View className="flex-row items-center justify-between mb-0.5">
              <Ionicons
                name="hammer-outline"
                size={14}
                color={activeTab === 'in_progress' ? '#DC2626' : '#FFFFFF'}
              />
              <Text
                className={`text-base font-bold font-heading ${
                  activeTab === 'in_progress' ? 'text-slate-900' : 'text-white'
                }`}
              >
                {counts.inProgress}
              </Text>
            </View>
            <Text
              className={`text-[11px] font-body ${
                activeTab === 'in_progress' ? 'text-slate-600 font-medium' : 'text-white/80'
              }`}
            >
              กำลังดำเนินการ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('pending_approval')}
            className={`flex-1 p-2.5 rounded-xl border ${
              activeTab === 'pending_approval'
                ? 'bg-white border-white'
                : counts.pendingApproval > 0
                ? 'bg-amber-500/30 border-amber-300'
                : 'bg-white/10 border-white/20'
            }`}
          >
            <View className="flex-row items-center justify-between mb-0.5">
              <Ionicons
                name="alert-circle-outline"
                size={14}
                color={
                  activeTab === 'pending_approval'
                    ? '#D97706'
                    : counts.pendingApproval > 0
                    ? '#FEF08A'
                    : '#FFFFFF'
                }
              />
              <Text
                className={`text-base font-bold font-heading ${
                  activeTab === 'pending_approval'
                    ? 'text-slate-900'
                    : counts.pendingApproval > 0
                    ? 'text-amber-200'
                    : 'text-white'
                }`}
              >
                {counts.pendingApproval}
              </Text>
            </View>
            <Text
              className={`text-[11px] font-body ${
                activeTab === 'pending_approval'
                  ? 'text-slate-600 font-medium'
                  : counts.pendingApproval > 0
                  ? 'text-amber-100 font-bold'
                  : 'text-white/80'
              }`}
            >
              รออนุมัติราคา
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('completed')}
            className={`flex-1 p-2.5 rounded-xl border ${
              activeTab === 'completed'
                ? 'bg-white border-white'
                : 'bg-white/10 border-white/20'
            }`}
          >
            <View className="flex-row items-center justify-between mb-0.5">
              <Ionicons
                name="checkmark-done-outline"
                size={14}
                color={activeTab === 'completed' ? '#16A34A' : '#FFFFFF'}
              />
              <Text
                className={`text-base font-bold font-heading ${
                  activeTab === 'completed' ? 'text-slate-900' : 'text-white'
                }`}
              >
                {counts.completed}
              </Text>
            </View>
            <Text
              className={`text-[11px] font-body ${
                activeTab === 'completed' ? 'text-slate-600 font-medium' : 'text-white/80'
              }`}
            >
              เสร็จสิ้น
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-4 pt-3">
        {/* Urgent Approval Banner (If quotation awaits approval) */}
        {urgentApprovalJob && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: '/job-detail',
                params: { id: urgentApprovalJob.id || urgentApprovalJob.job_id },
              })
            }
            className="mb-3 bg-gradient-to-r bg-purple-900 border border-purple-400/40 p-4 rounded-2xl flex-row items-center justify-between shadow-sm"
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              <View className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 items-center justify-center">
                <Ionicons name="receipt" size={20} color="#E9D5FF" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5 mb-0.5">
                  <View className="w-2 h-2 rounded-full bg-amber-400" />
                  <Text className="text-amber-300 font-bold text-xs font-heading">
                    ต้องการการอนุมัติจากคุณ
                  </Text>
                </View>
                <Text className="text-white text-xs font-body" numberOfLines={1}>
                  งาน {urgentApprovalJob.job_no || urgentApprovalJob.job_number} มีใบเสนอราคาพร้อมให้ตรวจสอบ
                </Text>
              </View>
            </View>
            <View className="bg-purple-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
              <Text className="text-white text-xs font-bold font-heading">ตรวจดู</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Search & Filter Bar */}
        <View className="flex-row items-center bg-white rounded-xl px-3 py-2 border border-slate-200 mb-3 shadow-sm">
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            placeholder="ค้นหาตามเลขงาน, อุปกรณ์ หรืออาการเสีย..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-sm text-slate-800 font-body py-0"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tab Pills */}
        <View className="flex-row items-center gap-1.5 mb-3">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'in_progress', label: 'กำลังดำเนินการ' },
            { key: 'pending_approval', label: 'รออนุมัติราคา' },
            { key: 'completed', label: 'เสร็จสิ้น' },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.key as FilterTab)}
                className={`min-h-[44px] justify-center px-4 py-2 rounded-full border ${
                  isSelected
                    ? 'bg-[#DC2626] border-[#DC2626]'
                    : 'bg-white border-slate-200 active:bg-slate-50'
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

        {/* Job List */}
        {loading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#DC2626" />
            <Text className="text-slate-400 text-xs font-body mt-2">กำลังโหลดรายการงานซ่อม...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredJobs}
            keyExtractor={(item, index) => String(item.id || item.job_id || index)}
            renderItem={renderJobCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 90 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#DC2626']} />
            }
            ListEmptyComponent={
              <View className="bg-white rounded-2xl p-8 items-center justify-center border border-slate-200 mt-4">
                <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
                  <Ionicons name="document-text-outline" size={32} color="#94A3B8" />
                </View>
                <Text className="text-base font-bold text-slate-700 font-heading mb-1">
                  ไม่พบรายการซ่อม
                </Text>
                <Text className="text-xs text-slate-400 font-body text-center max-w-xs leading-4">
                  {searchQuery || activeTab !== 'all'
                    ? 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองสถานะ'
                    : 'เมื่อคุณส่งอุปกรณ์ซ่อมกับทางร้าน รายการจะปรากฏที่นี่แบบเรียลไทม์'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
