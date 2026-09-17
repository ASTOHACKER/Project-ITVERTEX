require('dotenv').config();
const pool = require('./config/db');

async function test() {
  const res = await pool.query(`
    SELECT 
      rjd.job_id_detail,
      rjd.job_id,
      rjd.user_id,
      rjd.action_type_id,
      at.action_type_name,
      p.first_name || ' ' || p.last_name AS technician_name,
      r.name AS role_name,
      rjd.created_at,
      rjd.remark
    FROM repair_job_detail rjd
    LEFT JOIN action_type at ON rjd.action_type_id = at.action_type_id
    LEFT JOIN profiles p ON rjd.user_id = p.id
    LEFT JOIN roles r ON p.role_id = r.id
    WHERE rjd.action_type_id = 5
    ORDER BY rjd.job_id ASC
  `);
  console.log('Action 5 (ซ่อมเสร็จสิ้น) records in database:');
  console.table(res.rows);
  await pool.end();
}

test();
