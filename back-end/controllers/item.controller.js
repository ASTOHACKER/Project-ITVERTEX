const pool = require('../config/db');

/**
 * GET /api/items
 * ?type=parts → item_type_id = 1
 * ?type=services → item_type_id = 2
 * ?search=xxx → ilike item_name
 */
exports.getAll = async (req, res, next) => {
  try {
    const { type, search, item_type_id } = req.query;
    let query = `
      SELECT 
        i.*, 
        it.item_type_name, 
        COUNT(qd.details_id)::int AS used_count 
      FROM item i 
      LEFT JOIN item_type it ON i.item_type_id = it.item_type_id 
      LEFT JOIN quotation_details qd ON i.item_id = qd.item_id 
      WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    const targetTypeId = item_type_id
      ? parseInt(item_type_id, 10)
      : (type === 'parts' || type === '1' ? 1 : (type === 'services' || type === '2' ? 2 : null));

    if (targetTypeId) {
      query += ` AND i.item_type_id = $${paramIdx++}`;
      params.push(targetTypeId);
    }

    if (search && search.trim()) {
      query += ` AND i.item_name ILIKE $${paramIdx++}`;
      params.push(`%${search.trim()}%`);
    }

    query += ' GROUP BY i.item_id, it.item_type_name ORDER BY i.item_id DESC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/items
 */
exports.create = async (req, res, next) => {
  try {
    const { item_name, item_type_id, selling_price, price } = req.body;
    const cleanName = (item_name || '').trim();
    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อรายการ' });
    }

    const numTypeId = parseInt(item_type_id, 10);
    if (isNaN(numTypeId) || ![1, 2].includes(numTypeId)) {
      return res.status(400).json({ success: false, message: 'ประเภทรายการไม่ถูกต้อง (ต้องเป็น 1=อะไหล่ หรือ 2=ค่าบริการ)' });
    }

    const rawPrice = selling_price !== undefined ? selling_price : (price || 0);
    const safePrice = Math.max(0, parseFloat(rawPrice) || 0);

    const { rows } = await pool.query(
      `INSERT INTO item (item_name, item_type_id, selling_price)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [cleanName, numTypeId, safePrice]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/items/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID รายการไม่ถูกต้อง' });
    }

    const { item_name, item_type_id, selling_price, price } = req.body;
    const cleanName = (item_name || '').trim();
    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อรายการ' });
    }

    const numTypeId = parseInt(item_type_id, 10);
    if (isNaN(numTypeId) || ![1, 2].includes(numTypeId)) {
      return res.status(400).json({ success: false, message: 'ประเภทรายการไม่ถูกต้อง (ต้องเป็น 1=อะไหล่ หรือ 2=ค่าบริการ)' });
    }

    const rawPrice = selling_price !== undefined ? selling_price : (price || 0);
    const safePrice = Math.max(0, parseFloat(rawPrice) || 0);

    const { rows } = await pool.query(
      `UPDATE item SET item_name=$1, item_type_id=$2, selling_price=$3
       WHERE item_id=$4
       RETURNING *`,
      [cleanName, numTypeId, safePrice, numId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/items/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID รายการไม่ถูกต้อง' });
    }

    const result = await pool.query('DELETE FROM item WHERE item_id = $1 RETURNING item_id', [numId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });
    }

    res.json({ success: true, message: 'ลบรายการสำเร็จ' });
  } catch (err) {
    next(err);
  }
};

