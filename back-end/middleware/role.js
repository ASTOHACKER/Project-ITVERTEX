/**
 * Role-based Access Control Middleware
 * ใช้ต่อจาก authMiddleware เพื่อตรวจสอบว่า user มี role ที่อนุญาต
 *
 * ตัวอย่างการใช้: router.get('/staff', auth, role('Manager', 'Staff'), controller.getAll)
 *
 * @param  {...(string|number)} allowedRoles - ชื่อ role หรือ role_id ที่อนุญาต เช่น 'Manager', 'Staff', 'Technician', 'Customer'
 */
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'ไม่ได้เข้าสู่ระบบ',
      });
    }

    const userRoleName = (req.user.role_name || '').toLowerCase();
    const userRoleId = req.user.role_id;

    const isAllowed = allowedRoles.some((role) => {
      if (typeof role === 'number') {
        return role === userRoleId;
      }
      const roleStr = String(role).toLowerCase();
      return roleStr === userRoleName || (roleStr === 'tech' && userRoleName === 'technician');
    });

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `ไม่มีสิทธิ์เข้าถึง (ต้องเป็น ${allowedRoles.join(' หรือ ')})`,
      });
    }

    next();
  };
}

module.exports = roleMiddleware;

