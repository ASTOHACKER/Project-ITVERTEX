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

/**
 * @swagger
 * /api/dashboard/team-performance:
 *   get:
 *     tags: [Dashboard]
 *     summary: ประสิทธิภาพการทำงานของทีมรายบุคคล (Bar Chart)
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
 *       200: { description: team performance data }
 */
router.get('/team-performance', auth, role('Manager', 'Staff'), ctrl.getTeamPerformance);

/**
 * @swagger
 * /api/dashboard/work-activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: วันเคลื่อนงานรายบุคคล (ใช้แทนการลงเวลาเข้างาน)
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
 *       200: { description: work activity data }
 */
router.get('/work-activity', auth, role('Manager', 'Staff'), ctrl.getWorkActivity);

/**
 * @swagger
 * /api/dashboard/symptoms:
 *   get:
 *     tags: [Dashboard]
 *     summary: อาการเสียที่พบบ่อย (จัดกลุ่มคีย์เวิร์ด)
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
 *       200: { description: symptoms data }
 */
router.get('/symptoms', auth, role('Manager', 'Staff'), ctrl.getSymptoms);

/**
 * @swagger
 * /api/dashboard/parts-usage:
 *   get:
 *     tags: [Dashboard]
 *     summary: สถิติการใช้อะไหล่ในงานซ่อม (กี่ชิ้น)
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
 *       200: { description: parts usage data }
 */
router.get('/parts-usage', auth, role('Manager', 'Staff'), ctrl.getPartsUsage);

module.exports = router;


