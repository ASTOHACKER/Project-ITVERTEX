const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/repairs
 * ดึงรายการงานซ่อมทั้งหมด (สำหรับ Customer จะกรองเฉพาะของตนเองอัตโนมัติ)
 */
exports.getAll = async (req, res, next) => {
  try {
    const isCustomer = req.user && (req.user.role_id === 4 || req.user.role_name?.toLowerCase() === 'customer');
    const params = [];
    let whereClause = '';

    if (isCustomer) {
      // สำหรับ Customer: ดูได้เฉพาะของตัวเอง (เชื่อมโยงตาม customer_id หรือเบอร์โทร/อีเมล)
      whereClause = ' WHERE (d.customer_id = $1 OR (d.customer_id IS NULL AND (p.phone = $2 OR p.email = $3)))';
      params.push(req.user.id, req.user.phone || '', req.user.email || '');
    } else if (req.query.customer_id) {
      whereClause = ' WHERE d.customer_id = $1';
      params.push(req.query.customer_id);
    }

    const query = `
      SELECT 
        rj.*,
        rj.job_id AS id,
        'REP-' || LPAD(rj.job_id::text, 6, '0') AS job_number,
        'REP-' || LPAD(rj.job_id::text, 6, '0') AS job_no,
        COALESCE(dt.device_type_name, '-') AS device_type,
        COALESCE(b.brand_name, '-') AS brand,
        d.model,
        d.serial_number,
        d.included_accessories,
        d.included_accessories AS accessories,
        d.important_software,
        d.important_software AS important_programs,
        d.device_password,
        d.device_password AS password,
        d.warranty_year,
        d.warranty_year AS warranty_years,
        d.warranty_end_date,
        d.customer_id,
        COALESCE(rj.symptom_details, '-') AS symptom,
        COALESCE(rj.symptom_details, '-') AS symptoms,
        COALESCE(s.status_name, '-') AS status_name,
        COALESCE(s.status_name, '-') AS status,
        COALESCE(pm.payment_method_name, '-') AS payment_method_name,
        COALESCE(p.first_name || ' ' || p.last_name, 'ไม่ระบุ') AS customer_name,
        p.first_name, p.last_name, p.phone, p.email,
        q.customer_remark,
        '-' AS received_by,
        '-' AS inspector_name,
        CASE 
          WHEN rj.status_id IN (7, 8) AND COALESCE(q.quote_status_id, 0) != 3 THEN 
            COALESCE(p_rep_direct.first_name || ' ' || p_rep_direct.last_name, '-')
          ELSE '-'
        END AS repairer_name,
        rj.repairer_id,
        rj.repaired_at
      FROM repair_job rj
      LEFT JOIN device d ON rj.device_id = d.device_id
      LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
      LEFT JOIN brands b ON d.brand_id = b.brand_id
      LEFT JOIN status s ON rj.status_id = s.status_id
      LEFT JOIN payment_method pm ON rj.payment_method_id = pm.payment_method_id
      LEFT JOIN profiles p ON d.customer_id = p.id
      LEFT JOIN profiles p_rep_direct ON rj.repairer_id = p_rep_direct.id
      LEFT JOIN quotation q ON rj.quotation_id = q.quotation_id
      ${whereClause}
      ORDER BY rj.created_at DESC
    `;
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/repairs/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'รหัสงานซ่อมไม่ถูกต้อง' });
    }
    const query = `
      SELECT 
        rj.*,
        rj.job_id AS id,
        'REP-' || LPAD(rj.job_id::text, 6, '0') AS job_number,
        'REP-' || LPAD(rj.job_id::text, 6, '0') AS job_no,
        COALESCE(dt.device_type_name, '-') AS device_type,
        COALESCE(b.brand_name, '-') AS brand,
        d.model,
        d.serial_number,
        d.included_accessories,
        d.included_accessories AS accessories,
        d.important_software,
        d.important_software AS important_programs,
        d.device_password,
        d.device_password AS password,
        d.warranty_year,
        d.warranty_year AS warranty_years,
        d.warranty_end_date,
        d.customer_id,
        COALESCE(rj.symptom_details, '-') AS symptom,
        COALESCE(rj.symptom_details, '-') AS symptoms,
        COALESCE(s.status_name, '-') AS status_name,
        COALESCE(s.status_name, '-') AS status,
        COALESCE(pm.payment_method_name, '-') AS payment_method_name,
        COALESCE(p.first_name || ' ' || p.last_name, 'ไม่ระบุ') AS customer_name,
        p.first_name, p.last_name, p.phone, p.email,
        q.customer_remark,
        '-' AS received_by,
        '-' AS inspector_name,
        CASE 
          WHEN rj.status_id IN (7, 8) AND COALESCE(q.quote_status_id, 0) != 3 THEN 
            COALESCE(p_rep_direct.first_name || ' ' || p_rep_direct.last_name, '-')
          ELSE '-'
        END AS repairer_name,
        rj.repairer_id,
        rj.repaired_at
      FROM repair_job rj
      LEFT JOIN device d ON rj.device_id = d.device_id
      LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
      LEFT JOIN brands b ON d.brand_id = b.brand_id
      LEFT JOIN status s ON rj.status_id = s.status_id
      LEFT JOIN payment_method pm ON rj.payment_method_id = pm.payment_method_id
      LEFT JOIN profiles p ON d.customer_id = p.id
      LEFT JOIN profiles p_rep_direct ON rj.repairer_id = p_rep_direct.id
      LEFT JOIN quotation q ON rj.quotation_id = q.quotation_id
      WHERE rj.job_id = $1
    `;
    const { rows } = await pool.query(query, [numId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    // ดึง quotation details ถ้ามี
    let quotation = null;
    let quotationId = rows[0].quotation_id;
    if (!quotationId) {
      const findQ = await pool.query(
        'SELECT quotation_id FROM quotation WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1',
        [numId]
      );
      if (findQ.rows.length > 0) {
        quotationId = findQ.rows[0].quotation_id;
      }
    }

    if (quotationId) {
      const qRes = await pool.query(
        `SELECT q.*, qs.quote_status_name
         FROM quotation q
         LEFT JOIN quotation_status qs ON q.quote_status_id = qs.quote_status_id
         WHERE q.quotation_id = $1`,
        [quotationId]
      );
      if (qRes.rows.length > 0) {
        quotation = qRes.rows[0];

        // ดึง quotation items
        const qdRes = await pool.query(
          `SELECT qd.*, i.item_name, i.item_type_id, it.item_type_name
           FROM quotation_details qd
           LEFT JOIN item i ON qd.item_id = i.item_id
           LEFT JOIN item_type it ON i.item_type_id = it.item_type_id
           WHERE qd.quote_id = $1`,
          [quotation.quotation_id]
        );
        const items = qdRes.rows;
        quotation.items = items;
        quotation.parts = items.filter(it => it.item_type_id === 1);
        quotation.services = items.filter(it => it.item_type_id === 2);
        quotation.total_parts = quotation.parts.reduce((sum, it) => sum + (parseFloat(it.total_price) || 0), 0);
        quotation.total_services = quotation.services.reduce((sum, it) => sum + (parseFloat(it.total_price) || 0), 0);
      }
    }

    // ดึง repair_job_detail (action log)
    const detailRes = await pool.query(
      `SELECT rjd.*, at.action_type_name,
              COALESCE(p.first_name || ' ' || p.last_name, 'ไม่ระบุ') AS user_name,
              p.role_id, r.name AS role_name
       FROM repair_job_detail rjd
       LEFT JOIN action_type at ON rjd.action_type_id = at.action_type_id
       LEFT JOIN profiles p ON rjd.user_id = p.id
       LEFT JOIN roles r ON p.role_id = r.id
       WHERE rjd.job_id = $1
       ORDER BY rjd.created_at ASC`,
      [numId]
    );

    let received_by = rows[0].received_by && rows[0].received_by !== '-' ? rows[0].received_by : null;
    let inspector_name = rows[0].inspector_name && rows[0].inspector_name !== '-' ? rows[0].inspector_name : null;
    let repairer_name = rows[0].repairer_name && rows[0].repairer_name !== '-' ? rows[0].repairer_name : null;

    if (!received_by) {
      const rec = detailRes.rows.find(r => r.action_type_id === 1);
      if (rec) received_by = rec.user_name;
    }
    if (!inspector_name) {
      const ins = detailRes.rows.find(r => r.action_type_id === 2);
      if (ins) inspector_name = ins.user_name;
    }
    if (!repairer_name || repairer_name === '-') {
      const isRepairCompleted = (rows[0].status_id === 7 || rows[0].status_id === 8) &&
        (!quotation || quotation.quote_status_id !== 3);
      if (isRepairCompleted) {
        const repTech = detailRes.rows
          .slice()
          .reverse()
          .find(r => r.action_type_id === 5 && (r.role_name === 'Technician' || r.role_id === 2));
        const repAny = detailRes.rows
          .slice()
          .reverse()
          .find(r => r.action_type_id === 5);
        if (repTech) repairer_name = repTech.user_name;
        else if (repAny) repairer_name = repAny.user_name;
        else repairer_name = '-';
      } else {
        repairer_name = '-';
      }
    }

    let return_date = rows[0].return_date || null;
    if (!return_date && rows[0].customer_receive_signature) {
      const handoverAct = detailRes.rows.find(r => r.action_type_id === 7);
      if (handoverAct) {
        return_date = handoverAct.created_at || handoverAct.action_date;
      }
    }

    const verifiedPaymentDate = rows[0].payment_verified_at || (rows[0].payment_verified ? rows[0].payment_date : null);

    res.json({
      success: true,
      data: {
        ...rows[0],
        received_by: received_by || '-',
        inspector_name: inspector_name || '-',
        repairer_name: repairer_name || '-',
        technician_name: inspector_name || repairer_name || rows[0].technician_name || '-',
        return_date: return_date || null,
        payment_date: verifiedPaymentDate,
        quotation,
        action_logs: detailRes.rows.reverse(), // ล่าสุดขึ้นก่อนสำหรับ action_logs
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/repairs
 */
exports.create = async (req, res, next) => {
  try {
    const { device_id, symptom_details, symptom, appointment_date, status_id } = req.body;
    const numDeviceId = parseInt(device_id, 10);
    if (isNaN(numDeviceId) || numDeviceId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุอุปกรณ์ที่ถูกต้อง' });
    }
    const symptomText = (symptom_details || symptom || '-').trim();
    const numStatusId = status_id ? parseInt(status_id, 10) : 1;

    const { rows } = await pool.query(
      `INSERT INTO repair_job (device_id, symptom_details, appointment_date, status_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [numDeviceId, symptomText, appointment_date || null, isNaN(numStatusId) ? 1 : numStatusId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/repairs/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'รหัสงานซ่อมไม่ถูกต้อง' });
    }
    const {
      device_id, symptom_details, symptom, appointment_date, status_id,
      total_amount, slip_image, payment_date, payment_method_id, quotation_id,
    } = req.body;
    const symptomText = symptom_details || symptom ? String(symptom_details || symptom).trim() : null;
    const numDeviceId = device_id ? parseInt(device_id, 10) : null;
    const numStatusId = status_id ? parseInt(status_id, 10) : null;
    const safeAmount = total_amount !== undefined ? Math.max(0, parseFloat(total_amount) || 0) : null;

    const { rows } = await pool.query(
      `UPDATE repair_job SET
        device_id = COALESCE($1, device_id), 
        symptom_details = COALESCE($2, symptom_details), 
        appointment_date = COALESCE($3, appointment_date), 
        status_id = COALESCE($4, status_id),
        total_amount = COALESCE($5, total_amount), 
        slip_image = COALESCE($6, slip_image), 
        payment_date = COALESCE($7, payment_date), 
        payment_method_id = COALESCE($8, payment_method_id), 
        quotation_id = COALESCE($9, quotation_id)
       WHERE job_id = $10
       RETURNING *`,
      [numDeviceId, symptomText, appointment_date, numStatusId,
       safeAmount, slip_image, payment_date, payment_method_id, quotation_id, numId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/repairs/:id/status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'รหัสงานซ่อมไม่ถูกต้อง' });
    }
    const { status_id, user_id } = req.body;
    const numStatus = parseInt(status_id, 10);
    if (isNaN(numStatus)) {
      return res.status(400).json({ success: false, message: 'สถานะงานซ่อมไม่ถูกต้อง' });
    }

    const currentUserId = user_id || req.user?.id || null;

    // ตรวจสอบสถานะเดิมของงาน
    const prevRes = await pool.query('SELECT status_id, quotation_id FROM repair_job WHERE job_id = $1', [numId]);
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }
    const prevStatusId = prevRes.rows[0].status_id;

    // ถ้าช่างซ่อมเสร็จสิ้น เปลี่ยนจาก อนุมัติ/รอซ่อม (5) หรือ กำลังซ่อม (6) เป็น รอชำระ (7)
    // หรือเริ่มซ่อม (6) จาก (5)
    // -> บันทึก repairer_id และ repaired_at ลงใน repair_job จริงๆ
    let updateSql = 'UPDATE repair_job SET status_id = $1';
    const updateParams = [numStatus, numId];

    if ((numStatus === 7 && (prevStatusId === 5 || prevStatusId === 6)) || (numStatus === 6 && prevStatusId === 5)) {
      if (currentUserId) {
        updateSql += ', repairer_id = $3';
        if (numStatus === 7) {
          updateSql += ', repaired_at = CURRENT_TIMESTAMP';
        }
        updateSql += ' WHERE job_id = $2 RETURNING *';
        updateParams.push(currentUserId);
      } else {
        updateSql += ' WHERE job_id = $2 RETURNING *';
      }
    } else {
      updateSql += ' WHERE job_id = $2 RETURNING *';
    }

    const { rows } = await pool.query(updateSql, updateParams);

    // บันทึก Action Log ประวัติงานซ่อมลง repair_job_detail เสมอ
    let actionTypeId = null;
    let actionRemark = null;

    if (Number(status_id) === 7) {
      if (prevStatusId === 5 || prevStatusId === 6) {
        actionTypeId = 5; // ซ่อมเสร็จสิ้น / ทดสอบเครื่อง
        actionRemark = 'ช่างซ่อมเสร็จสิ้น / ทดสอบเครื่อง เปลี่ยนสถานะเป็นรอชำระ';
      } else if (prevStatusId === 9) {
        actionTypeId = 6;
        actionRemark = 'พนักงานปรับสถานะรอชำระค่าตรวจเช็ค (ยกเลิกซ่อม)';
      }
    } else if (Number(status_id) === 6) {
      actionTypeId = 4; // เริ่มดำเนินการซ่อม
      actionRemark = 'ช่างเริ่มดำเนินการซ่อมเครื่อง';
    } else if (Number(status_id) === 2) {
      actionTypeId = 2;
      actionRemark = 'ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง';
    } else if (Number(status_id) === 8) {
      actionTypeId = 7;
      actionRemark = 'ส่งมอบเครื่องให้ลูกค้าเสร็จสิ้น';
    } else if (Number(status_id) === 9) {
      actionTypeId = 8;
      actionRemark = 'ลูกค้ายกเลิกการซ่อม';
    }

    if (actionTypeId && currentUserId) {
      try {
        await pool.query(
          `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
           VALUES ($1, $2, $3, CURRENT_DATE, $4)`,
          [numId, currentUserId, actionTypeId, actionRemark]
        );
      } catch (logErr) {
        console.warn('Could not auto log repair action:', logErr.message);
      }
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/repairs/:id/signature
 * บันทึกลายเซ็นลูกค้ารับเครื่อง — บันทึกภาพลง backend /pubilc และเก็บชื่อไฟล์ที่สื่อความหมายลง DB
 */
exports.updateSignature = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'รหัสงานซ่อมไม่ถูกต้อง' });
    }
    const { signature_data, customer_receive_signature } = req.body;

    const signatureVal = customer_receive_signature || signature_data;

    if (!signatureVal) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุข้อมูลลายเซ็นรับเครื่อง' });
    }

    let savedFilename = signatureVal;

    // หากส่งมาเป็น Base64 Data URL ให้บันทึกเป็นไฟล์ภาพลง /pubilc/signatures
    if (typeof signatureVal === 'string' && (signatureVal.startsWith('data:image/') || signatureVal.includes('base64,'))) {
      const sigDir = path.join(__dirname, '..', 'pubilc', 'signatures');
      if (!fs.existsSync(sigDir)) {
        fs.mkdirSync(sigDir, { recursive: true });
      }

      const parts = signatureVal.split(';base64,');
      let ext = 'png';
      if (parts[0].includes('jpeg') || parts[0].includes('jpg')) ext = 'jpg';
      else if (parts[0].includes('webp')) ext = 'webp';

      const base64Data = parts[1] || parts[0];
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      
      // ตั้งชื่อไฟล์ที่สื่อความหมาย เช่น signatures/signature_REP-000001_20260911_233512.png
      const jobCode = `REP-${String(numId).padStart(6, '0')}`;
      savedFilename = `signatures/signature_${jobCode}_${dateStr}.${ext}`;
      const filePath = path.join(__dirname, '..', 'pubilc', savedFilename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    }

    // บันทึกเฉพาะชื่อไฟล์ที่สื่อความหมายลงฐานข้อมูล พร้อมเวลาที่ลูกค้าเซ็นรับเครื่องคืน
    const { rows } = await pool.query(
      `UPDATE repair_job 
       SET customer_receive_signature = $1, return_date = COALESCE(return_date, NOW()) 
       WHERE job_id = $2 
       RETURNING *`,
      [savedFilename, numId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    res.json({ success: true, data: rows[0], filename: savedFilename });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/repairs/:id/detail
 * บันทึก action log ลง repair_job_detail
 */
exports.logDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'รหัสงานซ่อมไม่ถูกต้อง' });
    }
    const { action_type_id, user_id, action_date, remark } = req.body;

    const numActionTypeId = parseInt(action_type_id, 10);
    if (isNaN(numActionTypeId)) {
      return res.status(400).json({ success: false, message: 'ประเภทการกระทำไม่ถูกต้อง' });
    }

    const currentUserId = user_id || req.user?.id || null;
    const currentDate = action_date || new Date().toISOString().slice(0, 10);
    const cleanRemark = remark ? String(remark).trim() : null;

    const { rows } = await pool.query(
      `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [numId, currentUserId, numActionTypeId, currentDate, cleanRemark]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
exports.addDetail = exports.logDetail;

/**
 * DELETE /api/repairs/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'รหัสงานซ่อมไม่ถูกต้อง' });
    }
    const { rowCount } = await pool.query('DELETE FROM repair_job WHERE job_id = $1', [numId]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    res.json({ success: true, message: 'ลบงานซ่อมสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

exports.delete = exports.remove;
