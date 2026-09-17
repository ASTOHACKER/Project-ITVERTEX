const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * JWT Authentication Middleware
 * ตรวจสอบ Authorization: Bearer <token> header
 * ถ้า token ถูกต้อง → req.user = { id, email, role_id, role_name }
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ token กรุณาเข้าสู่ระบบ',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!decoded.id || !uuidRegex.test(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้อง',
      });
    }

    // ดึงข้อมูล user จาก database เพื่อให้ได้ข้อมูลล่าสุด
    const { rows } = await pool.query(
      `SELECT p.id, p.email, p.first_name, p.last_name, p.phone, p.role_id, r.name AS role_name
       FROM profiles p
       LEFT JOIN roles r ON p.role_id = r.id
       WHERE p.id = $1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบผู้ใช้งาน token ไม่ถูกต้อง',
      });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้อง',
      });
    }
    next(err);
  }
}

module.exports = authMiddleware;
