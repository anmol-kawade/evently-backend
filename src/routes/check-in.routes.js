const { Router } = require('express');
const { getCheckInData, processCheckIn } = require('../controllers/check-in.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// Route to get all data needed for the check-in page
router.get('/', requireAuth, getCheckInData);

// Route to process a QR code scan and check in an attendee
router.post('/', requireAuth, processCheckIn);

module.exports = router;
