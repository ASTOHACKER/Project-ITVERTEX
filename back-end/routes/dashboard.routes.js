const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

/**
 * @swagger
 * /api/dashboard/metrics:
 *   get:
 *     tags: [Dashboard]
 *     summary: สรุป metrics (Manager only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date_start
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_end
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: device_type
 *         schema: { type: string, enum: [all, pc, laptop, printer] }
 *     responses:
 *       200: { description: metrics data }
 */
router.get('/metrics', auth, role('Manager', 'Staff'), ctrl.getMetrics);

/**
 * @swagger
 * /api/dashboard/trend:
 *   get:
 *     tags: [Dashboard]
 *     summary: Trend chart data
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [day, month, year] }
 *     responses:
 *       200: { description: trend data }
 */
router.get('/trend', auth, role('Manager', 'Staff'), ctrl.getTrend);

/**
 * @swagger
 * /api/dashboard/category:
 *   get:
 *     tags: [Dashboard]
 *     summary: ข้อมูลแยกตามประเภทอุปกรณ์
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: category data }
 */
router.get('/category', auth, role('Manager', 'Staff'), ctrl.getCategory);

module.exports = router;
