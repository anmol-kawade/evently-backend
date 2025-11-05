const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');

// Import all necessary functions from the registrations controller
const { 
  getAllRegistrationsData, 
  deleteRegistration 
} = require('../controllers/registrations.controller');

const router = Router();

/**
 * This route handles GET requests to /api/registrations/
 * It's protected and fetches all data for the admin's "Registrations" page.
 */
router.get('/', requireAuth, getAllRegistrationsData);

/**
 * This route handles DELETE requests to /api/registrations/:id
 * It's protected and allows an admin to cancel a specific registration.
 */
router.delete('/:id', requireAuth, deleteRegistration);

module.exports = router;
