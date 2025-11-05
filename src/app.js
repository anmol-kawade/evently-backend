const express = require('express');
const cors = require('cors');

// --- 1. Import all your route files together ---
const healthRouter = require('./routes/health.routes');
const dbRouter = require('./routes/db.routes');
const authRouter = require('./routes/auth.routes');
const eventsRouter = require('./routes/events.routes');
const registrationsRouter = require('./routes/registrations.routes');
const publicRouter = require('./routes/public.routes');
const dashboardRouter = require('./routes/dashboard.routes');
const checkInRouter = require('./routes/check-in.routes');
const reportsRouter = require('./routes/reports.routes');
const settingsRouter = require('./routes/settings.routes');
const supportRouter = require('./routes/support.routes');

const app = express();

// --- 2. Core Middlewares ---
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 3. API Routes (with consistent '/api' prefix) ---
app.use('/api/support', supportRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/check-in', checkInRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/public', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/registrations', registrationsRouter);

// --- Non-API / Utility Routes ---
app.use('/health', healthRouter);
app.use('/db', dbRouter);

// --- Root Ping Route ---
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Event Management API – backend is up!' });
});

// --- 4. Error Handlers (must be at the end) ---
app.use((req, res, next) => {
  res.status(404).json({ ok: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    ok: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
console.log('✅ Express app initialized successfully.');
