const router = require('express').Router();
const ctrl = require('../controllers/item.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/items:
 *   get:
 *     tags: [Items]
 *     summary: ดึงรายการอะไหล่/บริการ
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [parts, services] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: รายการ }
 */
router.get('/', auth, ctrl.getAll);

/**
 * @swagger
 * /api/items:
 *   post:
 *     tags: [Items]
 *     summary: เพิ่มอะไหล่/บริการ
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: เพิ่มสำเร็จ }
 */
router.post('/', auth, ctrl.create);

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     tags: [Items]
 *     summary: อัปเดตอะไหล่/บริการ
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
 * /api/items/{id}:
 *   delete:
 *     tags: [Items]
 *     summary: ลบอะไหล่/บริการ
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

module.exports = router;
