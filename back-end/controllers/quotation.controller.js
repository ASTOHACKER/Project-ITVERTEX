const pool = require('../config/db');
const quotationQueries = require('../queries/quotation.queries');
const {
  ROLES,
  REPAIR_STATUS,
  QUOTE_STATUS,
  ACTION_TYPES,
  ITEM_TYPES,
  DEFAULTS,
} = require('../constants');

/**
 * POST /api/quotations
 */
exports.create = async (req, res, next) => {
  try {
    const {
      job_id,
      total_repair_price,
      total_cancel_price,
      quote_status_id,
      items,
      parts,
      services,
      actual_symptom,
      symptom,
      total,
    } = req.body;

    const numJobId = parseInt(job_id, 10);
    if (isNaN(numJobId) || numJobId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรหัสงานซ่อมที่ถูกต้อง' });
    }

    const rawRepair = total_repair_price !== undefined ? total_repair_price : (req.body.type === 'cancel_check' ? 0 : (total || 0));
    const rawCancel = total_cancel_price !== undefined ? total_cancel_price : (req.body.type === 'cancel_check' ? (total || req.body.check_service_price || DEFAULTS.CANCEL_INSPECTION_FEE) : DEFAULTS.CANCEL_INSPECTION_FEE);
    const repairPrice = Math.max(0, parseFloat(rawRepair) || 0);
    const cancelPrice = Math.max(0, parseFloat(rawCancel) || 0);
    const diagnosedSymptom = (actual_symptom || symptom) ? String(actual_symptom || symptom).trim() : null;
    const safeQuoteStatus = quote_status_id ? parseInt(quote_status_id, 10) : QUOTE_STATUS.PENDING;

    // Validation:
    // 1. ค่าบริการมีได้ ก็ต้องมีอะไหล่ก่อน
    // 2. มีแค่อะไหล่อย่างเดียวไม่ได้ ต้องมีค่าบริการด้วย
    const hasParts = (parts && Array.isArray(parts) && parts.length > 0) || (items && Array.isArray(items) && items.some(it => it.item_type_id === ITEM_TYPES.PART));
    const hasServices = (services && Array.isArray(services) && services.length > 0) || (items && Array.isArray(items) && items.some(it => it.item_type_id === ITEM_TYPES.SERVICE));

    if (req.body.type !== 'cancel_check') {
      if (hasServices && !hasParts) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถคิดค่าบริการได้หากไม่มีรายการอะไหล่ กรุณาเพิ่มรายการอะไหล่อย่างน้อย 1 รายการก่อน',
        });
      }

      if (hasParts && !hasServices) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถสร้างใบเสนอราคาที่มีเฉพาะอะไหล่ได้ กรุณาเพิ่มรายการค่าบริการหรือค่าแรงอย่างน้อย 1 รายการ',
        });
      }

      if (!hasParts && !hasServices) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเพิ่มรายการอะไหล่และค่าบริการอย่างน้อยประเภทละ 1 รายการก่อนบันทึกใบเสนอราคา',
        });
      }
    }


    // ใช้ Transaction เพื่อให้การบันทึก quotation, repair_job, และ quotation_details สำเร็จพร้อมกัน
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. สร้าง quotation
      const qResult = await client.query(
        quotationQueries.INSERT_QUOTATION,
        [numJobId, repairPrice, cancelPrice, isNaN(safeQuoteStatus) ? QUOTE_STATUS.PENDING : safeQuoteStatus]
      );

      const quotation = qResult.rows[0];

      // 2. อัปเดต repair_job (quotation_id, actual_symptom, total_amount, status_id = 4 [รอการอนุมัติ])
      await client.query(
        quotationQueries.UPDATE_REPAIR_FOR_NEW_QUOTATION,
        [quotation.quotation_id, diagnosedSymptom, repairPrice || cancelPrice, numJobId]
      );

      // 3. รวม items จาก items หรือ parts + services
      let combinedItems = [];
      if (items && Array.isArray(items)) {
        combinedItems = items;
      } else {
        if (parts && Array.isArray(parts)) {
          for (const p of parts) {
            const qty = Math.max(0, parseInt(p.qty || 1, 10));
            const price = Math.max(0, parseFloat(p.price || 0));
            let itemId = p.item_id || null;
            if (!itemId && p.name) {
              const existItem = await client.query(quotationQueries.FIND_ITEM_BY_NAME, [p.name.trim()]);
              if (existItem.rows.length > 0) {
                itemId = existItem.rows[0].item_id;
              } else {
                const newItem = await client.query(quotationQueries.INSERT_NEW_ITEM, [p.name.trim(), ITEM_TYPES.PART, price]);
                itemId = newItem.rows[0].item_id;
              }
            }
            combinedItems.push({
              item_id: itemId,
              quantity: qty,
              unit_price: price,
              total_price: price * qty,
            });
          }
        }
        if (services && Array.isArray(services)) {
          for (const s of services) {
            const qty = Math.max(0, parseInt(s.qty || 1, 10));
            const price = Math.max(0, parseFloat(s.price || 0));
            let itemId = s.item_id || null;
            if (!itemId && s.name) {
              const existItem = await client.query(quotationQueries.FIND_ITEM_BY_NAME, [s.name.trim()]);
              if (existItem.rows.length > 0) {
                itemId = existItem.rows[0].item_id;
              } else {
                const newItem = await client.query(quotationQueries.INSERT_NEW_ITEM, [s.name.trim(), ITEM_TYPES.SERVICE, price]);
                itemId = newItem.rows[0].item_id;
              }
            }
            combinedItems.push({
              item_id: itemId,
              quantity: qty,
              unit_price: price,
              total_price: price * qty,
            });
          }
        }
      }

      // 4. Insert quotation_details
      for (const item of combinedItems) {
        await client.query(
          quotationQueries.INSERT_QUOTATION_DETAIL,
          [quotation.quotation_id, item.item_id, item.quantity, item.unit_price, item.total_price]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, data: quotation });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quotations/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID ใบเสนอราคาไม่ถูกต้อง' });
    }

    const { rows } = await pool.query(quotationQueries.GET_QUOTATION_BY_ID, [numId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบใบเสนอราคา' });
    }

    // ดึง details
    const detailsRes = await pool.query(quotationQueries.GET_QUOTATION_DETAILS, [numId]);

    const items = detailsRes.rows;
    const parts = items.filter(it => it.item_type_id === ITEM_TYPES.PART);
    const services = items.filter(it => it.item_type_id === ITEM_TYPES.SERVICE);
    const total_parts = parts.reduce((sum, it) => sum + (parseFloat(it.total_price) || 0), 0);
    const total_services = services.reduce((sum, it) => sum + (parseFloat(it.total_price) || 0), 0);

    res.json({
      success: true,
      data: {
        ...rows[0],
        quote_no: `QUO-${String(rows[0].quotation_id).padStart(6, '0')}`,
        job_no: `REP-${String(rows[0].job_id).padStart(6, '0')}`,
        items,
        parts,
        services,
        total_parts,
        total_services,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quotations
 * ดึงรายการใบเสนอราคาทั้งหมด (สำหรับช่าง/พนักงาน และลูกค้า)
 */
exports.getAll = async (req, res, next) => {
  try {
    const isCustomer = req.user && (req.user.role_id === ROLES.CUSTOMER || req.user.role_name?.toLowerCase() === 'customer');
    const { status_id, search } = req.query;

    let whereClause = ' WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (isCustomer) {
      whereClause += ` AND (d.customer_id = $${paramIdx++} OR (d.customer_id IS NULL AND (p.phone = $${paramIdx++} OR p.email = $${paramIdx++})))`;
      params.push(req.user.id, req.user.phone || '', req.user.email || '');
    }

    if (status_id && status_id !== 'all') {
      whereClause += ` AND q.quote_status_id = $${paramIdx++}`;
      params.push(parseInt(status_id, 10));
    }

    if (search && search.trim()) {
      const term = search.trim();
      whereClause += ` AND (
        CAST(q.quotation_id AS TEXT) LIKE $${paramIdx}
        OR CAST(rj.job_id AS TEXT) LIKE $${paramIdx}
        OR p.first_name ILIKE $${paramIdx}
        OR p.last_name ILIKE $${paramIdx}
        OR p.phone ILIKE $${paramIdx}
        OR d.model ILIKE $${paramIdx}
        OR b.brand_name ILIKE $${paramIdx}
      )`;
      params.push(`%${term}%`);
      paramIdx++;
    }

    const query = quotationQueries.BUILD_GET_ALL_QUOTATIONS(whereClause);
    const { rows } = await pool.query(query, params);

    // Format ข้อมูลใน JavaScript ให้อ่านง่ายและคงโครงสร้างเดิม
    const data = rows.map((q) => ({
      ...q,
      quote_no: `QUO-${String(q.quotation_id).padStart(6, '0')}`,
      job_no: `REP-${String(q.job_id).padStart(6, '0')}`,
      customer_name: (q.first_name || q.last_name) ? `${q.first_name || ''} ${q.last_name || ''}`.trim() : 'ไม่ระบุ',
      brand: q.brand || '-',
      device_type: q.device_type || '-',
      quote_status_name: q.quote_status_name || 'รอการอนุมัติ',
      total_parts: q.total_repair_price || 0,
      total_services: 0,
      item_count: 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/quotations/:id
 * ช่างแก้ไข/ปรับปรุงใบเสนอราคาเดิม
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID ใบเสนอราคาไม่ถูกต้อง' });
    }

    const {
      total_repair_price,
      total_cancel_price,
      quote_status_id,
      items,
      parts,
      services,
      actual_symptom,
      total,
    } = req.body;

    const rawRepair = total_repair_price !== undefined ? total_repair_price : (total || 0);
    const rawCancel = total_cancel_price !== undefined ? total_cancel_price : DEFAULTS.CANCEL_INSPECTION_FEE;
    const repairPrice = Math.max(0, parseFloat(rawRepair) || 0);
    const cancelPrice = Math.max(0, parseFloat(rawCancel) || 0);
    const nextQuoteStatus = quote_status_id ? parseInt(quote_status_id, 10) : QUOTE_STATUS.PENDING;

    // Validation: ค่าบริการมีได้ ก็ต้องมีอะไหล่ก่อน และมีเฉพาะอะไหล่โดยไม่มีค่าบริการไม่ได้
    const hasParts = (parts && Array.isArray(parts) && parts.length > 0) || (items && Array.isArray(items) && items.some(it => it.item_type_id === ITEM_TYPES.PART));
    const hasServices = (services && Array.isArray(services) && services.length > 0) || (items && Array.isArray(items) && items.some(it => it.item_type_id === ITEM_TYPES.SERVICE));

    if (hasServices && !hasParts) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถคิดค่าบริการได้หากไม่มีรายการอะไหล่ กรุณาเพิ่มรายการอะไหล่อย่างน้อย 1 รายการก่อน',
      });
    }

    if (hasParts && !hasServices) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถแก้ไขใบเสนอราคาให้มีเฉพาะอะไหล่ได้ กรุณาเพิ่มรายการค่าบริการหรือค่าแรงอย่างน้อย 1 รายการ',
      });
    }

    if (!hasParts && !hasServices) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเพิ่มรายการอะไหล่และค่าบริการอย่างน้อยประเภทละ 1 รายการก่อนบันทึกใบเสนอราคา',
      });
    }

    // ตรวจสอบว่าใบเสนอราคานี้อยู่ในสถานะที่แก้ไขได้หรือไม่ (ห้ามแก้ไขหากอนุมัติแล้ว หรือลูกค้ายกเลิกแล้ว)
    const currentQRes = await pool.query('SELECT quote_status_id FROM quotation WHERE quotation_id = $1', [numId]);
    if (currentQRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบใบเสนอราคา' });
    }
    const currentStatus = currentQRes.rows[0].quote_status_id;
    if (currentStatus === QUOTE_STATUS.APPROVED || currentStatus === QUOTE_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถแก้ไขใบเสนอราคาที่ได้รับการอนุมัติหรือลูกค้ายกเลิกแล้วได้',
      });
    }

    // ใช้ Transaction เพื่อให้การแก้ไขใบเสนอราคาและรายการอะไหล่สำเร็จพร้อมกัน
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. อัปเดตใบเสนอราคา
      const { rows } = await client.query(
        quotationQueries.UPDATE_QUOTATION,
        [repairPrice, cancelPrice, isNaN(nextQuoteStatus) ? QUOTE_STATUS.PENDING : nextQuoteStatus, numId]
      );

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'ไม่พบใบเสนอราคา' });
      }

      const quotation = rows[0];
      const jobId = quotation.job_id;

      // 2. อัปเดตตาราง repair_job: ดันสถานะเป็น 4 (รออนุมัติ) และอัปเดตยอดรวม + อาการเสียจริง
      if (jobId) {
        await client.query(
          quotationQueries.UPDATE_REPAIR_ON_QUOTATION_EDIT,
          [repairPrice, actual_symptom || null, jobId]
        );

        try {
          await client.query(
            `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
             VALUES ($1, $2, ${ACTION_TYPES.CREATE_QUOTE}, CURRENT_DATE, 'ช่างปรับปรุงใบเสนอราคาใหม่ รอลูกค้าอนุมัติ')`,
            [jobId, req.user?.id || null]
          );
        } catch (logErr) {
          console.warn('Could not log update quotation action:', logErr.message);
        }
      }

      // 3. รวม items ทั้งหมด
      let combinedItems = [];
      if (items && Array.isArray(items) && items.length > 0) {
        combinedItems = items;
      } else {
        if (parts && Array.isArray(parts)) {
          for (const p of parts) {
            const qty = Math.max(0, parseInt(p.qty || 1, 10));
            const price = Math.max(0, parseFloat(p.price || 0));
            let itemId = p.item_id || null;
            if (!itemId && p.name) {
              const existItem = await client.query(quotationQueries.FIND_ITEM_BY_NAME, [p.name.trim()]);
              if (existItem.rows.length > 0) {
                itemId = existItem.rows[0].item_id;
              } else {
                const newItem = await client.query(quotationQueries.INSERT_NEW_ITEM, [p.name.trim(), ITEM_TYPES.PART, price]);
                itemId = newItem.rows[0].item_id;
              }
            }
            combinedItems.push({
              item_id: itemId,
              quantity: qty,
              unit_price: price,
              total_price: price * qty,
            });
          }
        }
        if (services && Array.isArray(services)) {
          for (const s of services) {
            const qty = Math.max(0, parseInt(s.qty || 1, 10));
            const price = Math.max(0, parseFloat(s.price || 0));
            let itemId = s.item_id || null;
            if (!itemId && s.name) {
              const existItem = await client.query(quotationQueries.FIND_ITEM_BY_NAME, [s.name.trim()]);
              if (existItem.rows.length > 0) {
                itemId = existItem.rows[0].item_id;
              } else {
                const newItem = await client.query(quotationQueries.INSERT_NEW_ITEM, [s.name.trim(), ITEM_TYPES.SERVICE, price]);
                itemId = newItem.rows[0].item_id;
              }
            }
            combinedItems.push({
              item_id: itemId,
              quantity: qty,
              unit_price: price,
              total_price: price * qty,
            });
          }
        }
      }

      // 4. ลบของเก่าแล้วใส่ของใหม่
      if (combinedItems.length > 0) {
        await client.query(quotationQueries.DELETE_QUOTATION_DETAILS, [numId]);
        for (const item of combinedItems) {
          await client.query(
            quotationQueries.INSERT_QUOTATION_DETAIL,
            [numId, item.item_id, item.quantity, item.unit_price, item.total_price]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'ปรับปรุงใบเสนอราคาเรียบร้อยแล้ว', data: quotation });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/quotations/:id
 * ลบใบเสนอราคา
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return res.status(400).json({ success: false, message: 'ID ใบเสนอราคาไม่ถูกต้อง' });
    }

    const { rows: qRows } = await pool.query('SELECT * FROM quotation WHERE quotation_id = $1', [numId]);
    if (qRows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบใบเสนอราคา' });
    }
    const q = qRows[0];

    // ตรวจสอบว่าใบเสนอราคานี้อยู่ในสถานะที่ลบได้หรือไม่ (ห้ามลบหากอนุมัติแล้ว หรือลูกค้ายกเลิกแล้ว)
    if (q.quote_status_id === QUOTE_STATUS.APPROVED || q.quote_status_id === QUOTE_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบใบเสนอราคาที่ได้รับการอนุมัติหรือลูกค้ายกเลิกแล้วได้',
      });
    }

    // ลบรายละเอียดใบเสนอราคา
    await pool.query(quotationQueries.DELETE_QUOTATION_DETAILS, [numId]);

    // ปลดการเชื่อมโยงจาก repair_job และถอยสถานะเป็น 2 (ดำเนินการตรวจเช็ค)
    if (q.job_id) {
      await pool.query(quotationQueries.RESET_REPAIR_ON_DELETE_QUOTATION, [q.job_id, numId]);

      try {
        await pool.query(
          `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
           VALUES ($1, $2, ${ACTION_TYPES.START_INSPECT}, CURRENT_DATE, 'ช่างลบใบเสนอราคา ถอยสถานะกลับเป็นดำเนินการตรวจเช็ค')`,
          [q.job_id, req.user?.id || null]
        );
      } catch (logErr) {
        console.warn('Could not log delete quotation action:', logErr.message);
      }
    }

    // ลบใบเสนอราคา
    await pool.query(quotationQueries.DELETE_QUOTATION, [numId]);

    res.json({ success: true, message: 'ลบใบเสนอราคาเรียบร้อยแล้ว' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/quotations/:id/status
 */
exports.updateStatus = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID ใบเสนอราคาไม่ถูกต้อง' });
    }

    const { quote_status_id, customer_remark } = req.body;
    const statusNum = parseInt(quote_status_id, 10);
    if (isNaN(statusNum)) {
      return res.status(400).json({ success: false, message: 'สถานะใบเสนอราคาไม่ถูกต้อง' });
    }
    const cleanRemark = customer_remark ? String(customer_remark).trim() : null;

    // 1. ตรวจสอบใบเสนอราคาเดิมและความเป็นเจ้าของ
    const existingQ = await pool.query(
      `SELECT q.*, rj.job_id, d.customer_id, p.phone, p.email
       FROM quotation q
       LEFT JOIN repair_job rj ON q.job_id = rj.job_id
       LEFT JOIN device d ON rj.device_id = d.device_id
       LEFT JOIN profiles p ON d.customer_id = p.id
       WHERE q.quotation_id = $1`,
      [numId]
    );

    if (existingQ.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบใบเสนอราคา' });
    }

    const currentQuote = existingQ.rows[0];

    // 2. ตรวจสอบสิทธิ์กรณีผู้เรียกเป็นลูกค้า (Customer)
    const isCustomer = req.user && (req.user.role_id === ROLES.CUSTOMER || req.user.role_name?.toLowerCase() === 'customer');
    if (isCustomer) {
      const isOwner = (currentQuote.customer_id && Number(currentQuote.customer_id) === Number(req.user.id)) ||
                      (currentQuote.phone && currentQuote.phone === req.user.phone) ||
                      (currentQuote.email && currentQuote.email?.toLowerCase() === req.user.email?.toLowerCase());

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึงหรือจัดการใบเสนอราคานี้' });
      }

      // ลูกค้าสามารถเลือกได้เฉพาะ: อนุมัติ (2), ยกเลิก (3), หรือขอแก้ไข (4 หรือ 5)
      const allowedCustomerStatuses = [QUOTE_STATUS.APPROVED, QUOTE_STATUS.CANCELLED, QUOTE_STATUS.CHANGE_REQUEST, 5];
      if (!allowedCustomerStatuses.includes(statusNum)) {
        return res.status(403).json({ success: false, message: 'ลูกค้าสามารถอนุมัติ ขอยกเลิก หรือขอแก้ไขใบเสนอราคาได้เท่านั้น' });
      }
    }

    // 3. ตรวจสอบสถานะเดิม — ห้ามเปลี่ยนสถานะหากใบเสนอราคาถูกอนุมัติหรือยกเลิกไปแล้ว
    if (currentQuote.quote_status_id === QUOTE_STATUS.APPROVED && statusNum !== QUOTE_STATUS.APPROVED) {
      return res.status(400).json({ success: false, message: 'ใบเสนอราคานี้ได้รับการอนุมัติไปแล้ว ไม่สามารถเปลี่ยนสถานะได้' });
    }
    if (currentQuote.quote_status_id === QUOTE_STATUS.CANCELLED && statusNum !== QUOTE_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'ใบเสนอราคานี้ถูกยกเลิกไปแล้ว ไม่สามารถเปลี่ยนสถานะได้' });
    }

    await client.query('BEGIN');

    const { rows } = await client.query(
      'UPDATE quotation SET quote_status_id = $1, customer_remark = COALESCE($2, customer_remark) WHERE quotation_id = $3 RETURNING *',
      [statusNum, cleanRemark, numId]
    );

    const quotation = rows[0];
    let jobId = quotation.job_id || currentQuote.job_id;

    if (!jobId) {
      const rjRes = await client.query('SELECT job_id FROM repair_job WHERE quotation_id = $1', [numId]);
      if (rjRes.rows.length > 0) {
        jobId = rjRes.rows[0].job_id;
      }
    }

    // Logic จัดการ Status งานซ่อมหลัก
    if (statusNum === QUOTE_STATUS.CANCELLED) {
      const cancelPrice = Number(quotation.total_cancel_price) || DEFAULTS.CANCEL_INSPECTION_FEE;
      await client.query(
        `UPDATE repair_job SET status_id = ${REPAIR_STATUS.CANCELLED}, total_amount = $2 WHERE job_id = $1 OR quotation_id = $3`,
        [jobId, cancelPrice, id]
      );
      if (jobId) {
        try {
          await client.query(
            `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark) VALUES ($1, $2, ${ACTION_TYPES.CUSTOMER_CANCEL}, CURRENT_DATE, $3)`,
            [jobId, req.user?.id || null, `ลูกค้ายกเลิกซ่อม: ${customer_remark || 'ไม่ระบุ'}`]
          );
        } catch (e) {
          console.warn('Could not log cancel action:', e.message);
        }
      }
    } else if (statusNum === QUOTE_STATUS.APPROVED) {
      const repairPrice = Number(quotation.total_repair_price) || 0;
      await client.query(
        `UPDATE repair_job SET status_id = ${REPAIR_STATUS.APPROVED_WAIT_REPAIR}, total_amount = CASE WHEN $2 > 0 THEN $2 ELSE total_amount END WHERE job_id = $1 OR quotation_id = $3`,
        [jobId, repairPrice, id]
      );
      if (jobId) {
        try {
          await client.query(
            `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark) VALUES ($1, $2, ${ACTION_TYPES.START_REPAIR}, CURRENT_DATE, $3)`,
            [jobId, req.user?.id || null, 'ลูกค้าอนุมัติการซ่อม']
          );
        } catch (e) {
          console.warn('Could not log approve action:', e.message);
        }
      }
    } else if (statusNum === QUOTE_STATUS.CHANGE_REQUEST || statusNum === 5) {
      await client.query(
        `UPDATE repair_job SET status_id = ${REPAIR_STATUS.MAKING_QUOTE} WHERE job_id = $1 OR quotation_id = $2`,
        [jobId, id]
      );
      if (jobId) {
        try {
          await client.query(
            `INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark) VALUES ($1, $2, ${ACTION_TYPES.CREATE_QUOTE}, CURRENT_DATE, $3)`,
            [jobId, req.user?.id || null, `ลูกค้าขอแก้ไข/ตีกลับใบเสนอราคา: ${customer_remark || 'ขอแก้ไขรายการ'}`]
          );
        } catch (e) {
          console.warn('Could not log request modification action:', e.message);
        }
      }
    } else if (statusNum === QUOTE_STATUS.PENDING) {
      await client.query(
        `UPDATE repair_job SET status_id = ${REPAIR_STATUS.PENDING_APPROVAL} WHERE job_id = $1 OR quotation_id = $2`,
        [jobId, id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'อัปเดตสถานะใบเสนอราคาเรียบร้อยแล้ว', data: quotation });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
