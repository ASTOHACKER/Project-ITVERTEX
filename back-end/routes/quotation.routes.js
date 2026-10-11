const router = require('express').Router();
const ctrl = require('../controllers/quotation.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

/**
 * Quotation Routes
 * - GET    /api/quotations          : ดูรายการทั้งหมด (Customer เห็นเฉพาะของตนเอง, Tech/Staff/Manager เห็นทั้งหมด)
 * - POST   /api/quotations          : ช่าง/ผู้จัดการสร้างใบเสนอราคา
 * - GET    /api/quotations/:id      : ดูรายละเอียดใบเสนอราคา
 * - PUT    /api/quotations/:id      : ช่าง/ผู้จัดการแก้ไขใบเสนอราคา (เฉพาะที่ยังไม่อนุมัติ)
 * - DELETE /api/quotations/:id      : ช่าง/ผู้จัดการลบใบเสนอราคา (เฉพาะที่ยังไม่อนุมัติ)
 * - PATCH  /api/quotations/:id/status: อัปเดตสถานะ (ลูกค้ากดอนุมัติ/ยกเลิก หรือ ช่าง/ผู้จัดการเปลี่ยนสถานะ)
 */
router.get('/', auth, ctrl.getAll);
router.post('/', auth, role('Technician', 'Manager'), ctrl.create);
router.get('/:id', auth, ctrl.getById);
router.put('/:id', auth, role('Technician', 'Manager'), ctrl.update);
router.delete('/:id', auth, role('Technician', 'Manager'), ctrl.delete);
router.patch('/:id/status', auth, ctrl.updateStatus);

module.exports = router;

