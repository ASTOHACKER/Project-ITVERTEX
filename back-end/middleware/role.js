/**
 * Role-based Access Control Middleware
 * ใช้ต่อจาก authMiddleware เพื่อตรวจสอบว่า user มี role ที่อนุญาต
 *
 * ตัวอย่างการใช้: router.get('/staff', auth, role('Manager'), controller.getAll)
 *
 * @param  {...string} allowedRoles - ชื่อ role ที่อนุญาต เช่น 'Manager', 'Staff', 'Tech'
 */
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'ไม่ได้เข้าสู่ระบบ',
      });
    }

    const userRole = req.user.role_name;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `ไม่มีสิทธิ์เข้าถึง (ต้องเป็น ${allowedRoles.join(' หรือ ')})`,
      });
    }

    next();
  };
}

module.exports = roleMiddleware;
