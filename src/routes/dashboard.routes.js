const { Router } = require('express');
const { getDashboardData } = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// This route is protected and will fetch all data for the dashboard
router.get('/', requireAuth, getDashboardData);

module.exports = router;
