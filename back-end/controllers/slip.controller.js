const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const slipsDir = path.join(__dirname, '..', 'pubilc', 'slips');
if (!fs.existsSync(slipsDir)) {
  fs.mkdirSync(slipsDir, { recursive: true });
}

// Configure multer storage to save into /pubilc with meaningful name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, slipsDir);
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const jobId = req.body?.job_id || req.params?.job_id || 'general';
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const meaningfulName = `slip_job_${jobId}_${dateStr}${ext}`;
    cb(null, meaningfulName);
  },
});

exports.upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('อนุญาตเฉพาะรูปภาพ (jpg, png, webp)'));
  },
});

/**
 * POST /api/slips
 */
exports.create = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดรูปสลิป' });
    }

    const rawFilename = req.file.filename;
    const filename = `slips/${rawFilename}`; // เก็บ path relative ลง DB
    const userId = req.user?.id;
    const jobId = req.body?.job_id;

    const { rows } = await pool.query(
      `INSERT INTO slips_records (user_id, image_url) VALUES ($1, $2) RETURNING *`,
      [userId, filename]
    );

    // หากมี job_id อัปเดตตาราง repair_job ด้วย
    if (jobId) {
      const numJobId = parseInt(jobId, 10);
      if (!isNaN(numJobId)) {
        await pool.query(
          `UPDATE repair_job 
           SET slip_image = $1, payment_method_id = 2, payment_date = CURRENT_DATE 
           WHERE job_id = $2`,
          [filename, numJobId]
        );
      }
    }

    res.status(201).json({ success: true, data: rows[0], filename });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/slips
 */
exports.getAll = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      'SELECT * FROM slips_records WHERE user_id = $1 ORDER BY uploaded_at DESC',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/slips/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return res.status(400).json({ success: false, message: 'ID สลิปไม่ถูกต้อง' });
    }
    const slipId = id.trim();

    const userId = req.user?.id;
    const roleId = req.user?.role_id;

    const { rows } = await pool.query('SELECT * FROM slips_records WHERE id = $1', [slipId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสลิป' });
    }

    const slip = rows[0];
    if (roleId === 4 && slip.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ลบสลิปของลูกค้ารายอื่น' });
    }

    await pool.query('DELETE FROM slips_records WHERE id = $1', [slipId]);
    res.json({ success: true, message: 'ลบสลิปสำเร็จ' });
  } catch (err) {
    next(err);
  }
};
