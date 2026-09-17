const router = require('express').Router();
const ctrl = require('../controllers/lookup.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/lookup/statuses:
 *   get:
 *     tags: [Lookup]
 *     summary: ดึงสถานะงานซ่อมทั้งหมด
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายการสถานะ }
 */
router.get('/statuses', auth, ctrl.getStatuses);

/**
 * @swagger
 * /api/lookup/action-types:
 *   get:
 *     tags: [Lookup]
 *     summary: ดึงประเภท action ทั้งหมด
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายการ action types }
 */
router.get('/action-types', auth, ctrl.getActionTypes);

/**
 * @swagger
 * /api/lookup/payment-methods:
 *   get:
 *     tags: [Lookup]
 *     summary: ดึงวิธีชำระเงินทั้งหมด
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายการวิธีชำระเงิน }
 */
router.get('/payment-methods', auth, ctrl.getPaymentMethods);

/**
 * @swagger
 * /api/lookup/item-types:
 *   get:
 *     tags: [Lookup]
 *     summary: ดึงประเภทอะไหล่ทั้งหมด
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายการประเภทอะไหล่ }
 */
router.get('/item-types', auth, ctrl.getItemTypes);

/**
 * @swagger
 * /api/lookup/quotation-statuses:
 *   get:
 *     tags: [Lookup]
 *     summary: ดึงสถานะใบเสนอราคาทั้งหมด
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายการสถานะใบเสนอราคา }
 */
router.get('/quotation-statuses', auth, ctrl.getQuotationStatuses);

/**
 * @swagger
 * /api/lookup/device-types:
 *   get:
 *     tags: [Lookup]
 *     summary: ดึงประเภทอุปกรณ์ทั้งหมด
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายการประเภทอุปกรณ์ }
 */
router.get('/device-types', auth, ctrl.getDeviceTypes);

/**
 * @swagger
 * /api/lookup/brands:
 *   get:
 *     tags: [Lookup]
 *     summary: ดึงยี่ห้อทั้งหมด
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: รายการยี่ห้อ }
 */
router.get('/brands', auth, ctrl.getBrands);
router.get('/models', auth, ctrl.getModels);


/**
 * @swagger
 * /api/lookup/profiles:
 *   get:
 *     tags: [Lookup]
 *     summary: ค้นหา profiles (autocomplete)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: คำค้นหา (อย่างน้อย 2 ตัวอักษร)
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [name, phone] }
 *     responses:
 *       200: { description: รายการ profiles }
 */
router.get('/profiles', auth, ctrl.searchProfiles);

module.exports = router;
