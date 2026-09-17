import { Colors } from '@/constants/theme';

/** All 9 repair status definitions */
export const STATUS_DEFINITIONS = [
  { id: '1', statusId: 1, title: 'รอตรวจเช็ค', color: Colors.status.status1 },
  { id: '2', statusId: 2, title: 'ดำเนินการตรวจเช็ค', color: Colors.status.status2 },
  { id: '3', statusId: 3, title: 'ดำเนินการเสนอราคา', color: Colors.status.status3 },
  { id: '4', statusId: 4, title: 'รอการอนุมัติ', color: Colors.status.status4 },
  { id: '5', statusId: 5, title: 'อนุมัติแล้ว/รอซ่อม', color: Colors.status.status5 },
  { id: '6', statusId: 6, title: 'กำลังซ่อม', color: Colors.status.status6 },
  { id: '7', statusId: 7, title: 'รอชำระ', color: Colors.status.status7 },
  { id: '8', statusId: 8, title: 'เสร็จสิ้น', color: Colors.status.status8 },
  { id: '9', statusId: 9, title: 'ยกเลิกซ่อม', color: Colors.status.status9 },
] as const;

/**
 * Get status definitions filtered by allowed status IDs.
 * If no filter, returns all statuses.
 */
export function getStatusDefinitions(filterStatusIds?: number[]) {
  if (!filterStatusIds || filterStatusIds.length === 0) {
    return STATUS_DEFINITIONS;
  }
  return STATUS_DEFINITIONS.filter((s) => filterStatusIds.includes(s.statusId));
}
