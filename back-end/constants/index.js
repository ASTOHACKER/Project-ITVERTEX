/**
 * constants/index.js
 * รวมค่าคงที่ (Constants / Enums) สำหรับระบบทั้งหมด
 * เพื่อป้องกัน Magic Numbers และการ Hardcode ตัวเลขใน SQL และ Controllers
 */

// 1. สิทธิ์การใช้งานระบบ (Roles)
exports.ROLES = {
  MANAGER: 1,      // ผู้จัดการ
  STAFF: 2,        // พนักงานหน้าร้าน
  TECHNICIAN: 3,   // ช่างเทคนิค
  CUSTOMER: 4,     // ลูกค้าทั่วไป
};

// 2. สถานะงานซ่อม (Repair Status Lifecycle)
exports.REPAIR_STATUS = {
  PENDING_CHECK: 1,         // รอตรวจเช็ค
  CHECKING: 2,              // ดำเนินการตรวจเช็ค
  MAKING_QUOTE: 3,          // ดำเนินการเสนอราคา
  PENDING_APPROVAL: 4,      // รอการอนุมัติ
  APPROVED_WAIT_REPAIR: 5,  // อนุมัติแล้ว/รอซ่อม (รวมกำลังซ่อม)
  READY_FOR_PICKUP: 6,      // รอลูกค้ามารับเครื่อง (ตรวจสอบการชำระเงินแล้ว)
  WAITING_PAYMENT: 7,       // รอชำระ
  COMPLETED: 8,             // เสร็จสิ้น (ส่งมอบ/เซ็นรับแล้ว นำยอดเงินไปคำนวณ)
  CANCELLED: 9,             // ยกเลิกซ่อม
};

// 3. สถานะใบเสนอราคา (Quotation Status)
exports.QUOTE_STATUS = {
  PENDING: 1,               // รอลูกค้าอนุมัติ
  APPROVED: 2,              // ลูกค้าอนุมัติแล้ว
  CANCELLED: 3,             // ลูกค้ายกเลิก
  CHANGE_REQUEST: 4,        // ขอแก้ไข/เพิ่มเติมรายการ
};

// 4. ประเภทประวัติการกระทำ (Action Log Types)
exports.ACTION_TYPES = {
  RECEIVE_DEVICE: 1,        // รับเครื่องเข้าระบบ
  START_INSPECT: 2,         // ช่างเริ่มตรวจเช็ค
  CREATE_QUOTE: 3,          // ช่างออกใบเสนอราคา
  START_REPAIR: 4,          // ช่างเริ่มซ่อม
  FINISH_REPAIR: 5,         // ช่างซ่อมเสร็จ
  PAYMENT_PROCESS: 6,       // บันทึก/อัปเดตการชำระเงิน
  HANDOVER: 7,              // ส่งมอบเครื่องให้ลูกค้า
  CUSTOMER_CANCEL: 8,       // ลูกค้ายกเลิกการซ่อม
};

// 5. ประเภทรายการในใบเสนอราคา (Item Types)
exports.ITEM_TYPES = {
  PART: 1,                  // อะไหล่
  SERVICE: 2,               // ค่าบริการ / ค่าแรง
};

// 6. วิธีการชำระเงิน (Payment Methods)
exports.PAYMENT_METHODS = {
  CASH: 1,                  // เงินสดหน้าร้าน
  TRANSFER: 2,              // โอนเงินผ่านธนาคาร
};

// 7. ค่าบริการเริ่มต้นมาตรฐาน (Default Pricing)
exports.DEFAULTS = {
  CANCEL_INSPECTION_FEE: 300, // ค่าตรวจเช็คกรณีลูกค้ายกเลิกการซ่อม (บาท)
};
