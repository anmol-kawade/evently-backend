const { Router } = require('express');
const { getEventReport } = require('../controllers/reports.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// This route will be protected and will generate a report for a specific event ID.
router.get('/:eventId', requireAuth, getEventReport);

module.exports = router;
