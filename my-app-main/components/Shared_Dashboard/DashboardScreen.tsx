// 1. React & React Native
import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';

// 2. Third-party / Expo
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 3. API helpers
import {
  getDashboardCategory,
  getDashboardMetrics,
  getDashboardPartsUsage,
  getDashboardSymptoms,
  getDashboardTrend,
  getDashboardWorkActivity,
  getRepairs,
} from '@/lib/api';

// 4. Components
import CategoryChart from '@/components/Shared_Dashboard/CategoryChart';
import DashboardFilters from '@/components/Shared_Dashboard/DashboardFilters';
import Header from '@/components/Shared_Dashboard/Header';
import MetricCards from '@/components/Shared_Dashboard/MetricCards';
import PartsUsageChart, { type PartUsageItem } from '@/components/Shared_Dashboard/PartsUsageChart';
import SymptomsChart, { type SymptomItem } from '@/components/Shared_Dashboard/SymptomsChart';
import TrendChart from '@/components/Shared_Dashboard/TrendChart';
import WorkActivityChart, { type WorkActivityMember } from '@/components/Shared_Dashboard/WorkActivityChart';

interface DashboardScreenProps {
  /** 'staff' or 'manager' — passed to getDashboardMetrics */
  role: 'staff' | 'manager';
}

const STATUS_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'รอตรวจเช็ค', color: '#84CC16', bg: '#F7FEE7' },
  2: { label: 'ตรวจเช็ค', color: '#D97706', bg: '#FFFBEB' },
  3: { label: 'เสนอราคา', color: '#F59E0B', bg: '#FEF3C7' },
  4: { label: 'รออนุมัติ', color: '#A855F7', bg: '#FAF5FF' },
  5: { label: 'อนุมัติ/รอซ่อม', color: '#6366F1', bg: '#EEF2FF' },
  6: { label: 'รอมารับเครื่อง', color: '#0EA5E9', bg: '#F0F9FF' },
  7: { label: 'รอชำระ', color: '#EAB308', bg: '#FEFCE8' },
  8: { label: 'เสร็จสิ้น', color: '#22C55E', bg: '#F0FDF4' },
  9: { label: 'ยกเลิก', color: '#EF4444', bg: '#FEF2F2' },
};

