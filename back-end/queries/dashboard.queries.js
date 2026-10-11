/**
 * queries/dashboard.queries.js
 * รวมคำสั่ง SQL Queries สำหรับโมดูล Dashboard
 */

exports.BUILD_METRICS_QUERY = (whereConditions = '') => `
  SELECT rj.*, dt.device_type_name AS device_type 
  FROM repair_job rj 
  LEFT JOIN device d ON rj.device_id = d.device_id 
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id 
  WHERE 1=1 ${whereConditions}
`;

exports.BUILD_TREND_QUERY = ({ labelFormat, selectExpr, whereConditions, groupBy }) => `
  SELECT ${labelFormat} AS label, ${selectExpr}
  FROM repair_job rj
  LEFT JOIN device d ON rj.device_id = d.device_id
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
  WHERE 1=1 ${whereConditions}
  GROUP BY ${groupBy}, ${labelFormat} 
  ORDER BY ${groupBy}
`;

exports.BUILD_CATEGORY_QUERY = (whereConditions = '') => `
  SELECT COALESCE(dt.device_type_name, 'ไม่ระบุ') AS device_type, COUNT(*) AS count
  FROM repair_job rj
  LEFT JOIN device d ON rj.device_id = d.device_id
  LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
  WHERE 1=1 ${whereConditions}
  GROUP BY dt.device_type_name 
  ORDER BY count DESC
`;
