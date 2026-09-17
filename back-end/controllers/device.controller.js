const pool = require('../config/db');

/**
 * GET /api/devices
 */
exports.getAll = async (req, res, next) => {
  try {
    const { customer_id } = req.query;
    let query = `
      SELECT d.*, 
             COALESCE(dt.device_type_name, '-') AS device_type_name,
             COALESCE(b.brand_name, '-') AS brand_name,
             COALESCE(p.first_name || ' ' || p.last_name, '') AS customer_name 
      FROM device d 
      LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
      LEFT JOIN brands b ON d.brand_id = b.brand_id
      LEFT JOIN profiles p ON d.customer_id = p.id
    `;
    const params = [];

    if (customer_id && String(customer_id).trim()) {
      query += ' WHERE d.customer_id = $1';
      params.push(String(customer_id).trim());
    }
    query += ' ORDER BY d.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/devices
 */
exports.create = async (req, res, next) => {
  try {
    const {
      customer_id, device_type_id, brand_id, brand_name, model,
      included_accessories, warranty_year, warranty_end_date,
      serial_number, important_software, device_password,
    } = req.body;

    const parsedCustomerId = customer_id && String(customer_id).trim() !== '' ? String(customer_id).trim() : null;
    const parsedDeviceTypeId = device_type_id ? parseInt(device_type_id, 10) : null;
    let parsedBrandId = brand_id ? parseInt(brand_id, 10) : null;
    const parsedWarrantyYear = warranty_year ? Math.max(0, parseInt(warranty_year, 10) || 0) : 0;
    const parsedWarrantyEndDate = warranty_end_date && String(warranty_end_date).trim() !== '' ? String(warranty_end_date).trim() : null;

    if (!parsedDeviceTypeId || isNaN(parsedDeviceTypeId) || parsedDeviceTypeId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุประเภทอุปกรณ์ที่ถูกต้อง' });
    }

    // ถ้าไม่มี brand_id แต่มี brand_name → ค้นหาหรือสร้างยี่ห้อใหม่อัตโนมัติ
    if ((!parsedBrandId || isNaN(parsedBrandId) || parsedBrandId <= 0) && brand_name && String(brand_name).trim()) {
      const trimmedBrandName = String(brand_name).trim();
      // ค้นหาว่ามียี่ห้อนี้อยู่แล้วหรือไม่ (case-insensitive)
      const existing = await pool.query(
        'SELECT brand_id FROM brands WHERE LOWER(brand_name) = LOWER($1) LIMIT 1',
        [trimmedBrandName]
      );
      if (existing.rows.length > 0) {
        parsedBrandId = existing.rows[0].brand_id;
      } else {
        // สร้างยี่ห้อใหม่
        const inserted = await pool.query(
          'INSERT INTO brands (brand_name) VALUES ($1) RETURNING brand_id',
          [trimmedBrandName]
        );
        parsedBrandId = inserted.rows[0].brand_id;
      }
    }

    if (!parsedBrandId || isNaN(parsedBrandId) || parsedBrandId <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุยี่ห้ออุปกรณ์ที่ถูกต้อง' });
    }

    const { rows } = await pool.query(
      `INSERT INTO device (customer_id, device_type_id, brand_id, model, included_accessories,
        warranty_year, warranty_end_date, serial_number, important_software, device_password)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        parsedCustomerId,
        parsedDeviceTypeId,
        parsedBrandId,
        (model || '-').trim(),
        (included_accessories || '-').trim(),
        parsedWarrantyYear,
        parsedWarrantyEndDate,
        (serial_number || '-').trim(),
        (important_software || '-').trim(),
        (device_password || '-').trim(),
      ]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/devices/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({ success: false, message: 'ID อุปกรณ์ไม่ถูกต้อง' });
    }

    const {
      customer_id, device_type_id, brand_id, model,
      included_accessories, warranty_year, warranty_end_date,
      serial_number, important_software, device_password,
    } = req.body;

    const parsedCustomerId = customer_id && String(customer_id).trim() !== '' ? String(customer_id).trim() : null;
    const parsedDeviceTypeId = device_type_id ? parseInt(device_type_id, 10) : null;
    const parsedBrandId = brand_id ? parseInt(brand_id, 10) : null;
    const parsedWarrantyYear = warranty_year !== undefined ? Math.max(0, parseInt(warranty_year, 10) || 0) : null;
    const parsedWarrantyEndDate = warranty_end_date && String(warranty_end_date).trim() !== '' ? String(warranty_end_date).trim() : null;

    const { rows } = await pool.query(
      `UPDATE device SET
        customer_id = COALESCE($1, customer_id), 
        device_type_id = COALESCE($2, device_type_id), 
        brand_id = COALESCE($3, brand_id), 
        model = COALESCE($4, model), 
        included_accessories = COALESCE($5, included_accessories),
        warranty_year = COALESCE($6, warranty_year), 
        warranty_end_date = COALESCE($7, warranty_end_date), 
        serial_number = COALESCE($8, serial_number), 
        important_software = COALESCE($9, important_software), 
        device_password = COALESCE($10, device_password)
       WHERE device_id = $11
       RETURNING *`,
      [
        parsedCustomerId,
        parsedDeviceTypeId,
        parsedBrandId,
        model ? String(model).trim() : null,
        included_accessories ? String(included_accessories).trim() : null,
        parsedWarrantyYear,
        parsedWarrantyEndDate,
        serial_number ? String(serial_number).trim() : null,
        important_software ? String(important_software).trim() : null,
        device_password ? String(device_password).trim() : null,
        numId,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบอุปกรณ์' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

