const pool = require('../config/db');

/**
 * GET /api/dashboard/metrics
 */
exports.getMetrics = async (req, res, next) => {
  try {
    const { date_start, date_end, device_type } = req.query;

    let query = `SELECT rj.*, dt.device_type_name AS device_type 
                 FROM repair_job rj 
                 LEFT JOIN device d ON rj.device_id = d.device_id 
                 LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id 
                 WHERE 1=1`;
    const params = [];
    let paramIdx = 1;

    if (date_start) {
      query += ` AND rj.created_at >= $${paramIdx++}`;
      params.push(date_start);
    }
    if (date_end) {
      query += ` AND rj.created_at <= $${paramIdx++}::date + interval '1 day'`;
      params.push(date_end);
    }

    const { rows: jobs } = await pool.query(query, params);

    // Filter by device_type in app (because it needs flexible matching)
    let filteredJobs = jobs;

    if (device_type && device_type !== 'all') {
      filteredJobs = jobs.filter(job => {
        const typeString = (job.device_type || '').toLowerCase();

        if (device_type === 'pc') {
          return typeString.includes('desktop') || typeString.includes('pc');
        }

        if (device_type === 'laptop') {
          return typeString.includes('notebook') || typeString.includes('laptop');
        }

        if (device_type === 'printer') {
          return typeString.includes('printer') || typeString.includes('print');
        }

        return true;
      });
    }

    const totalJobs = filteredJobs.length;
    let totalRevenue = 0;
    let completedJobs = 0;
    let pendingJobs = 0;

    // Calculate metrics
    filteredJobs.forEach(job => {
      // คิดรายได้เฉพาะงานที่สถานะเสร็จสิ้น (status_id === 8) เท่านั้น
      const isPaid = job.status_id === 8;
      if (job.total_amount && isPaid) {
        totalRevenue += parseFloat(job.total_amount);
      }

      if (job.status_id === 8) {
        completedJobs++;
      }

      const pendingStatusIds = [1, 2, 3, 4, 5, 6, 7];
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
 */
exports.getTrend = async (req, res, next) => {
  try {
    const { period, metric_type = 'count', date_start, date_end, device_type } = req.query;

    const safePeriod = ['day', 'month', 'year'].includes(period) ? period : 'day';
    const safeMetric = metric_type === 'revenue' ? 'revenue' : 'count';
    const safeDeviceType = ['pc', 'laptop', 'printer'].includes(device_type) ? device_type : null;

    let groupBy, labelFormat;
    if (safePeriod === 'year') {
      groupBy = "TO_CHAR(rj.created_at, 'YYYY')";
      labelFormat = "TO_CHAR(rj.created_at, 'YYYY')";
    } else if (safePeriod === 'month') {
      groupBy = "TO_CHAR(rj.created_at, 'YYYY-MM')";
      labelFormat = "TO_CHAR(rj.created_at, 'Mon')";
    } else {
      groupBy = "DATE(rj.created_at)";
      labelFormat = "TO_CHAR(rj.created_at, 'DD')";
    }

    const selectExpr = safeMetric === 'revenue'
      ? "COALESCE(SUM(CASE WHEN rj.status_id = 8 THEN rj.total_amount ELSE 0 END), 0) AS value"
      : "COUNT(*) AS value";

    let query = `SELECT ${labelFormat} AS label, ${selectExpr}
                 FROM repair_job rj
                 LEFT JOIN device d ON rj.device_id = d.device_id
                 LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
                 WHERE 1=1`;
    const params = [];
    let paramIdx = 1;

    if (date_start && String(date_start).trim()) {
      query += ` AND rj.created_at >= $${paramIdx++}`;
      params.push(String(date_start).trim());
    }
    if (date_end && String(date_end).trim()) {
      query += ` AND rj.created_at <= $${paramIdx++}::date + interval '1 day'`;
      params.push(String(date_end).trim());
    }

    if (safeDeviceType) {
      if (safeDeviceType === 'pc') {
        query += ` AND (LOWER(dt.device_type_name) LIKE '%desktop%' OR LOWER(dt.device_type_name) LIKE '%pc%')`;
      } else if (safeDeviceType === 'laptop') {
        query += ` AND (LOWER(dt.device_type_name) LIKE '%notebook%' OR LOWER(dt.device_type_name) LIKE '%laptop%')`;
      } else if (safeDeviceType === 'printer') {
        query += ` AND (LOWER(dt.device_type_name) LIKE '%printer%' OR LOWER(dt.device_type_name) LIKE '%print%')`;
      }
    }

    query += ` GROUP BY ${groupBy}, ${labelFormat} ORDER BY ${groupBy}`;

    const { rows } = await pool.query(query, params);
    res.json({
      success: true,
      data: rows.map(r => ({ label: r.label, value: Math.round(parseFloat(r.value) || 0) }))
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
    const { date_start, date_end, device_type } = req.query;

    let query = `SELECT COALESCE(dt.device_type_name, 'ไม่ระบุ') AS device_type, COUNT(*) AS count
                 FROM repair_job rj
                 LEFT JOIN device d ON rj.device_id = d.device_id
                 LEFT JOIN device_types dt ON d.device_type_id = dt.device_type_id
                 WHERE 1=1`;
    const params = [];
    let paramIdx = 1;

    if (date_start) {
      query += ` AND rj.created_at >= $${paramIdx++}`;
      params.push(date_start);
    }
    if (date_end) {
      query += ` AND rj.created_at <= $${paramIdx++}::date + interval '1 day'`;
      params.push(date_end);
    }

    if (device_type && device_type !== 'all') {
      if (device_type === 'pc') {
        query += ` AND (LOWER(dt.device_type_name) LIKE '%desktop%' OR LOWER(dt.device_type_name) LIKE '%pc%')`;
      } else if (device_type === 'laptop') {
        query += ` AND (LOWER(dt.device_type_name) LIKE '%notebook%' OR LOWER(dt.device_type_name) LIKE '%laptop%')`;
      } else if (device_type === 'printer') {
        query += ` AND (LOWER(dt.device_type_name) LIKE '%printer%' OR LOWER(dt.device_type_name) LIKE '%print%')`;
      }
    }

    query += ` GROUP BY dt.device_type_name ORDER BY count DESC`;

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
