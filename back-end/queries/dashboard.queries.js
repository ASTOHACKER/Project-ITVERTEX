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

/**
 * นับวันเคลื่อนงานรายบุคคลจาก repair_job_detail (ใช้แทนการลงเวลาเข้างาน
 * โดยไม่ต้องเพิ่มตารางใหม่) — whereConditions สร้างด้วย dateCol='d.action_date'
 */
exports.BUILD_WORK_ACTIVITY_QUERY = (whereConditions = '') => `
  SELECT
    p.id,
    TRIM(p.first_name || ' ' || COALESCE(p.last_name, '')) AS name,
    r.name AS role_name,
    COUNT(DISTINCT d.action_date)::int AS active_days,
    COUNT(*)::int AS total_actions,
    COUNT(DISTINCT d.job_id)::int AS jobs_touched
  FROM repair_job_detail d
  JOIN profiles p ON p.id = d.user_id
  JOIN roles r ON p.role_id = r.id
  LEFT JOIN repair_job rj ON rj.job_id = d.job_id
  LEFT JOIN device dv ON rj.device_id = dv.device_id
  LEFT JOIN device_types dt ON dv.device_type_id = dt.device_type_id
  WHERE d.user_id IS NOT NULL
    AND p.role_id IN (1, 2, 3)
    ${whereConditions}
  GROUP BY p.id, p.first_name, p.last_name, r.name
  ORDER BY active_days DESC, total_actions DESC
`;

/**
 * จัดกลุ่มอาการเสีย (free text) เป็นหมวดคีย์เวิร์ดเพื่อนับอาการที่พบบ่อย
 * ลำดับ WHEN สำคัญ: เช็คปริ้นเตอร์ก่อนคีย์บอร์ดเพราะคำว่า "พิมพ์" ชนกัน
 */
exports.BUILD_SYMPTOMS_QUERY = (whereConditions = '') => `
  SELECT grp AS label, COUNT(*)::int AS jobs_count
  FROM (
    SELECT CASE
      WHEN rj.symptom_details LIKE '%เปิดไม่ติด%' OR rj.symptom_details LIKE '%ไม่ขึ้นภาพ%' OR rj.symptom_details LIKE '%บูต%' OR rj.symptom_details LIKE '%จอฟ้า%' OR rj.symptom_details LIKE '%Boot%' OR rj.symptom_details LIKE '%ดับวูบ%' OR rj.symptom_details LIKE '%เปิดไม่%' THEN 'เปิดไม่ติด/ดับ/บูตไม่ขึ้น'
      WHEN rj.symptom_details LIKE '%ปริ้น%' OR rj.symptom_details LIKE '%หมึก%' OR rj.symptom_details LIKE '%พิมพ์เอกสาร%' THEN 'ปริ้นเตอร์/หมึกพิมพ์'
      WHEN rj.symptom_details LIKE '%จอ%' OR rj.symptom_details LIKE '%ภาพ%' OR rj.symptom_details LIKE '%เส้น%' OR rj.symptom_details LIKE '%มืด%' THEN 'จอภาพ/แสดงผล'
      WHEN rj.symptom_details LIKE '%แบต%' OR rj.symptom_details LIKE '%บวม%' OR rj.symptom_details LIKE '%ชาร์จ%' THEN 'แบตเตอรี่/ชาร์จไฟ'
      WHEN rj.symptom_details LIKE '%คีย์บอร์ด%' OR rj.symptom_details LIKE '%คีย์%' OR rj.symptom_details LIKE '%ปุ่ม%' OR rj.symptom_details LIKE '%ทัชแพด%' OR rj.symptom_details LIKE '%แป้น%' THEN 'คีย์บอร์ด/ปุ่มกด'
      WHEN rj.symptom_details LIKE '%ค้าง%' OR rj.symptom_details LIKE '%ช้า%' OR rj.symptom_details LIKE '%ร้อน%' OR rj.symptom_details LIKE '%กระตุก%' OR rj.symptom_details LIKE '%พัดลม%' THEN 'เครื่องค้าง/ช้า/ร้อน'
      WHEN rj.symptom_details LIKE '%อัปเกรด%' OR rj.symptom_details LIKE '%อัพเกรด%' OR rj.symptom_details LIKE '%เพิ่มพื้นที่%' OR rj.symptom_details LIKE '%โอนย้าย%' THEN 'อัปเกรด/เพิ่มสเปก'
      WHEN rj.symptom_details LIKE '%น้ำหก%' OR rj.symptom_details LIKE '%ตกพื้น%' OR rj.symptom_details LIKE '%แตก%' OR rj.symptom_details LIKE '%หัก%' OR rj.symptom_details LIKE '%ไหม้%' THEN 'อุบัติเหตุ/เสียหายภายนอก'
      ELSE 'อื่นๆ'
    END AS grp
    FROM repair_job rj
    LEFT JOIN device dv ON rj.device_id = dv.device_id
    LEFT JOIN device_types dt ON dv.device_type_id = dt.device_type_id
    WHERE 1=1 ${whereConditions}
  ) s
  GROUP BY grp
  ORDER BY jobs_count DESC
`;
