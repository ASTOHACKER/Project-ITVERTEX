const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure pubilc/slips directory exists
const slipsDir = path.join(__dirname, '..', 'pubilc', 'slips');
if (!fs.existsSync(slipsDir)) {
  fs.mkdirSync(slipsDir, { recursive: true });
}

// Multer memory storage so req.body (job_id, job_no) is fully available
const storage = multer.memoryStorage();

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
 * POST /api/payments
 * บันทึกการชำระเงิน (รองรับทั้งเงินสด และการโอนพร้อมสลิป)
 */
exports.create = async (req, res, next) => {
  try {
    const { job_id, job_no, payment_method, pickup_date } = req.body;
    const userId = req.user?.id;

    const numJobId = parseInt(job_id, 10);
    if (isNaN(numJobId) || numJobId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรหัสงานซ่อมที่ถูกต้อง' });
    }

    const cleanJobCode = (() => {
      if (job_no && typeof job_no === 'string' && job_no.trim()) {
        return job_no.trim().replace(/[^a-zA-Z0-9_-]/g, '');
      }
      return `REP-${String(numJobId).padStart(6, '0')}`;
    })();

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    let slipFilename = null;

    // 1. จัดการรูปภาพสลิป (บันทึกเป็นชื่อไฟล์ที่สื่อความหมาย slip_REP-XXXXXX_date.ext)
    if (req.file && req.file.buffer) {
      const ext = (path.extname(req.file.originalname) || '.jpg').toLowerCase();
      slipFilename = `slips/slip_${cleanJobCode}_${dateStr}${ext}`;
      fs.writeFileSync(path.join(__dirname, '..', 'pubilc', slipFilename), req.file.buffer);
    } else if (req.body.slip_image && typeof req.body.slip_image === 'string' && req.body.slip_image.includes('base64,')) {
      const parts = req.body.slip_image.split(';base64,');
      let ext = '.jpg';
      if (parts[0].includes('png')) ext = '.png';
      else if (parts[0].includes('webp')) ext = '.webp';
      slipFilename = `slips/slip_${cleanJobCode}_${dateStr}${ext}`;
      fs.writeFileSync(path.join(__dirname, '..', 'pubilc', slipFilename), Buffer.from(parts[1], 'base64'));
    } else if (req.body.slip_image && typeof req.body.slip_image === 'string' && !req.body.slip_image.includes('/') && !req.body.slip_image.includes('\\')) {
      slipFilename = req.body.slip_image;
    }

    const paymentMethodId = payment_method === 'transfer' ? 2 : 1; // 1: Cash, 2: Transfer

    if (paymentMethodId === 2 && !slipFilename) {
      return res.status(400).json({ success: false, message: 'กรุณาแนบรูปภาพสลิปหลักฐานการโอนเงิน' });
    }

    // ตรวจสอบว่างานซ่อมเสร็จสิ้นไปแล้วหรือลูกค้าเคยส่งข้อมูลไปแล้วหรือไม่ (กดแล้วเปลี่ยนไม่ได้)
    const { rows: currentRows } = await pool.query(
      'SELECT status_id, payment_method_id FROM repair_job WHERE job_id = $1',
      [numJobId]
    );
      if (currentRows.length > 0) {
        const curr = currentRows[0];
        if (curr.status_id === 8) {
          return res.status(400).json({ success: false, message: 'งานซ่อมนี้ส่งมอบเสร็จสิ้นแล้ว ไม่สามารถแก้ไขข้อมูลการชำระเงินได้' });
        }
        // ถ้าลูกค้าเคยส่งแล้ว (มี payment_method_id) และผู้เรียกเป็น customer (role_id === 4) ไม่อนุญาตให้เปลี่ยน
        if (curr.payment_method_id && req.user && req.user.role_id === 4) {
          return res.status(400).json({ success: false, message: 'คุณได้ยืนยันการชำระเงินไปแล้ว ข้อมูลถูกล็อกและไม่สามารถแก้ไขได้' });
        }
      }

      // 2. อัปเดตตาราง repair_job: ดันสถานะเป็น 7 (รอชำระ) พร้อมบันทึกช่องทาง, วันนัดรับ และชื่อไฟล์สลิป (เคลียร์เหตุผลการปฏิเสธเดิมออก)
      await pool.query(
        `UPDATE repair_job
         SET status_id = 7,
             payment_method_id = $1,
             payment_date = CURRENT_DATE,
             slip_image = COALESCE($2, slip_image),
             appointment_date = CASE 
               WHEN $3::text IS NOT NULL AND $3::text != '' AND $3::text != 'undefined' AND $3::text != 'null' 
               THEN $3::date 
               ELSE appointment_date 
             END,
             payment_verified = false,
             payment_reject_reason = NULL
         WHERE job_id = $4`,
        [paymentMethodId, slipFilename, pickup_date || null, numJobId]
      );

      // 3. บันทึก action log ประวัติการชำระเงิน (action_type_id: 6 = รับชำระเงิน)
      try {
        await pool.query(
          `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date)
           VALUES ($1, $2, 6, CURRENT_DATE)`,
          [numJobId, userId || null]
        );
      } catch (logErr) {
        console.warn('Could not log payment action detail:', logErr.message);
      }

    // 4. บันทึกลง slips_records ถ้ามีไฟล์สลิป
    if (slipFilename) {
      try {
        await pool.query(
          `INSERT INTO slips_records (user_id, image_url) VALUES ($1, $2)`,
          [userId || null, slipFilename]
        );
      } catch (slipErr) {
        console.warn('Could not record slip in slips_records:', slipErr.message);
      }
    }

    res.json({
      success: true,
      message: 'บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว',
      data: {
        job_id: numJobId,
        job_number: cleanJobCode,
        payment_method_id: paymentMethodId,
        slip_filename: slipFilename,
        pickup_date: pickup_date || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/payments/:jobId/verify
 * พนักงานยืนยันว่าการชำระเงินถูกต้อง → อนุญาตให้ไปหน้าส่งมอบเครื่องได้
 * เปลี่ยน payment_verified = true ใน repair_job
 */
exports.verify = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: 'job_id ไม่ถูกต้อง' });
    }

    const userId = req.user?.id;

    // อัปเดตสถานะว่าพนักงานยืนยันการชำระเงินแล้ว
    const { rows } = await pool.query(
      `UPDATE repair_job 
       SET payment_verified = true, payment_verified_by = $1, payment_verified_at = NOW()
       WHERE job_id = $2
       RETURNING *`,
      [userId, jobId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    // บันทึก action log (action_type_id: 6 = ยืนยันการชำระเงิน)
    try {
      await pool.query(
        `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
         VALUES ($1, $2, 6, CURRENT_DATE, $3)`,
        [jobId, userId, 'พนักงานยืนยันการชำระเงินถูกต้อง']
      );
    } catch (logErr) {
      console.warn('Could not log verify action:', logErr.message);
    }

    res.json({
      success: true,
      message: 'ยืนยันการชำระเงินเรียบร้อยแล้ว',
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/payments/:jobId/reject
 * พนักงานปฏิเสธการชำระเงิน (เช่น สลิปไม่ชัด, ยอดไม่ตรง)
 * → ลบ payment_method_id, slip_image ออก เพื่อให้ลูกค้าส่งใหม่ได้
 */
exports.reject = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.jobId, 10);
    if (isNaN(jobId) || jobId <= 0) {
      return res.status(400).json({ success: false, message: 'job_id ไม่ถูกต้อง' });
    }

    const rawReason = req.body.reason ? String(req.body.reason).trim().slice(0, 500) : null;
    const cleanReason = rawReason || 'สลิปไม่ชัดเจน / ยอดไม่ตรง';
    const userId = req.user?.id;

    // รีเซ็ตข้อมูลการชำระเงิน ให้ลูกค้าส่งใหม่ได้
    const { rows } = await pool.query(
      `UPDATE repair_job 
       SET payment_method_id = NULL, 
           slip_image = NULL, 
           payment_date = NULL,
           payment_verified = false,
           payment_verified_by = NULL,
           payment_verified_at = NULL,
           payment_reject_reason = $1
       WHERE job_id = $2
       RETURNING *`,
      [cleanReason, jobId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    // บันทึก action log
    try {
      await pool.query(
        `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
         VALUES ($1, $2, 6, CURRENT_DATE, $3)`,
        [jobId, userId, `พนักงานปฏิเสธการชำระเงิน: ${cleanReason}`]
      );
    } catch (logErr) {
      console.warn('Could not log reject action:', logErr.message);
    }

    res.json({
      success: true,
      message: 'ปฏิเสธการชำระเงินเรียบร้อย ลูกค้าสามารถส่งข้อมูลใหม่ได้',
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
};
