/**
 * constants/status.ts
 * รวมค่าคงที่สำหรับสถานะงานซ่อม และสิทธิ์ของผู้ใช้งานในระบบ
 * ป้องกัน Magic Numbers ในหน้าจอต่างๆ
 */

export const REPAIR_STATUS = {
  PENDING_CHECK: 1,        // รอตรวจเช็ค
  CHECKING: 2,             // ดำเนินการตรวจเช็ค
  MAKING_QUOTE: 3,         // ดำเนินการเสนอราคา
  PENDING_APPROVAL: 4,     // รอการอนุมัติ
  APPROVED_WAIT_REPAIR: 5, // อนุมัติแล้ว/รอซ่อม (รวมกำลังซ่อม)
  READY_FOR_PICKUP: 6,     // รอลูกค้ามารับเครื่อง (ตรวจสอบการชำระเงินแล้ว)
  WAITING_PAYMENT: 7,      // รอชำระ
  COMPLETED: 8,            // เสร็จสิ้น (ส่งมอบ/เซ็นรับแล้ว นำยอดเงินไปคำนวณ)
  CANCELLED: 9,            // ยกเลิกซ่อม
} as const;

export const QUOTE_STATUS = {
  PENDING: 1,              // รอลูกค้าอนุมัติ
  APPROVED: 2,             // ลูกค้าอนุมัติแล้ว
  CANCELLED: 3,            // ลูกค้ายกเลิก
  CHANGE_REQUEST: 4,       // ขอแก้ไข/เพิ่มเติมรายการ
} as const;

export const ROLES = {
  MANAGER: 1,
  STAFF: 2,
  TECHNICIAN: 3,
  CUSTOMER: 4,
} as const;

export const PAYMENT_METHODS = {
  CASH: 1,
  TRANSFER: 2,
} as const;

export const CANCEL_INSPECTION_FEE = 300;
