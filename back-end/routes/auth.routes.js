const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: สมัครสมาชิก
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: ลงทะเบียนสำเร็จ }
 *       409: { description: อีเมลซ้ำ }
 */
router.post('/register', ctrl.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: เข้าสู่ระบบ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: เข้าสู่ระบบสำเร็จ — return JWT token }
 *       401: { description: อีเมลหรือรหัสผ่านไม่ถูกต้อง }
 */
router.post('/login', ctrl.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: ดึงข้อมูล user ปัจจุบัน
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: ข้อมูล user }
 */
router.get('/me', auth, ctrl.getMe);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: ลืมรหัสผ่าน — ยืนยันตัวตนด้วย email + เบอร์โทร
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, phone]
 *             properties:
 *               email: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200: { description: ยืนยันสำเร็จ — return reset_token }
 *       404: { description: ไม่พบข้อมูลที่ตรงกัน }
 */
router.post('/forgot-password', ctrl.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: รีเซ็ตรหัสผ่านด้วย token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, new_password]
 *             properties:
 *               token: { type: string }
 *               new_password: { type: string }
 *     responses:
 *       200: { description: เปลี่ยนรหัสผ่านสำเร็จ }
 */
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
