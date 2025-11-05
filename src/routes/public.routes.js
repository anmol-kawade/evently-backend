const { Router } = require('express');
const pool = require('../config/db');
const { registerForEvent } = require('../controllers/registrations.controller');

const router = Router();

/**
 * Public route to get event details for the registration page.
 * It finds an event by its unique public_id.
 * This route does not have any authentication middleware.
 */
router.get('/events/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;

    // Select only the necessary public-facing event details
    const event = await pool.query(
      `SELECT title, description, venue, start_datetime, end_datetime, organizer_name 
       FROM events 
       WHERE public_id = $1`,
      [publicId]
    );

    if (event.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Event not found' });
    }

    res.status(200).json({ ok: true, event: event.rows[0] });

  } catch (err) {
    console.error('Error fetching public event:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch event details' });
  }
});

/**
 * Public route to handle the submission of the event registration form.
 */
router.post('/register', registerForEvent);

/**
 * Public route to get all necessary details for a ticket page.
 * Fetches registration and event info using the unique ticket_id.
 */
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const result = await pool.query(
      `SELECT 
         r.full_name, r.email,
         e.title AS event_title, e.venue, e.start_datetime
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.ticket_id = $1`,
      [ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Ticket not found.' });
    }

    res.status(200).json({ ok: true, ticket: result.rows[0] });

  } catch (err) {
    console.error('Error fetching ticket data:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch ticket data.' });
  }
});

module.exports = router;
