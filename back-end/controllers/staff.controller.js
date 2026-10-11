const pool = require('../config/db');
const { ROLES, REPAIR_STATUS, DEFAULTS } = require('../constants');

/**
 * GET /api/staff
 */
exports.getAll = async (req, res, next) => {
  try {
    // ดึงรายชื่อผู้ใช้ระบบ (Staff, Technician, Customer) ยกเว้น Manager
    const { rows } = await pool.query(
      `SELECT p.id, p.email, p.first_name, p.last_name, p.phone, p.role_id, r.name AS role_name, p.created_at
       FROM profiles p
       LEFT JOIN roles r ON p.role_id = r.id
       WHERE p.role_id IN (${ROLES.STAFF}, ${ROLES.TECHNICIAN}, ${ROLES.CUSTOMER})
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
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID ผู้ใช้งานไม่ถูกต้อง' });
    }

    const { first_name, last_name, phone, role_id } = req.body;
    const cleanFirstName = first_name ? String(first_name).trim() : null;
    const cleanLastName = last_name ? String(last_name).trim() : null;
    const cleanPhone = phone ? String(phone).replace(/[^0-9]/g, '').slice(0, 10) : null;
    const parsedRoleId = role_id !== undefined ? parseInt(role_id, 10) : null;

    if (cleanPhone) {
      if (cleanPhone.length < 9 || cleanPhone.length > 10) {
        return res.status(400).json({ success: false, message: 'เบอร์โทรศัพท์ต้องมีความยาว 9-10 หลัก' });
      }
      const { rows: dupPhone } = await pool.query(
        'SELECT id FROM profiles WHERE phone = $1 AND id != $2 LIMIT 1',
        [cleanPhone, numId]
      );
      if (dupPhone.length > 0) {
        return res.status(400).json({ success: false, message: 'เบอร์โทรศัพท์นี้ถูกใช้งานในระบบแล้ว' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE profiles 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           role_id = COALESCE($4, role_id)
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, role_id`,
      [cleanFirstName, cleanLastName, cleanPhone, isNaN(parsedRoleId) ? null : parsedRoleId, numId]
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
 * DELETE /api/staff/:id
 * ลบข้อมูลพนักงาน (Manager only)
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID ผู้ใช้งานไม่ถูกต้อง' });
    }

    // 1. ตรวจสอบว่าผู้ใช้งานนี้มีอยู่ในระบบหรือไม่
    const { rows } = await pool.query(
      'SELECT id, email, first_name, last_name, role_id FROM profiles WHERE id = $1',
      [numId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานในระบบ' });
    }

    const targetUser = rows[0];

    // 2. ป้องกันไม่ให้ลบบัญชีตัวเอง
    if (req.user && Number(req.user.id) === numId) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบบัญชีของตนเองได้' });
    }

    // 3. ป้องกันไม่ให้ลบผู้จัดการ (Manager)
    if (targetUser.role_id === ROLES.MANAGER) {
      return res.status(403).json({ success: false, message: 'ไม่สามารถลบบัญชีผู้จัดการ (Manager) ได้' });
    }

    // 4. ตรวจสอบกรณีเป็นลูกค้า (Customer) หรือมีอุปกรณ์/งานซ่อมผูกอยู่กับผู้ใช้งานนี้
    // ตรวจสอบเงื่อนไขว่าลูกค้าคนนี้เป็นหนี้หรือเปล่า (ยอดค้างชำระ / รอชำระ / ยกเลิกซ่อมแต่ยังไม่จ่ายค่าตรวจเช็ค)
    const { rows: relatedJobs } = await pool.query(
      `SELECT 
         rj.job_id,
         rj.status_id,
         s.status_name,
         rj.payment_verified,
         COALESCE(rj.total_amount, 0) AS total_amount,
         COALESCE(q.total_repair_price, 0) AS quote_repair_price,
         COALESCE(q.total_cancel_price, ${DEFAULTS.CANCEL_INSPECTION_FEE || 300}) AS quote_cancel_price,
         q.quote_status_id,
         qs.quote_status_name
       FROM repair_job rj
       JOIN device d ON rj.device_id = d.device_id
       LEFT JOIN status s ON rj.status_id = s.status_id
       LEFT JOIN quotation q ON rj.quotation_id = q.quotation_id
       LEFT JOIN quotation_status qs ON q.quote_status_id = qs.quote_status_id
       WHERE d.customer_id = $1`,
      [numId]
    );

    const unpaidDebts = [];
    const activeJobs = [];

    for (const job of relatedJobs) {
      const isPaid = job.payment_verified === true;
      const statusId = Number(job.status_id);

      let debtAmount = 0;

      if (!isPaid) {
        if (statusId === REPAIR_STATUS.WAITING_PAYMENT) {
          // รอชำระ: มียอดค่าซ่อมที่ต้องชำระ
          debtAmount = parseFloat(job.total_amount) > 0
            ? parseFloat(job.total_amount)
            : (parseFloat(job.quote_repair_price) || 0);
        } else if (statusId === REPAIR_STATUS.CANCELLED) {
          // ยกเลิกซ่อม: มีค่าตรวจเช็คมาตรฐานที่ต้องชำระ
          debtAmount = parseFloat(job.total_amount) > 0
            ? parseFloat(job.total_amount)
            : (parseFloat(job.quote_cancel_price) || 300);
        } else if (statusId === REPAIR_STATUS.READY_FOR_PICKUP || statusId === REPAIR_STATUS.COMPLETED) {
          // รอมารับเครื่อง หรือเสร็จสิ้น แต่ยังไม่ยืนยันชำระเงิน
          debtAmount = parseFloat(job.total_amount) > 0
            ? parseFloat(job.total_amount)
            : (parseFloat(job.quote_repair_price) || 0);
        } else if (statusId === REPAIR_STATUS.APPROVED_WAIT_REPAIR) {
          // อนุมัติแล้ว/กำลังซ่อม: มีภาระค่าใช้จ่ายที่อนุมัติแล้ว
          debtAmount = parseFloat(job.total_amount) > 0
            ? parseFloat(job.total_amount)
            : (parseFloat(job.quote_repair_price) || 0);
        }
      }

      if (debtAmount > 0) {
        unpaidDebts.push({
          job_id: job.job_id,
          job_code: `REP-${String(job.job_id).padStart(6, '0')}`,
          status_name: job.status_name || 'รอชำระ',
          amount: debtAmount,
        });
      }

      // งานที่ยังดำเนินการไม่เสร็จสิ้น (Active ongoing repairs)
      if (statusId !== REPAIR_STATUS.COMPLETED && statusId !== REPAIR_STATUS.CANCELLED) {
        activeJobs.push({
          job_id: job.job_id,
          job_code: `REP-${String(job.job_id).padStart(6, '0')}`,
          status_name: job.status_name || '-',
        });
      }
    }

    if (unpaidDebts.length > 0) {
      const totalDebt = unpaidDebts.reduce((sum, d) => sum + d.amount, 0);
      const jobListStr = unpaidDebts
        .map(d => `${d.job_code} (${d.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท)`)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบลูกค้ารายนี้ได้ เนื่องจากมียอดค้างชำระ (หนี้สิน) รวม ${totalDebt.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท [งานซ่อม: ${jobListStr}] กรุณาให้ลูกค้าชำระเงินให้เรียบร้อยก่อน`,
        data: {
          has_debt: true,
          total_debt: totalDebt,
          debts: unpaidDebts,
        },
      });
    }

    if (activeJobs.length > 0) {
      const activeListStr = activeJobs.map(j => `${j.job_code} (${j.status_name})`).join(', ');
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบลูกค้ารายนี้ได้ เนื่องจากยังมีงานซ่อมที่กำลังดำเนินการอยู่ในระบบ: ${activeListStr} กรุณาดำเนินการให้เสร็จสิ้นก่อน`,
        data: {
          has_active_jobs: true,
          active_jobs: activeJobs,
        },
      });
    }

    // 5. ป้องกันไม่ให้ลบช่างซ่อมที่มีงานที่กำลังรับผิดชอบอยู่
    if (targetUser.role_id === ROLES.TECHNICIAN) {
      const { rows: techJobs } = await pool.query(
        `SELECT rj.job_id, s.status_name 
         FROM repair_job rj
         LEFT JOIN status s ON rj.status_id = s.status_id
         WHERE rj.repairer_id = $1 
           AND rj.status_id NOT IN (${REPAIR_STATUS.COMPLETED}, ${REPAIR_STATUS.CANCELLED})`,
        [numId]
      );
      if (techJobs.length > 0) {
        const jobListStr = techJobs.map(j => `REP-${String(j.job_id).padStart(6, '0')} (${j.status_name})`).join(', ');
        return res.status(400).json({
          success: false,
          message: `ไม่สามารถลบช่างซ่อมรายนี้ได้ เนื่องจากยังมีงานซ่อมที่อยู่ในความรับผิดชอบ: ${jobListStr} กรุณาโอนย้ายงานก่อน`,
        });
      }
    }

    // 6. ล้างความสัมพันธ์ foreign keys และลบผู้ใช้ภายใน Transaction เพื่อความสมบูรณ์ของข้อมูล
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [numId]);
      await client.query('UPDATE repair_job SET repairer_id = NULL WHERE repairer_id = $1', [numId]);
      await client.query('UPDATE repair_job SET payment_verified_by = NULL WHERE payment_verified_by = $1', [numId]);
      await client.query('UPDATE repair_job_detail SET user_id = NULL WHERE user_id = $1', [numId]);
      await client.query('UPDATE slips_records SET user_id = NULL WHERE user_id = $1', [numId]);
      await client.query('UPDATE device SET customer_id = NULL WHERE customer_id = $1', [numId]);
      await client.query('DELETE FROM profiles WHERE id = $1', [numId]);
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      message: 'ลบข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
      data: { id: numId, email: targetUser.email },
    });
  } catch (err) {
    next(err);
  }
};

exports.delete = exports.remove;
