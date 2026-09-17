const router = require('express').Router();
const ctrl = require('../controllers/repair.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/repairs:
 *   get:
 *     tags: [Repairs]
 *     summary: ดึงรายการงานซ่อมทั้งหมด
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายการงานซ่อม }
 */
router.get('/', auth, ctrl.getAll);

/**
 * @swagger
 * /api/repairs/{id}:
 *   get:
 *     tags: [Repairs]
 *     summary: ดึงรายละเอียดงานซ่อม
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: รายละเอียดงานซ่อม }
 */
router.get('/:id', auth, ctrl.getById);

/**
 * @swagger
 * /api/repairs:
 *   post:
 *     tags: [Repairs]
 *     summary: สร้างงานซ่อมใหม่
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_id: { type: integer }
 *               symptom: { type: string }
 *               appointment_date: { type: string, format: date }
 *               status_id: { type: integer }
 *     responses:
 *       201: { description: สร้างสำเร็จ }
 */
router.post('/', auth, ctrl.create);

/**
 * @swagger
 * /api/repairs/{id}:
 *   put:
 *     tags: [Repairs]
 *     summary: อัปเดตงานซ่อม (ส่งครบทุก field)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: อัปเดตสำเร็จ }
 */
router.put('/:id', auth, ctrl.update);

/**
 * @swagger
 * /api/repairs/{id}:
 *   delete:
 *     tags: [Repairs]
 *     summary: ลบงานซ่อม
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: ลบสำเร็จ }
 */
router.delete('/:id', auth, ctrl.remove);

/**
 * @swagger
 * /api/repairs/{id}/status:
 *   patch:
 *     tags: [Repairs]
 *     summary: เปลี่ยนสถานะงาน (PATCH — ส่งแค่ status_id)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status_id]
 *             properties:
 *               status_id: { type: integer }
 *     responses:
 *       200: { description: อัปเดตสถานะสำเร็จ }
 */
router.patch('/:id/status', auth, ctrl.updateStatus);

/**
 * @swagger
 * /api/repairs/{id}/detail:
 *   post:
 *     tags: [Repairs]
 *     summary: Log action ประวัติงานซ่อม
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action_type_id]
 *             properties:
 *               action_type_id: { type: integer }
 *     responses:
 *       201: { description: บันทึกสำเร็จ }
 */
router.post('/:id/detail', auth, ctrl.addDetail);

/**
 * @swagger
 * /api/repairs/{id}/signature:
 *   patch:
 *     tags: [Repairs]
 *     summary: อัปเดตลายเซ็นลูกค้ารับเครื่อง
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_receive_signature]
 *             properties:
 *               customer_receive_signature: { type: string }
 *     responses:
 *       200: { description: อัปเดตลายเซ็นสำเร็จ }
 */
router.patch('/:id/signature', auth, ctrl.updateSignature);

module.exports = router;
