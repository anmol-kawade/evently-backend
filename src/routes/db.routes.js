const { Router } = require('express');
const router = Router();
const pool = require('../config/db');

router.get('/ping', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({ ok: true, time: result.rows[0].time });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
