const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const repairQueries = require('../queries/repair.queries');
const {
  ROLES,
  REPAIR_STATUS,
  QUOTE_STATUS,
  ACTION_TYPES,
  ITEM_TYPES,
  DEFAULTS,
} = require('../constants');

// Helper function จัดรูปแบบข้อมูลงานซ่อมใน JavaScript (แทนการเขียน SQL ซับซ้อน)
function formatRepairRow(row) {
  if (!row) return row;
  const customerName = (row.first_name || row.last_name)
    ? `${row.first_name || ''} ${row.last_name || ''}`.trim()
    : 'ไม่ระบุ';
  const directRepName = (row.rep_first_name || row.rep_last_name)
    ? `${row.rep_first_name || ''} ${row.rep_last_name || ''}`.trim()
    : '-';
  const isCancelled = Number(row.status_id) === REPAIR_STATUS.CANCELLED || Number(row.quote_status_id) === QUOTE_STATUS.CANCELLED || String(row.status_name || '').includes('ยกเลิก');
  const isRepairCompleted = (row.status_id === REPAIR_STATUS.WAITING_PAYMENT || row.status_id === REPAIR_STATUS.COMPLETED) && !isCancelled;
  const cancelPrice = Number(row.total_cancel_price) > 0 ? Number(row.total_cancel_price) : (DEFAULTS.CANCEL_INSPECTION_FEE || 300);
  const repairPrice = Number(row.total_repair_price) > 0 ? Number(row.total_repair_price) : (Number(row.total_amount) || 0);
  const effectiveTotal = isCancelled ? cancelPrice : (repairPrice > 0 ? repairPrice : (Number(row.total_amount) || 0));

  return {
    ...row,
    id: row.job_id,
    job_number: `REP-${String(row.job_id).padStart(6, '0')}`,
    job_no: `REP-${String(row.job_id).padStart(6, '0')}`,
    device_type: row.device_type || '-',
    brand: row.brand || '-',
    accessories: row.included_accessories,
    important_programs: row.important_software,
    password: row.device_password,
    warranty_years: row.warranty_year,
    symptom: row.symptom_details || '-',
    symptoms: row.symptom_details || '-',
    status_name: row.status_name || '-',
    status: row.status_name || '-',
    payment_method_name: row.payment_method_name || '-',
    customer_name: customerName,
    received_by: '-',
    inspector_name: '-',
    repairer_name: isRepairCompleted ? directRepName : '-',
    total_amount: effectiveTotal,
    total_cancel_price: cancelPrice,
    total_repair_price: repairPrice,
    is_cancelled: isCancelled,
  };
}

/**
 * GET /api/repairs
 * ดึงรายการงานซ่อมทั้งหมด (สำหรับ Customer จะกรองเฉพาะของตนเองอัตโนมัติ)
 */
