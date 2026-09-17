const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

/**
 * @swagger
 * /api/payments:
 *   post:
 *     tags: [Payments]
 *     summary: บันทึกการชำระเงิน (เงินสด หรือ อัปโหลดสลิป)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               job_id: { type: integer }
 *               payment_method: { type: string, enum: [cash, transfer] }
 *               pickup_date: { type: string, format: date }
 *               slip_image: { type: string, format: binary }
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               job_id: { type: integer }
 *               payment_method: { type: string, enum: [cash, transfer] }
 *               pickup_date: { type: string, format: date }
 *     responses:
 *       201: { description: บันทึกการชำระเงินสำเร็จ }
 */
router.post('/', auth, ctrl.upload.single('slip_image'), ctrl.create);

/**
 * @swagger
 * /api/payments/{jobId}/verify:
 *   patch:
 *     tags: [Payments]
 *     summary: พนักงานยืนยันการชำระเงินถูกต้อง
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: ยืนยันสำเร็จ }
 */
router.patch('/:jobId/verify', auth, role('Staff', 'Manager'), ctrl.verify);

/**
 * @swagger
 * /api/payments/{jobId}/reject:
 *   patch:
 *     tags: [Payments]
 *     summary: พนักงานปฏิเสธการชำระเงิน (ให้ลูกค้าส่งใหม่)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, description: เหตุผลการปฏิเสธ }
 *     responses:
 *       200: { description: ปฏิเสธสำเร็จ }
 */
router.patch('/:jobId/reject', auth, role('Staff', 'Manager'), ctrl.reject);

module.exports = router;
