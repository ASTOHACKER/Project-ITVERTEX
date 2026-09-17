require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const role = require('./middleware/role');
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Middleware Chain
// ============================================================

// 1. Helmet — Security headers (อนุญาตให้โหลดภาพ/ลายเซ็นข้าม origin ได้)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. CORS — Allow cross-origin
app.use(cors());

// 3. Morgan — HTTP request logging
app.use(morgan('dev'));

// 4. Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 5. Rate Limiter — ป้องกัน brute force / DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 2000,                 // ปรับให้รองรับการพัฒนาและการ Polling แบบ Real-time
  message: {
    success: false,
    message: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง',
  },
});
app.use('/api/', limiter);

// 6. Static files — สำหรับ uploaded files และ public assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/pubilc', express.static(path.join(__dirname, 'pubilc')));
app.use('/public', express.static(path.join(__dirname, 'pubilc')));

// ============================================================
// Swagger API Documentation
// ============================================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'IT VERTEX API Docs',
}));

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', require('./routes/auth.routes'));

// Middleware สำหรับตรวจสอบ Token


app.use('/api/repairs', authMiddleware, require('./routes/repair.routes'));
app.use('/api/devices', authMiddleware, require('./routes/device.routes'));
app.use('/api/quotations', authMiddleware, require('./routes/quotation.routes'));
app.use('/api/items', authMiddleware, require('./routes/item.routes'));
app.use('/api/staff', authMiddleware, require('./routes/staff.routes'));
app.use('/api/dashboard', authMiddleware, require('./routes/dashboard.routes'));
app.use('/api/slips', authMiddleware, require('./routes/slip.routes'));
app.use('/api/payments', authMiddleware, require('./routes/payment.routes'));
app.use('/api/lookup', authMiddleware, require('./routes/lookup.routes'));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'IT VERTEX API is running',
    docs: '/api-docs',
  });
});

// ============================================================
// 7. Central Error Handler (ต้องอยู่หลัง routes ทั้งหมด)
// ============================================================
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   IT VERTEX API Server                   ║
  ║   Running on: http://localhost:${PORT}       ║
  ║   Swagger:    http://localhost:${PORT}/api-docs ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