exports.getAll = async (req, res, next) => {
  try {
    const isCustomer = req.user && (req.user.role_id === ROLES.CUSTOMER || req.user.role_name?.toLowerCase() === 'customer');
    const params = [];
    let whereClause = '';

    if (isCustomer) {
      whereClause = ' WHERE (d.customer_id = $1 OR (d.customer_id IS NULL AND (p.phone = $2 OR p.email = $3)))';
      params.push(req.user.id, req.user.phone || '', req.user.email || '');
    } else if (req.query.customer_id) {
      whereClause = ' WHERE d.customer_id = $1';
      params.push(req.query.customer_id);
    }

    const query = repairQueries.BUILD_GET_ALL_REPAIRS(whereClause);
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows.map(formatRepairRow) });
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

    const { rows } = await pool.query(repairQueries.GET_REPAIR_BY_ID, [numId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    // ดึง quotation details ถ้ามี
    let quotation = null;
    let quotationId = rows[0].quotation_id;
    if (!quotationId) {
      const findQ = await pool.query(repairQueries.FIND_QUOTATION_BY_JOB_ID, [numId]);
      if (findQ.rows.length > 0) {
        quotationId = findQ.rows[0].quotation_id;
      }
    }

    if (quotationId) {
      const qRes = await pool.query(repairQueries.GET_QUOTATION_BY_ID, [quotationId]);
      if (qRes.rows.length > 0) {
        quotation = qRes.rows[0];

        // ดึง quotation items
        const qdRes = await pool.query(repairQueries.GET_QUOTATION_ITEMS, [quotation.quotation_id]);
        const items = qdRes.rows.map((it) => {
          const isService = it.item_type_id === ITEM_TYPES.SERVICE || !it.item_id;
          const fallbackName = isService ? 'ค่าบริการตรวจเช็คและซ่อมบำรุง' : 'อะไหล่ทดแทน';
          return {
            ...it,
            item_name: it.item_name || fallbackName,
            name: it.item_name || fallbackName,
            item_type_id: isService ? ITEM_TYPES.SERVICE : (it.item_type_id || ITEM_TYPES.PART),
            item_type_name: isService ? 'บริการ (Service)' : (it.item_type_name || 'อะไหล่ (Hardware/Part)'),
          };
        });
        quotation.items = items;
        quotation.parts = items.filter((it) => it.item_type_id === ITEM_TYPES.PART);
        quotation.services = items.filter((it) => it.item_type_id === ITEM_TYPES.SERVICE);
        quotation.total_parts = quotation.parts.reduce((sum, it) => sum + (parseFloat(it.total_price) || 0), 0);
        quotation.total_services = quotation.services.reduce((sum, it) => sum + (parseFloat(it.total_price) || 0), 0);
      }
    }

    // ดึง repair_job_detail (action log)
    const detailRes = await pool.query(repairQueries.GET_ACTION_LOGS, [numId]);

    const formattedRow = formatRepairRow(rows[0]);
    const actionLogs = detailRes.rows.map((r) => ({
      ...r,
      user_name: (r.first_name || r.last_name)
        ? `${r.first_name || ''} ${r.last_name || ''}`.trim()
        : (r.user_name || 'ไม่ระบุ'),
    }));

    let received_by = formattedRow.received_by && formattedRow.received_by !== '-' ? formattedRow.received_by : null;
    let inspector_name = formattedRow.inspector_name && formattedRow.inspector_name !== '-' ? formattedRow.inspector_name : null;
    let repairer_name = formattedRow.repairer_name && formattedRow.repairer_name !== '-' ? formattedRow.repairer_name : null;

    if (!received_by) {
      const rec = actionLogs.find(r => r.action_type_id === ACTION_TYPES.RECEIVE_DEVICE);
      if (rec) received_by = rec.user_name;
    }
    if (!inspector_name) {
      const ins = actionLogs.find(r => r.action_type_id === ACTION_TYPES.START_INSPECT);
      if (ins) inspector_name = ins.user_name;
    }
    if (!repairer_name || repairer_name === '-') {
      const isRepairCompleted = (rows[0].status_id === REPAIR_STATUS.WAITING_PAYMENT || rows[0].status_id === REPAIR_STATUS.COMPLETED) &&
        (!quotation || quotation.quote_status_id !== QUOTE_STATUS.CANCELLED);
      if (isRepairCompleted) {
        const repTech = actionLogs
          .slice()
          .reverse()
          .find(r => r.action_type_id === ACTION_TYPES.FINISH_REPAIR && (r.role_name === 'Technician' || r.role_id === ROLES.TECHNICIAN));
        const repAny = actionLogs
          .slice()
          .reverse()
          .find(r => r.action_type_id === ACTION_TYPES.FINISH_REPAIR);
        if (repTech) repairer_name = repTech.user_name;
        else if (repAny) repairer_name = repAny.user_name;
        else repairer_name = '-';
      } else {
        repairer_name = '-';
      }
    }

    let return_date = rows[0].return_date || null;
    if (!return_date && rows[0].customer_receive_signature) {
      const handoverAct = actionLogs.find(r => r.action_type_id === ACTION_TYPES.HANDOVER);
      if (handoverAct) {
        return_date = handoverAct.created_at || handoverAct.action_date;
      }
    }

    const isCancelled =
      Number(rows[0].status_id) === REPAIR_STATUS.CANCELLED ||
      Number(rows[0].quote_status_id) === QUOTE_STATUS.CANCELLED ||
      Number(quotation?.quote_status_id) === QUOTE_STATUS.CANCELLED ||
      String(rows[0].status_name || '').includes('ยกเลิก') ||
      Boolean(formattedRow.is_cancelled);

    const cancelPrice = Number(quotation?.total_cancel_price) > 0
      ? Number(quotation.total_cancel_price)
      : (Number(rows[0].total_cancel_price) > 0 ? Number(rows[0].total_cancel_price) : (DEFAULTS.CANCEL_INSPECTION_FEE || 300));

    const repairPrice = Number(quotation?.total_repair_price) > 0
      ? Number(quotation.total_repair_price)
      : (Number(rows[0].total_repair_price) > 0 ? Number(rows[0].total_repair_price) : (Number(rows[0].total_amount) || 0));

    const effectiveTotal = isCancelled ? cancelPrice : (repairPrice > 0 ? repairPrice : (Number(rows[0].total_amount) || 0));

    const verifiedPaymentDate = rows[0].payment_verified_at || (rows[0].payment_verified ? rows[0].payment_date : null);

    res.json({
      success: true,
      data: {
        ...formattedRow,
        is_cancelled: isCancelled,
        total_amount: effectiveTotal,
        total_cancel_price: cancelPrice,
        total_repair_price: repairPrice,
        received_by: received_by || '-',
        inspector_name: inspector_name || '-',
        repairer_name: repairer_name || '-',
        technician_name: inspector_name || repairer_name || rows[0].technician_name || '-',
        return_date: return_date || null,
        payment_date: verifiedPaymentDate,
        quotation,
        action_logs: actionLogs.reverse(),
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
    const numStatusId = status_id ? parseInt(status_id, 10) : REPAIR_STATUS.PENDING_CHECK;

    const { rows } = await pool.query(
      repairQueries.INSERT_REPAIR_JOB,
      [numDeviceId, symptomText, appointment_date || null, isNaN(numStatusId) ? REPAIR_STATUS.PENDING_CHECK : numStatusId]
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
      repairQueries.UPDATE_REPAIR_JOB,
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

    // ตรวจสอบสิทธิ์: ลูกค้าสามารถยกเลิกงานตนเองได้เท่านั้น (CANCELLED)
    if (req.user && (req.user.role_id === ROLES.CUSTOMER || req.user.role_name?.toLowerCase() === 'customer')) {
      const ownerCheck = await pool.query(
        `SELECT rj.job_id FROM repair_job rj
         JOIN device d ON rj.device_id = d.device_id
         WHERE rj.job_id = $1 AND d.customer_id = $2`,
        [numId, req.user.id]
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขงานซ่อมนี้' });
      }
      if (numStatus !== REPAIR_STATUS.CANCELLED) {
        return res.status(403).json({ success: false, message: 'ลูกค้าสามารถเปลี่ยนสถานะเป็นยกเลิกซ่อมได้เท่านั้น' });
      }
    }

    // ตรวจสอบสถานะเดิมของงาน
    const prevRes = await pool.query('SELECT status_id, quotation_id FROM repair_job WHERE job_id = $1', [numId]);
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }
    const prevStatusId = prevRes.rows[0].status_id;

    let updateSql = 'UPDATE repair_job SET status_id = $1';
    const updateParams = [numStatus, numId];

    if (numStatus === REPAIR_STATUS.CANCELLED) {
      const qRes = await pool.query(
        'SELECT total_cancel_price FROM quotation WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1',
        [numId]
      );
      const cancelPrice = Number(qRes.rows[0]?.total_cancel_price) || DEFAULTS.CANCEL_INSPECTION_FEE;
      updateSql += `, total_amount = $${updateParams.length + 1}`;
      updateParams.push(cancelPrice);

      // ซิงค์สถานะใบเสนอราคาเป็นยกเลิก (3) ให้ตรงกับสถานะงานซ่อม
      try {
        await pool.query(
          `UPDATE quotation SET quote_status_id = ${QUOTE_STATUS.CANCELLED} WHERE job_id = $1 OR quotation_id = (SELECT quotation_id FROM repair_job WHERE job_id = $1)`,
          [numId]
        );
      } catch (qSyncErr) {
        console.warn('Could not sync quotation status on cancel:', qSyncErr.message);
      }
    }

    if (numStatus === REPAIR_STATUS.WAITING_PAYMENT && prevStatusId === REPAIR_STATUS.APPROVED_WAIT_REPAIR) {
      if (currentUserId) {
        updateSql += ', repairer_id = $3, repaired_at = CURRENT_TIMESTAMP WHERE job_id = $2 RETURNING *';
        updateParams.push(currentUserId);
      } else {
        updateSql += ' WHERE job_id = $2 RETURNING *';
      }
    } else if (numStatus === REPAIR_STATUS.COMPLETED) {
      updateSql += ', return_date = COALESCE(return_date, CURRENT_TIMESTAMP) WHERE job_id = $2 RETURNING *';
    } else {
      updateSql += ' WHERE job_id = $2 RETURNING *';
    }

    const { rows } = await pool.query(updateSql, updateParams);

    // บันทึก Action Log ประวัติงานซ่อมลง repair_job_detail เสมอ
    let actionTypeId = null;
    let actionRemark = null;

    if (Number(status_id) === REPAIR_STATUS.WAITING_PAYMENT) {
      if (prevStatusId === REPAIR_STATUS.APPROVED_WAIT_REPAIR) {
        actionTypeId = ACTION_TYPES.FINISH_REPAIR;
        actionRemark = 'ช่างซ่อมเสร็จสิ้น / ทดสอบเครื่อง เปลี่ยนสถานะเป็นรอชำระ';
      } else if (prevStatusId === REPAIR_STATUS.CANCELLED) {
        actionTypeId = ACTION_TYPES.PAYMENT_PROCESS;
        actionRemark = 'พนักงานปรับสถานะรอชำระค่าตรวจเช็ค (ยกเลิกซ่อม)';
      }
    } else if (Number(status_id) === REPAIR_STATUS.READY_FOR_PICKUP) {
      actionTypeId = ACTION_TYPES.PAYMENT_PROCESS;
      actionRemark = 'ตรวจสอบการชำระเงินเรียบร้อยแล้ว เปลี่ยนสถานะเป็นรอลูกค้ามารับเครื่อง';
    } else if (Number(status_id) === REPAIR_STATUS.CHECKING) {
      actionTypeId = ACTION_TYPES.START_INSPECT;
      actionRemark = 'ช่างเริ่มดำเนินการตรวจเช็คสภาพเครื่อง';
    } else if (Number(status_id) === REPAIR_STATUS.COMPLETED) {
      actionTypeId = ACTION_TYPES.HANDOVER;
      actionRemark = 'ลูกค้าลงชื่อรับเครื่องและส่งมอบเครื่องเสร็จสิ้น';
    } else if (Number(status_id) === REPAIR_STATUS.CANCELLED) {
      actionTypeId = ACTION_TYPES.CUSTOMER_CANCEL;
      actionRemark = 'ลูกค้ายกเลิกการซ่อม';
    }

    if (actionTypeId && currentUserId) {
      try {
        await pool.query(
          repairQueries.INSERT_ACTION_LOG,
          [numId, currentUserId, actionTypeId, new Date().toISOString().slice(0, 10), actionRemark]
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
 * บันทึกลายเซ็นลูกค้ารับเครื่อง
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

    if (typeof signatureVal === 'string' && (signatureVal.startsWith('data:image/') || signatureVal.includes('base64,'))) {
      const sigDir = path.join(__dirname, '..', 'public', 'signatures');
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
      
      const jobCode = `REP-${String(numId).padStart(6, '0')}`;
      savedFilename = `signatures/signature_${jobCode}_${dateStr}.${ext}`;
      const filePath = path.join(__dirname, '..', 'public', savedFilename);
      await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
    }

    const { rows } = await pool.query(
      repairQueries.UPDATE_REPAIR_SIGNATURE,
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
      repairQueries.INSERT_ACTION_LOG,
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
    if (req.user && req.user.role_id !== ROLES.MANAGER && req.user.role_name?.toLowerCase() !== 'manager') {
      return res.status(403).json({ success: false, message: 'เฉพาะผู้จัดการเท่านั้นที่สามารถลบงานซ่อมได้' });
    }

    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'รหัสงานซ่อมไม่ถูกต้อง' });
    }

    const { rows: jobRows } = await pool.query(
      'SELECT job_id, quotation_id, payment_method_id, slip_image FROM repair_job WHERE job_id = $1',
      [numId]
    );
    if (jobRows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    const job = jobRows[0];
    const qCheck = await pool.query('SELECT quotation_id FROM quotation WHERE job_id = $1', [numId]);
    const hasTransactions = (qCheck.rows.length > 0) || (job.quotation_id !== null) || (job.payment_method_id !== null) || (job.slip_image !== null);

    if (hasTransactions) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบงานซ่อมนี้ได้ เนื่องจากมีข้อมูลใบเสนอราคาหรือประวัติการชำระเงินอ้างอิงอยู่ เพื่อป้องกันข้อมูลสูญหาย',
      });
    }

    await pool.query(repairQueries.DELETE_REPAIR_DETAILS, [numId]);
    const { rowCount } = await pool.query(repairQueries.DELETE_REPAIR_JOB, [numId]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
    }

    res.json({ success: true, message: 'ลบงานซ่อมสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

exports.delete = exports.remove;
