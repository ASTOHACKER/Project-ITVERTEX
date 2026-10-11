const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const paymentQueries = require('../queries/payment.queries');
const { ROLES, REPAIR_STATUS, PAYMENT_METHODS } = require('../constants');

// Ensure public/slips directory exists
const slipsDir = path.join(__dirname, '..', 'public', 'slips');
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

    if (pickup_date) {
      const cleanDateStr = String(pickup_date).trim();
      if (cleanDateStr && cleanDateStr !== 'null' && cleanDateStr !== 'undefined') {
        const pickup = new Date(cleanDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!isNaN(pickup.getTime()) && pickup < today) {
          return res.status(400).json({ success: false, message: 'วันนัดรับเครื่องต้องไม่เป็นวันที่ผ่านมาแล้ว' });
        }
      }
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

    // 1. จัดการรูปภาพสลิป (รองรับทั้ง req.file และ req.files)
    const uploadedFile = req.file || req.files?.slip_image?.[0] || req.files?.slip?.[0];

    if (uploadedFile && uploadedFile.buffer) {
      const ext = (path.extname(uploadedFile.originalname) || '.jpg').toLowerCase();
      slipFilename = `slips/slip_${cleanJobCode}_${dateStr}${ext}`;
      await fs.promises.writeFile(path.join(__dirname, '..', 'public', slipFilename), uploadedFile.buffer);
    } else if (req.body.slip_image && typeof req.body.slip_image === 'string' && req.body.slip_image.includes('base64,')) {
      const parts = req.body.slip_image.split(';base64,');
      let ext = '.jpg';
      if (parts[0].includes('png')) ext = '.png';
      else if (parts[0].includes('webp')) ext = '.webp';
      slipFilename = `slips/slip_${cleanJobCode}_${dateStr}${ext}`;
      await fs.promises.writeFile(path.join(__dirname, '..', 'public', slipFilename), Buffer.from(parts[1], 'base64'));
    } else if (req.body.slip_image && typeof req.body.slip_image === 'string' && !req.body.slip_image.includes('/') && !req.body.slip_image.includes('\\')) {
      slipFilename = req.body.slip_image;
    } else if (req.body.slip && typeof req.body.slip === 'string' && !req.body.slip.includes('/') && !req.body.slip.includes('\\')) {
      slipFilename = req.body.slip;
    }

    const paymentMethodId = payment_method === 'transfer' ? PAYMENT_METHODS.TRANSFER : PAYMENT_METHODS.CASH;

    if (paymentMethodId === PAYMENT_METHODS.TRANSFER && !slipFilename) {
      return res.status(400).json({ success: false, message: 'กรุณาแนบรูปภาพสลิปหลักฐานการโอนเงิน' });
    }

    // ตรวจสอบว่างานซ่อมเสร็จสิ้นไปแล้วหรือลูกค้าเคยส่งข้อมูลไปแล้วหรือไม่
    const { rows: currentRows } = await pool.query(
      paymentQueries.CHECK_JOB_PAYMENT_STATUS,
      [numJobId]
    );
    if (currentRows.length > 0) {
      const curr = currentRows[0];
      if (curr.status_id === REPAIR_STATUS.COMPLETED) {
        return res.status(400).json({ success: false, message: 'งานซ่อมนี้ส่งมอบเสร็จสิ้นแล้ว ไม่สามารถแก้ไขข้อมูลการชำระเงินได้' });
      }
      if (curr.payment_method_id && req.user && req.user.role_id === ROLES.CUSTOMER) {
        return res.status(400).json({ success: false, message: 'คุณได้ยืนยันการชำระเงินไปแล้ว ข้อมูลถูกล็อกและไม่สามารถแก้ไขได้' });
      }
    }

    // 2. อัปเดตตาราง repair_job: ดันสถานะเป็น 7 (รอชำระ)
    const cleanPickupDate = (pickup_date && pickup_date !== 'null' && pickup_date !== 'undefined' && String(pickup_date).trim() !== '') ? pickup_date : null;
    await pool.query(
      paymentQueries.UPDATE_PAYMENT_INFO,
      [paymentMethodId, slipFilename, cleanPickupDate, numJobId]
    );

    // 3. บันทึก action log ประวัติการชำระเงิน
    try {
      await pool.query(
        paymentQueries.INSERT_PAYMENT_ACTION_LOG,
        [numJobId, userId || null]
      );
    } catch (logErr) {
      console.warn('Could not log payment action detail:', logErr.message);
    }

    // 4. บันทึกลง slips_records ถ้ามีไฟล์สลิป
    if (slipFilename) {
      try {
        await pool.query(
          paymentQueries.INSERT_SLIP_RECORD,
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
      paymentQueries.VERIFY_PAYMENT,
      [userId, jobId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    // บันทึก action log
    try {
      await pool.query(
        paymentQueries.VERIFY_PAYMENT_ACTION_LOG,
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
      paymentQueries.REJECT_PAYMENT,
      [cleanReason, jobId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    // บันทึก action log
    try {
      await pool.query(
        paymentQueries.REJECT_PAYMENT_ACTION_LOG,
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
