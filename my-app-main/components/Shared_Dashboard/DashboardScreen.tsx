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
  getDashboardTrend,
  getRepairs,
} from '@/lib/api';

// 4. Components
import CategoryChart from '@/components/Shared_Dashboard/CategoryChart';
import DashboardFilters from '@/components/Shared_Dashboard/DashboardFilters';
import Header from '@/components/Shared_Dashboard/Header';
import MetricCards from '@/components/Shared_Dashboard/MetricCards';
import TrendChart from '@/components/Shared_Dashboard/TrendChart';

interface DashboardScreenProps {
  /** 'staff' or 'manager' — passed to getDashboardMetrics */
  role: 'staff' | 'manager';
}

const STATUS_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'รอตรวจเช็ค', color: '#84CC16', bg: '#F7FEE7' },
  2: { label: 'ตรวจเช็ค', color: '#D97706', bg: '#FFFBEB' },
  3: { label: 'เสนอราคา', color: '#F59E0B', bg: '#FEF3C7' },
  4: { label: 'รออนุมัติ', color: '#A855F7', bg: '#FAF5FF' },
  5: { label: 'รอซ่อม', color: '#3B82F6', bg: '#EFF6FF' },
  6: { label: 'กำลังซ่อม', color: '#0EA5E9', bg: '#F0F9FF' },
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
  const [categoryData, setCategoryData] = useState<{
    pc: number;
    laptop: number;
    printer: number;
    other?: number;
    total?: number;
  }>({ pc: 0, laptop: 0, printer: 0, other: 0, total: 0 });

  // Status Pipeline counts & Recent repairs
  const [statusCounts, setStatusCounts] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  });
  const [recentRepairs, setRecentRepairs] = useState<any[]>([]);

  const fetchOverviewData = useCallback(async () => {
    try {
      const [metricsRes, categoryRes, repairsRes] = await Promise.all([
        getDashboardMetrics(role),
        getDashboardCategory(),
        getRepairs(),
      ]);

      if (metricsRes?.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }

      if (categoryRes?.success && categoryRes.data) {
        setCategoryData(categoryRes.data);
      }

      if (repairsRes?.success && Array.isArray(repairsRes.data)) {
        const allJobs = repairsRes.data;
        const counts: Record<number, number> = {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
        };
        allJobs.forEach((job: any) => {
          const sId = Number(job.status_id);
          if (counts[sId] !== undefined) {
            counts[sId]++;
          }
        });
        setStatusCounts(counts);
        setRecentRepairs(allJobs.slice(0, 5));
      }
    } catch (err) {
      console.error('Dashboard overview fetch error:', err);
    }
  }, [role]);

  // โหลดข้อมูลกราฟแนวโน้ม (เฉพาะกราฟเส้น) ตามตัวกรองที่เลือก
  const fetchTrendData = useCallback(async () => {
    try {
      setIsLoading(true);
      const trendRes = await getDashboardTrend({
        period: timeFilter,
        device_type: deviceType,
        date_start: dateStart,
        date_end: dateEnd,
      });

      if (trendRes?.success && Array.isArray(trendRes.data)) {
        setTrendData(trendRes.data);
      } else {
        setTrendData([]);
      }
    } catch (err) {
      console.error('Trend fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeFilter, deviceType, dateStart, dateEnd]);

  useFocusEffect(
    useCallback(() => {
      fetchOverviewData();
      fetchTrendData();
    }, [fetchOverviewData, fetchTrendData])
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
        {/* KPI Metrics */}
        <MetricCards
          totalRevenue={metrics.totalRevenue}
          totalJobs={metrics.totalJobs}
          completedJobs={metrics.completedJobs}
          pendingJobs={metrics.pendingJobs}
        />

        {/* ── Status Pipeline Distribution Card ── */}
        <View className="mx-4 bg-white rounded-2xl p-4 mb-4 border border-slate-200 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              {/* <View className="w-7 h-7 rounded-lg bg-red-50 items-center justify-center">
                <Ionicons name="git-network-outline" size={16} color="#DC2626" />
              </View> */}
              <Text className="text-sm font-bold text-slate-800 font-heading">
                สถานะงานซ่อมในระบบ (Operations Pipeline)
              </Text>
            </View>
            <Text className="text-xs text-slate-400 font-body">9 ขั้นตอน</Text>
          </View>

          {/* Grid of 9 Statuses */}
          <View className="flex-row flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((sId) => {
              const cfg = STATUS_CONFIG[sId];
              const count = statusCounts[sId] || 0;
              return (
                <View
                  key={sId}
                  className="flex-row items-center justify-between px-3 py-2 rounded-xl border flex-1 min-w-[30%]"
                  style={{ backgroundColor: cfg.bg, borderColor: `${cfg.color}30` }}
                >
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <Text className="text-[11px] font-medium text-slate-700 font-heading" numberOfLines={1}>
                      {cfg.label}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold font-heading ml-2" style={{ color: cfg.color }}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Recent Repairs Feed ── */}
        <View className="mx-4 bg-white rounded-2xl p-4 mb-4 border border-slate-200 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-7 h-7 rounded-lg bg-blue-50 items-center justify-center">
                <Ionicons name="time-outline" size={16} color="#0284C7" />
              </View>
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

        {/* Trend Chart */}
        <TrendChart
          timeFilter={timeFilter}
          data={trendData}
          isLoading={isLoading}
        />

        {/* Category Distribution Chart */}
        <CategoryChart
          pcPercent={categoryData.pc}
          laptopPercent={categoryData.laptop}
          printerPercent={categoryData.printer}
          otherCount={categoryData.other}
          total={categoryData.total}
          isLoading={isLoading}
        />
      </ScrollView>
    </View>
  );
}
