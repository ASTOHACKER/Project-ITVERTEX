const pool = require('../config/db');

/**
 * GET /api/lookup/statuses
 */
exports.getStatuses = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM status ORDER BY status_id');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/action-types
 */
exports.getActionTypes = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM action_type ORDER BY action_type_id');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/payment-methods
 */
exports.getPaymentMethods = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM payment_method ORDER BY payment_method_id');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/item-types
 */
exports.getItemTypes = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM item_type ORDER BY item_type_id');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/quotation-statuses
 */
exports.getQuotationStatuses = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM quotation_status ORDER BY quote_status_id');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/device-types
 */
exports.getDeviceTypes = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM device_types ORDER BY device_type_id');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/brands
 */
exports.getBrands = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM brands ORDER BY brand_id');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/lookup/models
 * ค้นหาหรือดึงรุ่นตาม brand_id หรือ device_type_id
 */
exports.getModels = async (req, res, next) => {
  try {
    const { brand_id, device_type_id } = req.query;
    let query = 'SELECT * FROM device_models';
    const conditions = [];
    const params = [];

    if (brand_id) {
      params.push(brand_id);
      conditions.push(`brand_id = $${params.length}`);
    }
    if (device_type_id) {
      params.push(device_type_id);
      conditions.push(`device_type_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY model_name ASC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/lookup/profiles
 * ค้นหา profiles สำหรับ autocomplete (CustomerFormCard)
 */
exports.searchProfiles = async (req, res, next) => {
  try {
    const { q, type } = req.query; // type = 'name' | 'phone'
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    let query;
    let params;
    if (type === 'phone') {
      query = `SELECT id, first_name, last_name, phone, email FROM profiles WHERE phone ILIKE $1 AND role_id = 4 LIMIT 10`;
      params = [`%${q}%`];
    } else {
      query = `SELECT id, first_name, last_name, phone, email FROM profiles
               WHERE CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) ILIKE $1 AND role_id = 4 LIMIT 10`;
      params = [`%${q}%`];
    }

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
