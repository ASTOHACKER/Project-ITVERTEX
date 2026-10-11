const pool = require('../config/db');

// ============================================================
// 1. DEVICE TYPES (ประเภทอุปกรณ์)
// ============================================================

/**
 * GET /api/catalog/device-types
 * ดึงรายการประเภทอุปกรณ์ทั้งหมด พร้อมสถิติจำนวนยี่ห้อและรุ่น
 */
exports.getAllDeviceTypes = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        dt.device_type_id,
        dt.device_type_name,
        COUNT(DISTINCT bdt.brand_id)::int AS brand_count,
        COUNT(DISTINCT dm.model_id)::int AS model_count,
        COUNT(DISTINCT d.device_id)::int AS device_count
      FROM device_types dt
      LEFT JOIN brand_device_types bdt ON dt.device_type_id = bdt.device_type_id
      LEFT JOIN device_models dm ON dt.device_type_id = dm.device_type_id
      LEFT JOIN device d ON dt.device_type_id = d.device_type_id
      GROUP BY dt.device_type_id, dt.device_type_name
      ORDER BY dt.device_type_id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/catalog/device-types
 * เพิ่มประเภทอุปกรณ์ใหม่ (Manager only)
 */
exports.createDeviceType = async (req, res, next) => {
  try {
    const { device_type_name } = req.body;
    const name = (device_type_name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อประเภทอุปกรณ์' });
    }

    const dupCheck = await pool.query(
      'SELECT device_type_id FROM device_types WHERE LOWER(device_type_name) = LOWER($1)',
      [name]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ประเภทอุปกรณ์นี้มีอยู่ในระบบแล้ว' });
    }

    const { rows } = await pool.query(
      'INSERT INTO device_types (device_type_name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'เพิ่มประเภทอุปกรณ์สำเร็จ' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/catalog/device-types/:id
 * แก้ไขประเภทอุปกรณ์ (Manager only)
 */
exports.updateDeviceType = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID ประเภทอุปกรณ์ไม่ถูกต้อง' });
    }

    const { device_type_name } = req.body;
    const name = (device_type_name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อประเภทอุปกรณ์' });
    }

    const dupCheck = await pool.query(
      'SELECT device_type_id FROM device_types WHERE LOWER(device_type_name) = LOWER($1) AND device_type_id != $2',
      [name, id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ชื่อประเภทอุปกรณ์นี้ซ้ำกับรายการอื่น' });
    }

    const { rows } = await pool.query(
      'UPDATE device_types SET device_type_name = $1 WHERE device_type_id = $2 RETURNING *',
      [name, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบประเภทอุปกรณ์' });
    }

    res.json({ success: true, data: rows[0], message: 'แก้ไขประเภทอุปกรณ์สำเร็จ' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/catalog/device-types/:id
 * ลบประเภทอุปกรณ์ (Manager only)
 */
exports.deleteDeviceType = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID ประเภทอุปกรณ์ไม่ถูกต้อง' });
    }

    // 1. ตรวจสอบว่ามีการนำไปใช้ในข้อมูลงานซ่อม (device) หรือไม่
    const deviceCheck = await client.query(
      'SELECT COUNT(*)::int AS count FROM device WHERE device_type_id = $1',
      [id]
    );
    if (deviceCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบประเภทอุปกรณ์นี้ได้เนื่องจากมีประวัติอุปกรณ์งานซ่อมใช้งานอยู่จำนวน ${deviceCheck.rows[0].count} เครื่อง`,
      });
    }

    // 2. ตรวจสอบรุ่นที่ผูกอยู่
    const modelCheck = await client.query(
      'SELECT COUNT(*)::int AS count FROM device_models WHERE device_type_id = $1',
      [id]
    );
    if (modelCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบได้เนื่องจากมีรุ่นอุปกรณ์ผูกอยู่จำนวน ${modelCheck.rows[0].count} รุ่น กรุณาย้ายหรือลบรุ่นอุปกรณ์ก่อน`,
      });
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM brand_device_types WHERE device_type_id = $1', [id]);
    const { rowCount } = await client.query('DELETE FROM device_types WHERE device_type_id = $1', [id]);
    await client.query('COMMIT');

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบประเภทอุปกรณ์ที่ต้องการลบ' });
    }

    res.json({ success: true, message: 'ลบประเภทอุปกรณ์เรียบร้อยแล้ว' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ============================================================
// 2. BRANDS (ยี่ห้อ / แบรนด์)
// ============================================================

/**
 * GET /api/catalog/brands
 * ดึงรายการยี่ห้อทั้งหมด พร้อมประเภทอุปกรณ์ที่ผูก และจำนวนรุ่น
 */
exports.getAllBrands = async (req, res, next) => {
  try {
    const { device_type_id, search } = req.query;
    let query = `
      SELECT 
        b.brand_id,
        b.brand_name,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'device_type_id', dt.device_type_id,
              'device_type_name', dt.device_type_name
            )
          ) FILTER (WHERE dt.device_type_id IS NOT NULL),
          '[]'
        ) AS device_types,
        COUNT(DISTINCT dm.model_id)::int AS model_count
      FROM brands b
      LEFT JOIN brand_device_types bdt ON b.brand_id = bdt.brand_id
      LEFT JOIN device_types dt ON bdt.device_type_id = dt.device_type_id
      LEFT JOIN device_models dm ON b.brand_id = dm.brand_id
    `;

    const conditions = [];
    const params = [];

    if (device_type_id && !isNaN(parseInt(device_type_id, 10))) {
      params.push(parseInt(device_type_id, 10));
      conditions.push(`b.brand_id IN (
        SELECT brand_id FROM brand_device_types WHERE device_type_id = $${params.length}
        UNION
        SELECT brand_id FROM device_models WHERE device_type_id = $${params.length}
      )`);
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      conditions.push(`b.brand_name ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY b.brand_id, b.brand_name ORDER BY b.brand_name ASC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/catalog/brands
 * เพิ่มยี่ห้อใหม่ และผูกกับประเภทอุปกรณ์ (Manager only)
 */
exports.createBrand = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { brand_name, device_type_ids } = req.body;
    const name = (brand_name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อยี่ห้อ' });
    }

    const dupCheck = await client.query(
      'SELECT brand_id FROM brands WHERE LOWER(brand_name) = LOWER($1)',
      [name]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ยี่ห้อนี้มีอยู่ในระบบแล้ว' });
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO brands (brand_name) VALUES ($1) RETURNING *',
      [name]
    );
    const brand = rows[0];

    const typeIds = Array.isArray(device_type_ids)
      ? device_type_ids.map(Number).filter((id) => !isNaN(id) && id > 0)
      : [];

    for (const dtId of typeIds) {
      await client.query(
        'INSERT INTO brand_device_types (brand_id, device_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [brand.brand_id, dtId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: brand, message: 'เพิ่มยี่ห้อสำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/catalog/brands/:id
 * แก้ไขยี่ห้อ และอัปเดตประเภทอุปกรณ์ที่ผูก (Manager only)
 */
exports.updateBrand = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID ยี่ห้อไม่ถูกต้อง' });
    }

    const { brand_name, device_type_ids } = req.body;
    const name = (brand_name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อยี่ห้อ' });
    }

    const dupCheck = await client.query(
      'SELECT brand_id FROM brands WHERE LOWER(brand_name) = LOWER($1) AND brand_id != $2',
      [name, id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'ชื่อยี่ห้อนี้ซ้ำกับรายการอื่น' });
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      'UPDATE brands SET brand_name = $1 WHERE brand_id = $2 RETURNING *',
      [name, id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'ไม่พบยี่ห้อ' });
    }

    if (Array.isArray(device_type_ids)) {
      await client.query('DELETE FROM brand_device_types WHERE brand_id = $1', [id]);
      const typeIds = device_type_ids.map(Number).filter((tId) => !isNaN(tId) && tId > 0);
      for (const dtId of typeIds) {
        await client.query(
          'INSERT INTO brand_device_types (brand_id, device_type_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, dtId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: rows[0], message: 'แก้ไขยี่ห้อสำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/catalog/brands/:id
 * ลบยี่ห้อ (Manager only)
 */
exports.deleteBrand = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID ยี่ห้อไม่ถูกต้อง' });
    }

    // 1. ตรวจสอบว่ามีอุปกรณ์ในระบบใช้งานหรือไม่
    const devCheck = await client.query(
      'SELECT COUNT(*)::int AS count FROM device WHERE brand_id = $1',
      [id]
    );
    if (devCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบยี่ห้อนี้ได้เนื่องจากมีข้อมูลงานซ่อมในระบบใช้งานอยู่จำนวน ${devCheck.rows[0].count} เครื่อง`,
      });
    }

    // 2. ตรวจสอบรุ่นที่ผูกอยู่
    const modelCheck = await client.query(
      'SELECT COUNT(*)::int AS count FROM device_models WHERE brand_id = $1',
      [id]
    );
    if (modelCheck.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบได้เนื่องจากมีรุ่นอุปกรณ์ของยี่ห้อนี้ผูกอยู่จำนวน ${modelCheck.rows[0].count} รุ่น กรุณาลบรุ่นอุปกรณ์ก่อน`,
      });
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM brand_device_types WHERE brand_id = $1', [id]);
    const { rowCount } = await client.query('DELETE FROM brands WHERE brand_id = $1', [id]);
    await client.query('COMMIT');

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบยี่ห้อที่ต้องการลบ' });
    }

    res.json({ success: true, message: 'ลบยี่ห้อเรียบร้อยแล้ว' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ============================================================
// 3. MODELS (รุ่นอุปกรณ์)
// ============================================================

/**
 * GET /api/catalog/models
 * ดึงรายการรุ่น พร้อมข้อมูลยี่ห้อและประเภทอุปกรณ์
 */
exports.getAllModels = async (req, res, next) => {
  try {
    const { brand_id, device_type_id, search } = req.query;
    let query = `
      SELECT 
        dm.model_id,
        dm.model_name,
        dm.brand_id,
        COALESCE(b.brand_name, '-') AS brand_name,
        dm.device_type_id,
        COALESCE(dt.device_type_name, '-') AS device_type_name
      FROM device_models dm
      LEFT JOIN brands b ON dm.brand_id = b.brand_id
      LEFT JOIN device_types dt ON dm.device_type_id = dt.device_type_id
    `;

    const conditions = [];
    const params = [];

    if (brand_id && !isNaN(parseInt(brand_id, 10))) {
      params.push(parseInt(brand_id, 10));
      conditions.push(`dm.brand_id = $${params.length}`);
    }

    if (device_type_id && !isNaN(parseInt(device_type_id, 10))) {
      params.push(parseInt(device_type_id, 10));
      conditions.push(`dm.device_type_id = $${params.length}`);
    }

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      conditions.push(`(dm.model_name ILIKE $${params.length} OR b.brand_name ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY dt.device_type_id ASC, b.brand_name ASC, dm.model_name ASC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/catalog/models
 * เพิ่มรุ่นอุปกรณ์ใหม่ (Manager only)
 */
exports.createModel = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { model_name, brand_id, device_type_id } = req.body;
    const name = (model_name || '').trim();
    const bId = parseInt(brand_id, 10);
    const dtId = parseInt(device_type_id, 10);

    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อรุ่นอุปกรณ์' });
    }
    if (isNaN(bId) || bId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกยี่ห้อ' });
    }
    if (isNaN(dtId) || dtId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกประเภทอุปกรณ์' });
    }

    // ตรวจสอบชื่อรุ่นซ้ำในยี่ห้อและประเภทเดียวกัน
    const dupCheck = await client.query(
      `SELECT model_id FROM device_models 
       WHERE brand_id = $1 AND device_type_id = $2 AND LOWER(model_name) = LOWER($3)`,
      [bId, dtId, name]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'มีรุ่นนี้ในยี่ห้อและประเภทดังกล่าวอยู่แล้ว' });
    }

    await client.query('BEGIN');

    // ตรวจสอบและเชื่อมโยง brand_device_types อัตโนมัติถ้ายังไม่ผูก
    await client.query(
      `INSERT INTO brand_device_types (brand_id, device_type_id)
       VALUES ($1, $2)
       ON CONFLICT (brand_id, device_type_id) DO NOTHING`,
      [bId, dtId]
    );

    const { rows } = await client.query(
      `INSERT INTO device_models (model_name, brand_id, device_type_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, bId, dtId]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: rows[0], message: 'เพิ่มรุ่นอุปกรณ์สำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/catalog/models/:id
 * แก้ไขรุ่นอุปกรณ์ (Manager only)
 */
exports.updateModel = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID รุ่นอุปกรณ์ไม่ถูกต้อง' });
    }

    const { model_name, brand_id, device_type_id } = req.body;
    const name = (model_name || '').trim();
    const bId = parseInt(brand_id, 10);
    const dtId = parseInt(device_type_id, 10);

    if (!name) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อรุ่นอุปกรณ์' });
    }
    if (isNaN(bId) || bId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกยี่ห้อ' });
    }
    if (isNaN(dtId) || dtId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกประเภทอุปกรณ์' });
    }

    const dupCheck = await client.query(
      `SELECT model_id FROM device_models 
       WHERE brand_id = $1 AND device_type_id = $2 AND LOWER(model_name) = LOWER($3) AND model_id != $4`,
      [bId, dtId, name, id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'มีรุ่นนี้ในยี่ห้อและประเภทดังกล่าวอยู่แล้ว' });
    }

    await client.query('BEGIN');

    // ตรวจสอบและเชื่อมโยง brand_device_types อัตโนมัติ
    await client.query(
      `INSERT INTO brand_device_types (brand_id, device_type_id)
       VALUES ($1, $2)
       ON CONFLICT (brand_id, device_type_id) DO NOTHING`,
      [bId, dtId]
    );

    const { rows } = await client.query(
      `UPDATE device_models SET model_name = $1, brand_id = $2, device_type_id = $3
       WHERE model_id = $4
       RETURNING *`,
      [name, bId, dtId, id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'ไม่พบรุ่นอุปกรณ์' });
    }

    await client.query('COMMIT');
    res.json({ success: true, data: rows[0], message: 'แก้ไขรุ่นอุปกรณ์สำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/catalog/models/:id
 * ลบรุ่นอุปกรณ์ (Manager only)
 */
exports.deleteModel = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID รุ่นอุปกรณ์ไม่ถูกต้อง' });
    }

    const { rowCount } = await pool.query('DELETE FROM device_models WHERE model_id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรุ่นอุปกรณ์ที่ต้องการลบ' });
    }

    res.json({ success: true, message: 'ลบรุ่นอุปกรณ์เรียบร้อยแล้ว' });
  } catch (err) {
    next(err);
  }
};
