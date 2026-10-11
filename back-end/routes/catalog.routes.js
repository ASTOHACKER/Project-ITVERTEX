const router = require('express').Router();
const ctrl = require('../controllers/catalog.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// ============================================================
// 1. Device Types (ประเภทอุปกรณ์)
// ============================================================
router.get('/device-types', auth, ctrl.getAllDeviceTypes);
router.post('/device-types', auth, role('Manager'), ctrl.createDeviceType);
router.put('/device-types/:id', auth, role('Manager'), ctrl.updateDeviceType);
router.delete('/device-types/:id', auth, role('Manager'), ctrl.deleteDeviceType);

// ============================================================
// 2. Brands (ยี่ห้อ)
// ============================================================
router.get('/brands', auth, ctrl.getAllBrands);
router.post('/brands', auth, role('Manager'), ctrl.createBrand);
router.put('/brands/:id', auth, role('Manager'), ctrl.updateBrand);
router.delete('/brands/:id', auth, role('Manager'), ctrl.deleteBrand);

// ============================================================
// 3. Models (รุ่นอุปกรณ์)
// ============================================================
router.get('/models', auth, ctrl.getAllModels);
router.post('/models', auth, role('Manager'), ctrl.createModel);
router.put('/models/:id', auth, role('Manager'), ctrl.updateModel);
router.delete('/models/:id', auth, role('Manager'), ctrl.deleteModel);

module.exports = router;
