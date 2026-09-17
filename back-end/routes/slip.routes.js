const router = require('express').Router();
const ctrl = require('../controllers/slip.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/slips:
 *   post:
 *     tags: [Slips]
 *     summary: อัปโหลดสลิปการชำระเงิน
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               slip: { type: string, format: binary }
 *     responses:
 *       201: { description: อัปโหลดสำเร็จ }
 */
router.post('/', auth, ctrl.upload.single('slip'), ctrl.create);

/**
 * @swagger
 * /api/slips:
 *   get:
 *     tags: [Slips]
 *     summary: ดึงรายการสลิปของ user ปัจจุบัน
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายการสลิป }
 */
router.get('/', auth, ctrl.getAll);

module.exports = router;
