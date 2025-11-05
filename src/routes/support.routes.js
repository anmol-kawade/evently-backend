const { Router } = require('express');
const { submitSupportTicket } = require('../controllers/support.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// A protected route to POST a new support ticket.
// Only logged-in users can access this.
router.post('/', requireAuth, submitSupportTicket);

module.exports = router;
