const router = require('express').Router();
const ctrl = require('../controllers/quotation.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/quotations:
 *   post:
 *     tags: [Quotations]
 *     summary: สร้างใบเสนอราคา
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: สร้างสำเร็จ }
 */
router.get('/', auth, ctrl.getAll);
router.post('/', auth, ctrl.create);
router.get('/:id', auth, ctrl.getById);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.delete);
router.patch('/:id/status', auth, ctrl.updateStatus);

module.exports = router;
