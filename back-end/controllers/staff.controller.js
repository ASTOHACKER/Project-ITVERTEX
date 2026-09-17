const pool = require('../config/db');

/**
 * GET /api/staff
 */
exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.email, p.first_name, p.last_name, p.phone, p.role_id, r.name AS role_name, p.created_at
       FROM profiles p
       LEFT JOIN roles r ON p.role_id = r.id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/staff/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ success: false, message: 'ID ผู้ใช้งานไม่ถูกต้อง' });
    }

    const { first_name, last_name, phone, role_id } = req.body;
    const cleanFirstName = first_name ? String(first_name).trim() : null;
    const cleanLastName = last_name ? String(last_name).trim() : null;
    const cleanPhone = phone ? String(phone).replace(/[^0-9]/g, '').slice(0, 10) : null;
    const parsedRoleId = role_id !== undefined ? parseInt(role_id, 10) : null;

    const { rows } = await pool.query(
      `UPDATE profiles 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           role_id = COALESCE($4, role_id)
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, role_id`,
      [cleanFirstName, cleanLastName, cleanPhone, isNaN(parsedRoleId) ? null : parsedRoleId, id.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
