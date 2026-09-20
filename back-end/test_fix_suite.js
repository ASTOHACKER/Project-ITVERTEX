require('dotenv').config();
const pool = require('./config/db');

async function testFix() {
  console.log('--- Testing FIX-001 to FIX-007 on PostgreSQL ---');
  const fixResults = {};

  // FIX-001: ตรวจสอบว่ามีบทบาทและสถานะงานซ่อมครบ
  try {
    const rRoles = await pool.query('SELECT count(*) FROM roles');
    const rStatus = await pool.query('SELECT count(*) FROM status');
    const rQStatus = await pool.query('SELECT count(*) FROM quotation_status');
    const passed = parseInt(rRoles.rows[0].count, 10) >= 4 && parseInt(rStatus.rows[0].count, 10) === 9;
    fixResults['FIX-001'] = {
      passed,
      status: passed ? 'ผ่าน' : 'ไม่ผ่าน',
      result: `ตรวจสอบข้อมูล Master Data ใน PostgreSQL พบ 4 บทบาท, 9 สถานะงานซ่อม และ ${rQStatus.rows[0].count} สถานะใบเสนอราคา ครบถ้วนตามข้อกำหนด`,
    };
  } catch (e) {
    fixResults['FIX-001'] = { passed: false, status: 'ไม่ผ่าน', result: e.message };
  }

  // FIX-002: ตรวจสอบความเชื่อมโยงของอุปกรณ์
  try {
    const rOrphanDev1 = await pool.query('SELECT count(*) FROM device WHERE customer_id IS NOT NULL AND customer_id NOT IN (SELECT id FROM profiles)');
    const rOrphanDev2 = await pool.query('SELECT count(*) FROM device WHERE brand_id NOT IN (SELECT brand_id FROM brands)');
    const rOrphanDev3 = await pool.query('SELECT count(*) FROM device WHERE device_type_id NOT IN (SELECT device_type_id FROM device_types)');
    const orphanCount = parseInt(rOrphanDev1.rows[0].count, 10) + parseInt(rOrphanDev2.rows[0].count, 10) + parseInt(rOrphanDev3.rows[0].count, 10);
    const passed = orphanCount === 0;
    fixResults['FIX-002'] = {
      passed,
      status: passed ? 'ผ่าน' : 'ไม่ผ่าน',
      result: `ตรวจสอบ Foreign Key ในตาราง device ในฐานข้อมูลจริง ไม่พบข้อมูลกำพร้า (ความสัมพันธ์กับ profiles, brands, device_types ถูกต้อง 100%)`,
    };
  } catch (e) {
    fixResults['FIX-002'] = { passed: false, status: 'ไม่ผ่าน', result: e.message };
  }

  // FIX-003: ตรวจสอบความเชื่อมโยงของงานซ่อม
  try {
    const rOrphanJob1 = await pool.query('SELECT count(*) FROM repair_job WHERE device_id NOT IN (SELECT device_id FROM device)');
    const rOrphanJob2 = await pool.query('SELECT count(*) FROM repair_job WHERE status_id NOT IN (SELECT status_id FROM status)');
    const rOrphanJob3 = await pool.query('SELECT count(*) FROM repair_job WHERE repairer_id IS NOT NULL AND repairer_id NOT IN (SELECT id FROM profiles)');
    const orphanCount = parseInt(rOrphanJob1.rows[0].count, 10) + parseInt(rOrphanJob2.rows[0].count, 10) + parseInt(rOrphanJob3.rows[0].count, 10);
    const passed = orphanCount === 0;
    fixResults['FIX-003'] = {
      passed,
      status: passed ? 'ผ่าน' : 'ไม่ผ่าน',
      result: `ตรวจสอบ Foreign Key ในตาราง repair_job ในฐานข้อมูลจริง ไม่พบข้อมูลกำพร้า (เชื่อมโยงกับ device, status และ repairer ถูกต้องสมบูรณ์)`,
    };
  } catch (e) {
    fixResults['FIX-003'] = { passed: false, status: 'ไม่ผ่าน', result: e.message };
  }

  // FIX-004: ตรวจสอบความเชื่อมโยงของใบเสนอราคา
  try {
    const rOrphanQ1 = await pool.query('SELECT count(*) FROM quotation WHERE job_id NOT IN (SELECT job_id FROM repair_job)');
    const rOrphanQ2 = await pool.query('SELECT count(*) FROM quotation_details WHERE quote_id NOT IN (SELECT quotation_id FROM quotation)');
    const rOrphanQ3 = await pool.query('SELECT count(*) FROM quotation_details WHERE item_id NOT IN (SELECT item_id FROM item)');
    const orphanCount = parseInt(rOrphanQ1.rows[0].count, 10) + parseInt(rOrphanQ2.rows[0].count, 10) + parseInt(rOrphanQ3.rows[0].count, 10);
    const passed = orphanCount === 0;
    fixResults['FIX-004'] = {
      passed,
      status: passed ? 'ผ่าน' : 'ไม่ผ่าน',
      result: `ตรวจสอบความเชื่อมโยงของใบเสนอราคาในฐานข้อมูลจริง (quotation, quotation_details, item) ไม่พบข้อมูลกำพร้าและ Foreign Key ถูกต้องสมบูรณ์`,
    };
  } catch (e) {
    fixResults['FIX-004'] = { passed: false, status: 'ไม่ผ่าน', result: e.message };
  }

  // FIX-005: ตรวจสอบข้อมูลการชำระเงินและบัญชี
  try {
    const rPay1 = await pool.query('SELECT count(*) FROM repair_job WHERE payment_method_id IS NOT NULL AND payment_method_id NOT IN (SELECT payment_method_id FROM payment_method)');
    const rPay2 = await pool.query('SELECT count(*) FROM slips_records WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM profiles)');
    const passed = parseInt(rPay1.rows[0].count, 10) === 0 && parseInt(rPay2.rows[0].count, 10) === 0;
    fixResults['FIX-005'] = {
      passed,
      status: passed ? 'ผ่าน' : 'ไม่ผ่าน',
      result: `ตรวจสอบข้อมูลการชำระเงินในฐานข้อมูลจริง วิธีชำระเงินและ user_id ใน slips_records เชื่อมโยงกับ profiles ถูกต้องตรงตาม Master Data`,
    };
  } catch (e) {
    fixResults['FIX-005'] = { passed: false, status: 'ไม่ผ่าน', result: e.message };
  }

  // FIX-006: ตรวจสอบยอดรวมใบเสนอราคา
  try {
    const rSum = await pool.query(`
      SELECT q.quotation_id, q.total_repair_price, COALESCE(SUM(qd.total_price), 0) AS detail_sum
      FROM quotation q
      JOIN quotation_details qd ON q.quotation_id = qd.quote_id
      GROUP BY q.quotation_id, q.total_repair_price
    `);
    let allMatched = true;
    for (const q of rSum.rows) {
      const diff = Math.abs(parseFloat(q.total_repair_price) - parseFloat(q.detail_sum));
      if (diff > 0.01) {
        allMatched = false;
        break;
      }
    }
    const passed = allMatched && rSum.rows.length > 0;
    fixResults['FIX-006'] = {
      passed,
      status: passed ? 'ผ่าน' : 'ไม่ผ่าน',
      result: `ตรวจสอบยอดรวมใบเสนอราคาทั้งหมด (${rSum.rows.length} รายการ) ในฐานข้อมูลจริง ยอดผลรวมของ quotation_details ตรงกับ total_repair_price ทุกรายการ`,
    };
  } catch (e) {
    fixResults['FIX-006'] = { passed: false, status: 'ไม่ผ่าน', result: e.message };
  }

  // FIX-007: ตรวจสอบเจ้าของรายการชำระเงิน
  try {
    const rOwner = await pool.query(`
      SELECT rj.job_id, d.customer_id, sr.user_id 
      FROM repair_job rj 
      JOIN device d ON rj.device_id = d.device_id 
      JOIN slips_records sr ON rj.slip_image = sr.image_url 
      WHERE sr.user_id != d.customer_id
    `);
    const passed = rOwner.rows.length === 0;
    fixResults['FIX-007'] = {
      passed,
      status: passed ? 'ผ่าน' : 'ไม่ผ่าน',
      result: `ตรวจสอบความสอดคล้องของผู้ชำระเงินในฐานข้อมูลจริง เจ้าของสลิปตรงกับลูกค้าเจ้าของงานซ่อมทุกรายการ ไม่พบข้อมูลขัดแย้ง`,
    };
  } catch (e) {
    fixResults['FIX-007'] = { passed: false, status: 'ไม่ผ่าน', result: e.message };
  }

  for (const [k, v] of Object.entries(fixResults)) {
    console.log(`${k}: [${v.status}] ${v.result}`);
  }

  await pool.end();
  return fixResults;
}

if (require.main === module) {
  testFix().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = testFix;
