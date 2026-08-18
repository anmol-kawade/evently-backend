require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./db');
const appRoutes = require('./app'); // your existing API routes in app.js

const app = express();

// --- Core Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api', appRoutes); // all your existing routes from app.js
// Example: /api/auth, /api/events, etc.

// --- Serve Angular Frontend ---
app.use(express.static(path.join(__dirname, '../event-management/dist/event-management/browser/event-management')));

// Fallback route: send index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../event-management/dist/event-management/browser/index.html'));
});

// --- Test route (optional) ---
// You can remove this if you want
app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// --- Start server ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
