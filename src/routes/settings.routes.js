const { Router } = require('express');
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// A protected route to GET the current user's settings
router.get('/', requireAuth, getSettings);

// A protected route to POST (create or update) the user's settings
router.post('/', requireAuth, updateSettings);

module.exports = router;
