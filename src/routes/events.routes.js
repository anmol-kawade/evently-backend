const { Router } = require('express');
const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, duplicateEvent } = require('../controllers/events.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// Routes for creating and getting all events
router.post('/', requireAuth, createEvent);
router.get('/', requireAuth, getAllEvents);

// Routes for a single event (get, update, delete)
router.get('/:id', requireAuth, getEventById);
router.put('/:id', requireAuth, updateEvent);
router.delete('/:id', requireAuth, deleteEvent);

// Route for duplicating an event
router.post('/:id/duplicate', requireAuth, duplicateEvent);

module.exports = router;
