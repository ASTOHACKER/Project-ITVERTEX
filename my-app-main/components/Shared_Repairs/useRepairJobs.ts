import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getRepairs } from '@/lib/api';
import { getStatusDefinitions } from './statusConfig';
import type { RepairItem, StatusGroup } from './types';

interface UseRepairJobsOptions {
  /** Only include these status IDs. If empty/undefined, includes all. */
  filterStatusIds?: number[];
  /** Polling interval in ms. Default 5000. */
  pollingInterval?: number;
}

/**
 * Shared hook that fetches repair jobs, groups them by status,
 * provides search filtering, and auto-polls.
 */
export function useRepairJobs(options: UseRepairJobsOptions = {}) {
  const { filterStatusIds, pollingInterval = 5000 } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [statusGroups, setStatusGroups] = useState<StatusGroup[]>([]);
  const [searchText, setSearchText] = useState('');
  // จำว่าโหลดครั้งแรกแล้วหรือยัง — refresh รอบหลังต้องเงียบ (ไม่โชว์ spinner เต็มจอจน list โดนถอด)
  const hasLoadedRef = useRef(false);

  const statusDefs = getStatusDefinitions(filterStatusIds);

  const fetchRepairJobs = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await getRepairs();

      if (!res.success) {
        console.error('Error fetching repair jobs:', res.message);
        return;
      }

      // Build groups map
      const groupsMap: Record<string, RepairItem[]> = {};
      statusDefs.forEach((s) => {
        groupsMap[String(s.statusId)] = [];
      });

      (res.data || []).forEach((row: any) => {
        let stId = row.status_id;
        // หากหน้าจอที่เรียกใช้ไม่ได้กรอง status 6 แยกไว้ ให้รวมอยู่กับ 5 (อนุมัติแล้ว/รอซ่อม)
        if (stId === 6 && !groupsMap['6']) stId = 5;

        // Skip if this status is not in our filter
        if (!groupsMap[String(stId)]) return;

        const statusDef = statusDefs.find((s) => s.statusId === stId);

        let formattedDate = '-';
        if (row.created_at) {
          const d = new Date(row.created_at);
          formattedDate = d.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        }

        const item: RepairItem = {
          id: String(row.job_id),
          job_no: `REP-${String(row.job_id).padStart(6, '0')}`,
          customer_name:
            `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'ไม่ระบุชื่อ',
          phone: row.phone || 'ไม่ระบุเบอร์',
          device_type: row.device_type || 'อุปกรณ์',
          device:
            `${row.brand || ''} ${row.model || ''}`.trim() || row.device_type || 'อุปกรณ์',
          brand: row.brand || '',
          model: row.model || '',
          symptom: row.symptoms || row.symptom_details || row.symptom || '',
          actual_symptom: row.actual_symptom || '',
          total_amount: row.total_amount,
          created_at: row.created_at,
          status: statusDef?.title || 'รอตรวจเช็ค',
          status_id: stId,
          price: Number(row.total_amount) || 0,
          date: formattedDate,
          technician: row.technician_name || 'ช่างประจำศูนย์',
        };

        groupsMap[String(stId)].push(item);
      });

      const formattedGroups: StatusGroup[] = statusDefs.map((def) => ({
        id: def.id,
        statusId: def.statusId,
        title: def.title,
        color: def.color,
        items: groupsMap[String(def.statusId)] || [],
      }));

      setStatusGroups(formattedGroups);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to fetch repair jobs:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const [filterDate, setFilterDate] = useState<Date | null>(null);

  // Auto-fetch on focus + poll (รอบหลังโหลดครั้งแรกให้เงียบ — กัน list โดนถอดจน state กาง/พับหาย)
  useFocusEffect(
    useCallback(() => {
      fetchRepairJobs(hasLoadedRef.current);
      const interval = setInterval(() => fetchRepairJobs(true), pollingInterval);
      return () => clearInterval(interval);
    }, [fetchRepairJobs, pollingInterval])
  );

  // Search & Date filter
  const getFilteredGroups = useCallback((): StatusGroup[] => {
    return statusGroups.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // Text search
        if (searchText.trim()) {
          const s = searchText.toLowerCase();
          const matchesText =
            item.job_no.toLowerCase().includes(s) ||
            item.customer_name.toLowerCase().includes(s) ||
            item.phone.includes(s) ||
            (item.device || '').toLowerCase().includes(s);
          if (!matchesText) return false;
        }

        // Date filter
        if (filterDate) {
          const itemDate = item.created_at ? new Date(item.created_at) : null;
          if (!itemDate) return false;
          const sameDay =
            itemDate.getFullYear() === filterDate.getFullYear() &&
            itemDate.getMonth() === filterDate.getMonth() &&
            itemDate.getDate() === filterDate.getDate();
          if (!sameDay) return false;
        }

        return true;
      }),
    }));
  }, [searchText, filterDate, statusGroups]);

  // Manual refresh (pull-to-refresh มี spinner ของตัวเองอยู่แล้ว → เอาแบบเงียบ)
  const refetch = useCallback(() => fetchRepairJobs(true), [fetchRepairJobs]);

  return {
    isLoading,
    statusGroups,
    searchText,
    setSearchText,
    filterDate,
    setFilterDate,
    filteredGroups: getFilteredGroups(),
    refetch,
  };
}
