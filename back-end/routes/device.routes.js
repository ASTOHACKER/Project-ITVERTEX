const router = require('express').Router();
const ctrl = require('../controllers/device.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/devices:
 *   get:
 *     tags: [Devices]
 *     summary: ดึงรายการอุปกรณ์
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         schema: { type: string }
 *         description: กรองตาม customer UUID
 *     responses:
 *       200: { description: รายการอุปกรณ์ }
 */
router.get('/', auth, ctrl.getAll);

/**
 * @swagger
 * /api/devices:
 *   post:
 *     tags: [Devices]
 *     summary: สร้างอุปกรณ์ใหม่
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: สร้างสำเร็จ }
 */
router.post('/', auth, ctrl.create);

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     tags: [Devices]
 *     summary: อัปเดตอุปกรณ์
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

module.exports = router;
