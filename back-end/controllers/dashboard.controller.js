const pool = require('../config/db');
const dashboardQueries = require('../queries/dashboard.queries');
const { REPAIR_STATUS } = require('../constants');

/**
 * รวมฟังก์ชันสร้างเงื่อนไขตัวกรองวันที่ ช่วงเวลา (day/month/year) และประเภทอุปกรณ์
 * เพื่อให้กราฟและรายงานทุกตัวกรองตรงกันและซิงค์ไปด้วยกันทั้งหมด
 */
function buildDateAndDeviceConditions(query, dateCol = 'rj.created_at', devCol = 'dt.device_type_name') {
  const { period, date_start, date_end, device_type } = query;
  let conditions = '';
  const params = [];
  let paramIdx = 1;

  if (date_start && String(date_start).trim()) {
    conditions += ` AND ${dateCol} >= $${paramIdx++}`;
    params.push(String(date_start).trim());
  }
  if (date_end && String(date_end).trim()) {
    conditions += ` AND ${dateCol} <= $${paramIdx++}::date + interval '1 day'`;
    params.push(String(date_end).trim());
  }

  // หากไม่ได้ระบุช่วงวันที่ชัดเจน ให้กรองตาม period (วัน=30 วันล่าสุด, เดือน=ปีนี้, ปี=5 ปีย้อนหลัง)
  if ((!date_start || !String(date_start).trim()) && (!date_end || !String(date_end).trim())) {
    if (period === 'day') {
      conditions += ` AND ${dateCol} >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (period === 'month') {
      conditions += ` AND ${dateCol} >= DATE_TRUNC('year', CURRENT_DATE)`;
    } else if (period === 'year') {
      conditions += ` AND ${dateCol} >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '4 years'`;
    }
  }

  // กรองตามประเภทอุปกรณ์ (pc, laptop, printer)
  if (device_type && device_type !== 'all') {
    if (device_type === 'pc') {
      conditions += ` AND (LOWER(${devCol}) LIKE '%desktop%' OR LOWER(${devCol}) LIKE '%pc%')`;
    } else if (device_type === 'laptop') {
      conditions += ` AND (LOWER(${devCol}) LIKE '%notebook%' OR LOWER(${devCol}) LIKE '%laptop%')`;
    } else if (device_type === 'printer') {
      conditions += ` AND (LOWER(${devCol}) LIKE '%printer%' OR LOWER(${devCol}) LIKE '%print%')`;
    }
  }

  return { conditions, params };
}

/**
 * GET /api/dashboard/metrics
 */
exports.getMetrics = async (req, res, next) => {
  try {
    const { conditions, params } = buildDateAndDeviceConditions(req.query, 'rj.created_at', 'dt.device_type_name');

    const query = dashboardQueries.BUILD_METRICS_QUERY(conditions);
    const { rows: jobs } = await pool.query(query, params);

    const totalJobs = jobs.length;
    let totalRevenue = 0;
    let completedJobs = 0;
    let pendingJobs = 0;

    // Calculate metrics
    jobs.forEach(job => {
      const isPaid = job.status_id === REPAIR_STATUS.COMPLETED;
      if (job.total_amount && isPaid) {
        totalRevenue += parseFloat(job.total_amount);
      }

      if (job.status_id === REPAIR_STATUS.COMPLETED) {
        completedJobs++;
      }

      const pendingStatusIds = [
        REPAIR_STATUS.PENDING_CHECK,
        REPAIR_STATUS.CHECKING,
        REPAIR_STATUS.MAKING_QUOTE,
        REPAIR_STATUS.PENDING_APPROVAL,
        REPAIR_STATUS.APPROVED_WAIT_REPAIR,
        REPAIR_STATUS.WAITING_PAYMENT,
        REPAIR_STATUS.READY_FOR_PICKUP,
      ];
      if (pendingStatusIds.includes(job.status_id)) {
        pendingJobs++;
      }
    });

    res.json({
      success: true,
      data: { totalRevenue, totalJobs, completedJobs, pendingJobs },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/trend
 * แสดงแนวโน้มวัน เดือน ปี แบบเต็มช่วง (เช่น 1-31 วัน, 12 เดือน, ปีเต็ม) รองรับการกรอง
 */
exports.getTrend = async (req, res, next) => {
  try {
    const { period, metric_type = 'count', date_start, date_end } = req.query;

    const safePeriod = ['day', 'month', 'year'].includes(period) ? period : 'day';
    const safeMetric = metric_type === 'revenue' ? 'revenue' : 'count';

    const selectExpr = safeMetric === 'revenue'
      ? `COALESCE(SUM(CASE WHEN rj.status_id = ${REPAIR_STATUS.COMPLETED} THEN rj.total_amount ELSE 0 END), 0) AS value`
      : "COUNT(*) AS value";

    const { conditions: whereConditions, params } = buildDateAndDeviceConditions(req.query, 'rj.created_at', 'dt.device_type_name');

    let result = [];

    if (safePeriod === 'day') {
      const hasDateRange = date_start && date_end;
      const s = hasDateRange ? new Date(String(date_start).trim()) : null;
      const e = hasDateRange ? new Date(String(date_end).trim()) : null;

      if (s && e && !isNaN(s.getTime()) && !isNaN(e.getTime()) && s <= e) {
        // กรองตามช่วงวันที่ที่เลือก และเติมวันทุกวันที่อยู่ในช่วง
        const query = dashboardQueries.BUILD_TREND_QUERY({
          labelFormat: "TO_CHAR(rj.created_at, 'YYYY-MM-DD')",
          selectExpr,
          whereConditions,
          groupBy: "TO_CHAR(rj.created_at, 'YYYY-MM-DD')",
        });
        const { rows } = await pool.query(query, params);
        const map = new Map();
        rows.forEach((r) => map.set(r.label, Math.round(parseFloat(r.value) || 0)));

        const curr = new Date(s);
        const totalDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        while (curr <= e) {
          const isoKey = curr.toISOString().slice(0, 10);
          const dayNum = curr.getDate();
          result.push({
            label: totalDays <= 31 ? String(dayNum) : `${String(dayNum)}/${String(curr.getMonth() + 1)}`,
            value: map.get(isoKey) || 0,
            full_date: isoKey,
          });
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        // แสดงวันเต็มเดือน 1 - 31
        const query = dashboardQueries.BUILD_TREND_QUERY({
          labelFormat: "TO_CHAR(rj.created_at, 'DD')",
          selectExpr,
          whereConditions,
          groupBy: "TO_CHAR(rj.created_at, 'DD')",
        });
        const { rows } = await pool.query(query, params);
        const map = new Map();
        rows.forEach((r) => map.set(String(parseInt(r.label, 10)), Math.round(parseFloat(r.value) || 0)));

        for (let d = 1; d <= 31; d++) {
          result.push({
            label: String(d),
            value: map.get(String(d)) || 0,
          });
        }
      }
    } else if (safePeriod === 'month') {
      // แสดง 12 เดือนเต็ม (Jan - Dec / ม.ค. - ธ.ค.)
      const query = dashboardQueries.BUILD_TREND_QUERY({
        labelFormat: "TO_CHAR(rj.created_at, 'MM')",
        selectExpr,
        whereConditions,
        groupBy: "TO_CHAR(rj.created_at, 'MM')",
      });
      const { rows } = await pool.query(query, params);
      const map = new Map();
      rows.forEach((r) => map.set(String(parseInt(r.label, 10)), Math.round(parseFloat(r.value) || 0)));

      const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 1; m <= 12; m++) {
        result.push({
          label: MONTH_NAMES[m - 1],
          value: map.get(String(m)) || 0,
        });
      }
    } else if (safePeriod === 'year') {
      // แสดงปีเต็ม 5 ปีล่าสุด
      const query = dashboardQueries.BUILD_TREND_QUERY({
        labelFormat: "TO_CHAR(rj.created_at, 'YYYY')",
        selectExpr,
        whereConditions,
        groupBy: "TO_CHAR(rj.created_at, 'YYYY')",
      });
      const { rows } = await pool.query(query, params);
      const map = new Map();
      rows.forEach((r) => map.set(r.label, Math.round(parseFloat(r.value) || 0)));

      const currentYear = new Date().getFullYear();
      for (let y = currentYear - 4; y <= currentYear; y++) {
        result.push({
          label: String(y),
          value: map.get(String(y)) || 0,
        });
      }
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/parts-usage
 * ดูสถิติการใช้อะไหล่ในงานซ่อม (กี่ชิ้น)
 */
exports.getPartsUsage = async (req, res, next) => {
  try {
    const { conditions: whereConditions, params } = buildDateAndDeviceConditions(req.query, 'rj.created_at', 'dt.device_type_name');

    const query = `
      SELECT 
        i.item_id,
        i.item_name,
        SUM(COALESCE(qd.quantity, 1)::numeric)::int AS total_quantity,
        COUNT(DISTINCT q.job_id)::int AS jobs_count,
        SUM(COALESCE(qd.total_price, 0)::numeric)::float AS total_cost
      FROM quotation_details qd
      JOIN quotation q ON qd.quote_id = q.quotation_id
      JOIN repair_job rj ON q.job_id = rj.job_id
      LEFT JOIN device d ON rj.device_id = d.device_id
      LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
      JOIN item i ON qd.item_id = i.item_id
      WHERE i.item_type_id = 1 ${whereConditions}
      GROUP BY i.item_id, i.item_name
      ORDER BY total_quantity DESC, total_cost DESC
      LIMIT 10;
    `;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows.map((r) => ({
        item_id: r.item_id,
        item_name: r.item_name,
        total_quantity: Number(r.total_quantity) || 0,
        jobs_count: Number(r.jobs_count) || 0,
        total_cost: Number(r.total_cost) || 0,
        unit: 'ชิ้น',
      })),
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/dashboard/category
 */
exports.getCategory = async (req, res, next) => {
  try {
    const { conditions: whereConditions, params } = buildDateAndDeviceConditions(req.query, 'rj.created_at', 'dt.device_type_name');

    const query = dashboardQueries.BUILD_CATEGORY_QUERY(whereConditions);
    const { rows } = await pool.query(query, params);

    // Summarize into pc / laptop / printer / other
    let pcCount = 0;
    let laptopCount = 0;
    let printerCount = 0;
    let otherCount = 0;

    rows.forEach(row => {
      const typeString = row.device_type.toLowerCase();
      const count = parseInt(row.count, 10);

      if (typeString.includes('desktop') || typeString.includes('pc')) {
        pcCount += count;
      } else if (typeString.includes('notebook') || typeString.includes('laptop')) {
        laptopCount += count;
      } else if (typeString.includes('printer') || typeString.includes('print')) {
        printerCount += count;
      } else {
        otherCount += count;
      }
    });

    const total = pcCount + laptopCount + printerCount + otherCount;

    res.json({
      success: true,
      data: {
        total,
        pc: pcCount,
        laptop: laptopCount,
        printer: printerCount,
        other: otherCount,
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/team-performance
 * ดู Performance ทีมรายบุคคล (Bar Chart)
 * หน่วย: เครื่อง
 */
exports.getTeamPerformance = async (req, res, next) => {
  try {
    const { conditions: rjFilter, params } = buildDateAndDeviceConditions(req.query, 'rj_sub.created_at', 'dt_sub.device_type_name');

    const query = `
      SELECT 
        p.id,
        TRIM(p.first_name || ' ' || COALESCE(p.last_name, '')) AS name,
        r.name AS role_name,
        COUNT(DISTINCT rj.job_id)::int AS total_jobs,
        COUNT(DISTINCT CASE WHEN rj.status_id = ${REPAIR_STATUS.COMPLETED} THEN rj.job_id END)::int AS completed_jobs
      FROM profiles p
      JOIN roles r ON p.role_id = r.id
      LEFT JOIN (
        SELECT DISTINCT rj_sub.job_id, rj_sub.status_id, rj_sub.device_id, rj_sub.created_at, sub_user.user_id
        FROM repair_job rj_sub
        LEFT JOIN device d_sub ON rj_sub.device_id = d_sub.device_id
        LEFT JOIN device_types dt_sub ON d_sub.device_type_id = dt_sub.device_type_id
        JOIN (
          SELECT job_id, user_id FROM repair_job_detail
          UNION
          SELECT job_id, repairer_id AS user_id FROM repair_job WHERE repairer_id IS NOT NULL
        ) sub_user ON rj_sub.job_id = sub_user.job_id
        WHERE 1=1 ${rjFilter}
      ) rj ON rj.user_id = p.id
      WHERE p.role_id IN (2, 3)
      GROUP BY p.id, p.first_name, p.last_name, r.name
      ORDER BY completed_jobs DESC, total_jobs DESC, p.id ASC;
    `;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name || 'เจ้าหน้าที่',
        role_name: r.role_name,
        total_jobs: Number(r.total_jobs) || 0,
        completed_jobs: Number(r.completed_jobs) || 0,
        unit: 'เครื่อง',
      })),
    });
  } catch (err) {
    next(err);
  }
};

