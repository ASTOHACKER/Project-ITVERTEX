import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { getRepairs } from '@/lib/api';

interface AppNotification {
  id: string;
  jobId: number | string;
  jobNo: string;
  title: string;
  message: string;
  time: string;
  type: 'quote' | 'repair' | 'ready' | 'info';
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await getRepairs();
      const jobs = res.data || [];

      const notifs: AppNotification[] = [];

      jobs.forEach((job: any) => {
        const jobId = job.id || job.job_id;
        const jobNo = job.job_number || job.job_no || `REP-${jobId}`;
        const device = [job.brand, job.model].filter(Boolean).join(' ') || job.device_type || 'อุปกรณ์ไอที';
        const status = (job.status || job.status_name || '').toLowerCase();
        const statusId = Number(job.status_id);
        const timeStr = job.created_at
          ? new Date(job.created_at).toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'เมื่อเร็วๆ นี้';

        // 1. Quoting / Awaiting Approval
        if (statusId === 4 || status.includes('รอการอนุมัติ') || status.includes('รออนุมัติ')) {
          notifs.push({
            id: `quote-${jobId}`,
            jobId,
            jobNo,
            title: `มีใบเสนอราคารอการอนุมัติ (${jobNo})`,
            message: `ช่างได้ตรวจเช็ค ${device} และส่งใบเสนอราคาแล้ว กรุณากดตรวจสอบและยืนยันการซ่อม`,
            time: timeStr,
            type: 'quote',
            icon: 'receipt',
            color: '#A855F7',
            bgColor: '#F3E8FF',
          });
        }

        // 2. Repair in progress
        if (statusId === 6 || status.includes('กำลังซ่อม') || statusId === 5 || status.includes('อนุมัติแล้ว')) {
          notifs.push({
            id: `repair-${jobId}`,
            jobId,
            jobNo,
            title: `กำลังดำเนินการซ่อม (${jobNo})`,
            message: `ช่างซ่อมกำลังดำเนินการเปลี่ยนอะไหล่และแก้ไขปัญหาให้ ${device} ของคุณ`,
            time: timeStr,
            type: 'repair',
            icon: 'hammer',
            color: '#0284C7',
            bgColor: '#E0F2FE',
          });
        }

        // 3. Ready for pickup / Pending payment
        if (statusId === 7 || status.includes('รอชำระ') || statusId === 8 || status.includes('เสร็จสิ้น')) {
          notifs.push({
            id: `ready-${jobId}`,
            jobId,
            jobNo,
            title: statusId === 8 ? `ซ่อมเสร็จและส่งมอบแล้ว (${jobNo})` : `เครื่องซ่อมเสร็จแล้ว พร้อมรับ (${jobNo})`,
            message:
              statusId === 8
                ? `การซ่อมแซม ${device} เสร็จสิ้นสมบูรณ์ ขอบคุณที่ไว้วางใจใช้บริการ IT VERTEX`
                : `${device} ซ่อมเสร็จเรียบร้อยแล้ว กรุณาชำระเงินและนัดวันรับเครื่องที่ศูนย์บริการ`,
            time: timeStr,
            type: 'ready',
            icon: statusId === 8 ? 'checkmark-circle' : 'gift-outline',
            color: '#16A34A',
            bgColor: '#DCFCE7',
          });
        }

        // 4. Checking
        if (statusId === 1 || statusId === 2 || status.includes('ตรวจเช็ค')) {
          notifs.push({
            id: `check-${jobId}`,
            jobId,
            jobNo,
            title: `รับเครื่องเข้าระบบแล้ว (${jobNo})`,
            message: `ศูนย์บริการได้รับ ${device} เข้าสู่ขั้นตอนตรวจเช็คอาการเสียโดยช่างผู้เชี่ยวชาญ`,
            time: timeStr,
            type: 'info',
            icon: 'shield-checkmark-outline',
            color: '#D97706',
            bgColor: '#FEF3C7',
          });
        }
      });

      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handlePressNotification = (notif: AppNotification) => {
    router.push({
      pathname: '/job-detail',
      params: { id: notif.jobId },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#DC2626" />

      {/* Header */}
      <View className="bg-[#DC2626] px-5 pt-4 pb-6 rounded-b-[28px] shadow-sm">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white/80 text-xs font-bold tracking-wider font-heading uppercase">
              NOTIFICATIONS
            </Text>
            <Text className="text-white text-xl font-bold font-heading mt-0.5">
              การแจ้งเตือนงานซ่อม
            </Text>
          </View>
          <View className="px-3 py-1 bg-white/20 rounded-full">
            <Text className="text-white text-xs font-bold font-heading">
              {notifications.length} รายการ
            </Text>
          </View>
        </View>
      </View>

      {/* Notification List */}
      <View className="flex-1 px-4 pt-3">
        {loading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#DC2626" />
            <Text className="text-slate-400 text-xs font-body mt-2">กำลังโหลดการแจ้งเตือน...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#DC2626']} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePressNotification(item)}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 shadow-sm flex-row items-start gap-3"
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mt-0.5"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-sm font-bold text-slate-800 font-heading flex-1 mr-2" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-[11px] text-slate-400 font-body">{item.time}</Text>
                  </View>

                  <Text className="text-xs text-slate-600 font-body leading-4 mb-2" numberOfLines={2}>
                    {item.message}
                  </Text>

                  <View className="flex-row items-center gap-1">
                    <Text className="text-[11px] font-bold text-[#DC2626] font-heading">
                      แตะเพื่อดูรายละเอียด
                    </Text>
                    <Ionicons name="chevron-forward" size={12} color="#DC2626" />
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="bg-white rounded-2xl p-8 items-center justify-center border border-slate-200 mt-4">
                <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
                  <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
                </View>
                <Text className="text-base font-bold text-slate-700 font-heading mb-1">
                  ไม่มีการแจ้งเตือนใหม่
                </Text>
                <Text className="text-xs text-slate-400 font-body text-center max-w-xs leading-4">
                  เมื่อมีความคืบหน้าของงานซ่อมหรือใบเสนอราคา ระบบจะแจ้งเตือนให้คุณทราบทันที
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
