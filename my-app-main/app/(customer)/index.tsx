// 1. React & React Native
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

// 2. Third-party / Expo
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// 3. API & Auth helpers
import { getRepairs } from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { RepairJob } from '@/types/repair';

// 4. Modular Components
import Header from '@/components/Shared_Dashboard/Header';
import { type CustomerFilterTab } from '@/components/Customer/CustomerHeader';
import CustomerJobCard from '@/components/Customer/CustomerJobCard';
import CustomerFilterBar from '@/components/Customer/CustomerFilterBar';
import CustomerEmptyState from '@/components/Customer/CustomerEmptyState';

interface CustomerSegmentCardProps {
  label: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  softColor: string;
  borderColor: string;
  isActive: boolean;
  onPress: () => void;
}

function CustomerSegmentCard({
  label,
  count,
  icon,
  accentColor,
  softColor,
  borderColor,
  isActive,
  onPress,
}: CustomerSegmentCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      className="min-h-[82px] flex-1 rounded-2xl border px-3 py-2.5 shadow-sm"
      style={{
        backgroundColor: isActive ? softColor : '#FFFFFF',
        borderColor: isActive ? accentColor : borderColor,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: isActive ? '#FFFFFF' : softColor }}
        >
          <Ionicons name={icon} size={17} color={accentColor} />
        </View>
        <Text
          className="text-lg font-bold font-heading"
          style={{ color: isActive ? accentColor : '#0F172A' }}
        >
          {count}
        </Text>
      </View>
      <Text
        className="mt-1.5 text-[11px] font-semibold font-heading"
        style={{ color: isActive ? accentColor : '#64748B' }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CustomerFilterTab>('all');

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
      }, 10000); // Polling ทุก 10 วินาทีเพื่อประหยัดแบตเตอรี่ และรองรับ Pull-to-Refresh
      return () => clearInterval(interval);
    }, [fetchMyJobs])
  );


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

  const handlePressDetails = useCallback(
    (targetId: string | number) => {
      router.push({ pathname: '/job-detail', params: { id: targetId } });
    },
    [router]
  );

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar style="light" backgroundColor="#DC2626" />

      {/* Header มาตรฐานแบบเดียวกับทุกบทบาท */}
      <Header
        title="IT VERTEX"
        subtitle="ติดตามสถานะงานซ่อม"
      />

      <View className="flex-1 px-4 pt-3">

        <CustomerFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

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
            renderItem={({ item }) => (
              <CustomerJobCard
                item={item}
                onPressDetails={handlePressDetails}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#DC2626']} />
            }
            ListEmptyComponent={
              <CustomerEmptyState
                isFiltered={Boolean(searchQuery || activeTab !== 'all')}
              />
            }
          />
        )}
      </View>
    </View>
  );
}