export default function DashboardScreen({ role }: DashboardScreenProps) {
  const router = useRouter();

  // Filters
  const [timeFilter, setTimeFilter] = useState<'day' | 'month' | 'year'>('day');
  const [deviceType, setDeviceType] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Data
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
  });
  const [trendData, setTrendData] = useState<{ value: number; label: string }[]>([]);
  const [revenueTrendData, setRevenueTrendData] = useState<{ value: number; label: string }[]>([]);
  const [categoryData, setCategoryData] = useState<{
    pc: number;
    laptop: number;
    printer: number;
    other?: number;
    total?: number;
  }>({ pc: 0, laptop: 0, printer: 0, other: 0, total: 0 });
  const [workActivityData, setWorkActivityData] = useState<WorkActivityMember[]>([]);
  const [symptomsData, setSymptomsData] = useState<SymptomItem[]>([]);
  const [partsUsageData, setPartsUsageData] = useState<PartUsageItem[]>([]);
  const [recentRepairs, setRecentRepairs] = useState<any[]>([]);

  // กรองข้อมูลทั้งหมดแบบ Synchronized ไปพร้อมกัน (Trend + Category + Metrics + Team Performance + Parts Usage)
  const fetchSynchronizedData = useCallback(async () => {
    try {
      setIsLoading(true);

      const filterParams = {
        role,
        period: timeFilter,
        device_type: deviceType,
        date_start: dateStart,
        date_end: dateEnd,
      };

      const [metricsRes, trendRes, revenueTrendRes, categoryRes, workRes, symptomsRes, partsRes, repairsRes] = await Promise.all([
        getDashboardMetrics(filterParams),
        getDashboardTrend({
          period: timeFilter,
          device_type: deviceType,
          date_start: dateStart,
          date_end: dateEnd,
        }),
        getDashboardTrend({
          period: timeFilter,
          metric_type: 'revenue',
          device_type: deviceType,
          date_start: dateStart,
          date_end: dateEnd,
        }),
        getDashboardCategory({
          period: timeFilter,
          device_type: deviceType,
          date_start: dateStart,
          date_end: dateEnd,
        }),
        getDashboardWorkActivity({
          period: timeFilter,
          device_type: deviceType,
          date_start: dateStart,
          date_end: dateEnd,
        }),
        getDashboardSymptoms({
          period: timeFilter,
          device_type: deviceType,
          date_start: dateStart,
          date_end: dateEnd,
        }),
        getDashboardPartsUsage({
          period: timeFilter,
          device_type: deviceType,
          date_start: dateStart,
          date_end: dateEnd,
        }),
        getRepairs(),
      ]);

      if (metricsRes?.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }

      if (trendRes?.success && Array.isArray(trendRes.data)) {
        setTrendData(trendRes.data);
      } else {
        setTrendData([]);
      }

      if (revenueTrendRes?.success && Array.isArray(revenueTrendRes.data)) {
        setRevenueTrendData(revenueTrendRes.data);
      } else {
        setRevenueTrendData([]);
      }

      if (categoryRes?.success && categoryRes.data) {
        setCategoryData(categoryRes.data);
      }

      if (workRes?.success && Array.isArray(workRes.data)) {
        setWorkActivityData(workRes.data);
      } else {
        setWorkActivityData([]);
      }

      if (symptomsRes?.success && Array.isArray(symptomsRes.data)) {
        setSymptomsData(symptomsRes.data);
      } else {
        setSymptomsData([]);
      }

      if (partsRes?.success && Array.isArray(partsRes.data)) {
        setPartsUsageData(partsRes.data);
      } else {
        setPartsUsageData([]);
      }

      if (repairsRes?.success && Array.isArray(repairsRes.data)) {
        setRecentRepairs(repairsRes.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Dashboard synchronized fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [role, timeFilter, deviceType, dateStart, dateEnd]);

  useFocusEffect(
    useCallback(() => {
      fetchSynchronizedData();
    }, [fetchSynchronizedData])
  );


  return (
    <View className="flex-1 bg-slate-50">
      <Header
        title="IT VERTEX"
        subtitle={role === 'manager' ? 'แดชบอร์ดภาพรวมผู้จัดการ' : 'แดชบอร์ดภาพรวมหน้าร้าน'}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 60 }}
      >
        {/* Filters */}
        <DashboardFilters
          timeFilter={timeFilter}
          onChangeTimeFilter={setTimeFilter}
          deviceType={deviceType}
          onChangeDeviceType={setDeviceType}
          dateStart={dateStart}
          dateEnd={dateEnd}
          onChangeDateStart={setDateStart}
          onChangeDateEnd={setDateEnd}
        />
        {/* KPI Metrics */}
        <MetricCards
          totalRevenue={metrics.totalRevenue}
          totalJobs={metrics.totalJobs}
          completedJobs={metrics.completedJobs}
          pendingJobs={metrics.pendingJobs}
        />

        {/* ── Recent Repairs Feed ── */}
        <View className="mx-4 bg-white rounded-2xl p-4 mb-4 border border-slate-200 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-bold text-slate-800 font-heading">
                งานซ่อมล่าสุด (Recent Jobs)
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push(role === 'manager' ? '/(meneger)/repairs' : '/(staff)/repairs')}
              className="flex-row items-center gap-1"
            >
              <Text className="text-xs font-bold text-[#DC2626] font-heading">ดูทั้งหมด</Text>
              <Ionicons name="chevron-forward" size={12} color="#DC2626" />
            </TouchableOpacity>
          </View>

          <View className="flex-col gap-2">
            {recentRepairs.length === 0 ? (
              <Text className="text-xs text-slate-400 font-body text-center py-4">ยังไม่มีข้อมูลงานซ่อม</Text>
            ) : (
              recentRepairs.map((job) => {
                const sId = Number(job.status_id || 1);
                const sCfg = STATUS_CONFIG[sId] || { label: job.status || 'รอตรวจเช็ค', color: '#64748B', bg: '#F1F5F9' };
                const deviceStr = `${job.brand || ''} ${job.model || ''}`.trim() || job.device_type || 'อุปกรณ์';

                return (
                  <TouchableOpacity
                    key={job.id || job.job_id}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: '/detail',
                        params: {
                          job_id: job.id || job.job_id,
                          job_no: job.job_number || job.job_no,
                          customer_name: job.customer_name,
                          phone: job.phone,
                          role,
                        },
                      })
                    }
                    className="flex-row items-center justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100"
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2 mb-0.5">
                        <Text className="text-xs font-bold text-slate-800 font-heading">
                          {job.job_number || job.job_no || `REP-${job.job_id}`}
                        </Text>
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: sCfg.bg }}
                        >
                          <Text className="text-[10px] font-bold" style={{ color: sCfg.color }}>
                            {job.status_name || job.status || sCfg.label}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-slate-600 font-body" numberOfLines={1}>
                        {deviceStr} • {job.customer_name || 'ลูกค้าทั่วไป'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Trend Chart */}
        <TrendChart
          timeFilter={timeFilter}
          deviceType={deviceType}
          data={trendData}
          isLoading={isLoading}
        />

        {/* Revenue Trend Chart */}
        <TrendChart
          timeFilter={timeFilter}
          deviceType={deviceType}
          data={revenueTrendData}
          isLoading={isLoading}
          mode="revenue"
        />

        {/* Category Distribution Chart */}
        <CategoryChart
          pcPercent={categoryData.pc}
          laptopPercent={categoryData.laptop}
          printerPercent={categoryData.printer}
          otherCount={categoryData.other}
          total={categoryData.total}
          deviceType={deviceType}
          timeFilter={timeFilter}
          isLoading={isLoading}
        />

        {/* Work Activity Bar Chart (แทนกราฟประสิทธิภาพทีม) */}
        <WorkActivityChart
          data={workActivityData}
          deviceType={deviceType}
          timeFilter={timeFilter}
          isLoading={isLoading}
        />

        {/* Symptoms Chart (อาการเสียที่พบบ่อย) */}
        <SymptomsChart
          data={symptomsData}
          deviceType={deviceType}
          timeFilter={timeFilter}
          isLoading={isLoading}
        />

        {/* Parts Usage Chart (สถิติการใช้อะไหล่) */}
        <PartsUsageChart
          data={partsUsageData}
          deviceType={deviceType}
          timeFilter={timeFilter}
          isLoading={isLoading}
        />
      </ScrollView>
    </View>
  );
}
