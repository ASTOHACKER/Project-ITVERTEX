const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  max: 20,                          // จำนวน connection สูงสุดใน pool
  idleTimeoutMillis: 30000,         // ปิด connection ที่ไม่ได้ใช้งานเกิน 30 วิ
  connectionTimeoutMillis: 5000,    // timeout หากต่อฐานข้อมูลไม่ได้เกิน 5 วิ
});

// ทดสอบ connection เมื่อ startup
pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool errors:', err.message);
});

module.exports = pool;
