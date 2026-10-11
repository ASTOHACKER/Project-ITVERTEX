const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { ROLES } = require('../constants');

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
  }
  if (!/[A-Z]/.test(password)) {
    return 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)';
  }
  if (!/[a-z]/.test(password)) {
    return 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)';
  }
  if (!/[0-9]/.test(password)) {
    return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว (0-9)';
  }
  return null;
}

/**
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, username, first_name, last_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    const pwdErr = validatePassword(password);
    if (pwdErr) {
      return res.status(400).json({ success: false, message: pwdErr });
    }

    const confirmPwd = req.body.confirm_password || req.body.confirmPassword;
    if (confirmPwd && password !== confirmPwd) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านยืนยันไม่ตรงกับรหัสผ่าน' });
    }

    // ตรวจสอบ email ซ้ำ
    const existing = await pool.query('SELECT id FROM profiles WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้แล้ว' });
    }

    const cleanFirstName = first_name ? String(first_name).trim() : null;
    const cleanLastName = last_name ? String(last_name).trim() : null;
    const cleanPhone = phone ? String(phone).replace(/[^0-9]/g, '').slice(0, 10) : null;

    if (cleanPhone) {
      if (cleanPhone.length < 9 || cleanPhone.length > 10) {
        return res.status(400).json({ success: false, message: 'เบอร์โทรศัพท์ต้องมีความยาว 9-10 หลัก' });
      }
      const dupPhone = await pool.query('SELECT id FROM profiles WHERE phone = $1 LIMIT 1', [cleanPhone]);
      if (dupPhone.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'เบอร์โทรศัพท์นี้ถูกใช้งานในระบบแล้ว' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user (role_id = ROLES.CUSTOMER by default)
    const result = await pool.query(
      `INSERT INTO profiles (email, password, first_name, last_name, phone, role_id)
       VALUES ($1, $2, $3, $4, $5, ${ROLES.CUSTOMER})
       RETURNING id, email, first_name, last_name, phone, role_id`,
      [cleanEmail, hashedPassword, cleanFirstName, cleanLastName, cleanPhone]
    );

    const user = result.rows[0];

    // สร้าง JWT token (หมดอายุ 1 วัน)
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
      data: { token, user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const cleanIdentifier = String(email).trim();

    // ค้นหา user ด้วย email หรือ เบอร์โทรศัพท์อย่างปลอดภัย (ตัด first_name ออกเพื่อความปลอดภัย)
    const query = `
      SELECT p.*, r.name AS role_name 
      FROM profiles p 
      LEFT JOIN roles r ON p.role_id = r.id 
      WHERE LOWER(p.email) = LOWER($1) OR p.phone = $1
    `;
    const result = await pool.query(query, [cleanIdentifier]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = result.rows[0];

    // ตรวจสอบ password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // สร้าง JWT token (หมดอายุ 1 วัน)
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ลบ password ออกจาก response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: { token, user: userWithoutPassword },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.email, p.first_name, p.last_name, p.phone, p.role_id, r.name AS role_name, p.created_at
       FROM profiles p
       LEFT JOIN roles r ON p.role_id = r.id
       WHERE p.id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * ยืนยันตัวตนด้วย email + เบอร์โทร → return reset token
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและเบอร์โทร' });
    }

    const cleanEmail = String(email).trim();
    const cleanPhone = String(phone).replace(/[^0-9]/g, '').slice(0, 10);

    // ตรวจสอบว่า email + phone ตรงกัน
    const result = await pool.query(
      'SELECT id FROM profiles WHERE LOWER(email) = LOWER($1) AND phone = $2',
      [cleanEmail, cleanPhone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ตรงกัน กรุณาตรวจสอบอีเมลและเบอร์โทร' });
    }

    const userId = result.rows[0].id;

    // ลบ token เก่าที่ยังไม่ได้ใช้
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used = false',
      [userId]
    );

    // สร้าง reset token (หมดอายุ 15 นาที)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    res.json({
      success: true,
      message: 'ยืนยันตัวตนสำเร็จ',
      data: { reset_token: token },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 * ใช้ reset token + รหัสผ่านใหม่
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอก token และรหัสผ่านใหม่' });
    }

    const pwdErr = validatePassword(new_password);
    if (pwdErr) {
      return res.status(400).json({ success: false, message: pwdErr });
    }

    // ตรวจสอบ token
    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }

    const resetToken = result.rows[0];

    // Hash password ใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // อัปเดต password
    await pool.query('UPDATE profiles SET password = $1 WHERE id = $2', [hashedPassword, resetToken.user_id]);

    // Mark token as used
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [resetToken.id]);

    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/profile
 * อัปเดตข้อมูลส่วนตัว (first_name, last_name, phone)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const cleanFirstName = first_name !== undefined ? String(first_name).trim() : null;
    const cleanLastName = last_name !== undefined ? String(last_name).trim() : null;
    const cleanPhone = phone !== undefined ? String(phone).replace(/[^0-9]/g, '').slice(0, 10) : null;

    if (cleanPhone) {
      if (cleanPhone.length < 9 || cleanPhone.length > 10) {
        return res.status(400).json({ success: false, message: 'เบอร์โทรศัพท์ต้องมีความยาว 9-10 หลัก' });
      }
      const { rows: dupPhone } = await pool.query(
        'SELECT id FROM profiles WHERE phone = $1 AND id != $2 LIMIT 1',
        [cleanPhone, req.user.id]
      );
      if (dupPhone.length > 0) {
        return res.status(400).json({ success: false, message: 'เบอร์โทรศัพท์นี้ถูกใช้งานในระบบแล้ว' });
      }
    }

    const result = await pool.query(
      `UPDATE profiles
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone)
       WHERE id = $4
       RETURNING id, email, first_name, last_name, phone, role_id`,
      [cleanFirstName, cleanLastName, cleanPhone, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });
    }

    const { rows: roleRows } = await pool.query(
      `SELECT r.name AS role_name FROM roles r WHERE r.id = $1`,
      [result.rows[0].role_id]
    );

    const updatedUser = {
      ...result.rows[0],
      role_name: roleRows[0]?.role_name || '',
    };

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลส่วนตัวสำเร็จ',
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

