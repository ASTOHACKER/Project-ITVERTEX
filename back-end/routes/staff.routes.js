const router = require('express').Router();
const ctrl = require('../controllers/staff.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

/**
 * @swagger
 * /api/staff:
 *   get:
 *     tags: [Staff]
 *     summary: ดึงรายชื่อพนักงานทั้งหมด (Manager only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายชื่อ }
 */
router.get('/', auth, role('Manager'), ctrl.getAll);

/**
 * @swagger
 * /api/staff/{id}:
 *   put:
 *     tags: [Staff]
 *     summary: อัปเดตข้อมูลพนักงาน (Manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               phone: { type: string }
 *               role_id: { type: integer, description: "1=Manager, 2=Staff, 3=Tech, 4=Customer" }
 *     responses:
 *       200: { description: อัปเดตสำเร็จ }
 */
router.put('/:id', auth, role('Manager'), ctrl.update);

module.exports = router;
