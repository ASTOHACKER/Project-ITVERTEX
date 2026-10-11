/**
 * queries/repair.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูลงานซ่อม (Repair Job)
 */

const SELECT_REPAIR_FIELDS = `
  SELECT 
    rj.*,
    d.model,
    d.serial_number,
    d.included_accessories,
    d.important_software,
    d.device_password,
    d.warranty_year,
    d.warranty_end_date,
    d.customer_id,
    dt.device_type_name AS device_type,
    b.brand_name AS brand,
    s.status_name,
    pm.payment_method_name,
    p.first_name,
    p.last_name,
    p.phone,
    p.email,
    p_rep.first_name AS rep_first_name,
    p_rep.last_name AS rep_last_name,
    q.quote_status_id,
    q.customer_remark,
    q.total_repair_price,
    q.total_cancel_price
  FROM repair_job rj
  LEFT JOIN device d ON rj.device_id = d.device_id
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
  LEFT JOIN brands b ON d.brand_id = b.brand_id
  LEFT JOIN status s ON rj.status_id = s.status_id
  LEFT JOIN payment_method pm ON rj.payment_method_id = pm.payment_method_id
  LEFT JOIN profiles p ON d.customer_id = p.id
  LEFT JOIN profiles p_rep ON rj.repairer_id = p_rep.id
  LEFT JOIN quotation q ON rj.quotation_id = q.quotation_id
`;

exports.BUILD_GET_ALL_REPAIRS = (whereClause = '') => `
  ${SELECT_REPAIR_FIELDS}
  ${whereClause}
  ORDER BY rj.created_at DESC
`;

exports.GET_REPAIR_BY_ID = `
  ${SELECT_REPAIR_FIELDS}
  WHERE rj.job_id = $1
`;

exports.FIND_QUOTATION_BY_JOB_ID = `
  SELECT quotation_id FROM quotation WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1
`;

exports.GET_QUOTATION_BY_ID = `
  SELECT q.*, qs.quote_status_name
  FROM quotation q
  LEFT JOIN quotation_status qs ON q.quote_status_id = qs.quote_status_id
  WHERE q.quotation_id = $1
`;

exports.GET_QUOTATION_ITEMS = `
  SELECT qd.*, i.item_name, i.item_type_id, it.item_type_name
  FROM quotation_details qd
  LEFT JOIN item i ON qd.item_id = i.item_id
  LEFT JOIN item_type it ON i.item_type_id = it.item_type_id
  WHERE qd.quote_id = $1
`;

exports.GET_ACTION_LOGS = `
  SELECT 
    rjd.*, 
    at.action_type_name,
    p.first_name,
    p.last_name,
    p.role_id, 
    r.name AS role_name
  FROM repair_job_detail rjd
  LEFT JOIN action_type at ON rjd.action_type_id = at.action_type_id
  LEFT JOIN profiles p ON rjd.user_id = p.id
  LEFT JOIN roles r ON p.role_id = r.id
  WHERE rjd.job_id = $1
  ORDER BY rjd.created_at ASC
`;

exports.INSERT_REPAIR_JOB = `
  INSERT INTO repair_job (device_id, symptom_details, appointment_date, status_id)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`;

exports.UPDATE_REPAIR_JOB = `
  UPDATE repair_job SET
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
  RETURNING *
`;

exports.UPDATE_REPAIR_SIGNATURE = `
  UPDATE repair_job 
  SET customer_receive_signature = $1, return_date = COALESCE(return_date, NOW()) 
  WHERE job_id = $2 
  RETURNING *
`;

exports.INSERT_ACTION_LOG = `
  INSERT INTO repair_job_detail (job_id, user_id, action_type_id, action_date, remark)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *
`;

exports.DELETE_REPAIR_DETAILS = `
  DELETE FROM repair_job_detail WHERE job_id = $1
`;

exports.DELETE_REPAIR_JOB = `
  DELETE FROM repair_job WHERE job_id = $1
`;
