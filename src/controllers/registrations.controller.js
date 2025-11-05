const pool = require('../config/db');

/**
 * Handles the "guest" registration of a participant for a specific event.
 */
exports.registerForEvent = async (req, res) => {
  const { fullName, email, contactNumber, publicId } = req.body;

  if (!fullName || !email || !publicId) {
    return res.status(400).json({ ok: false, message: 'Full name, email, and event ID are required.' });
  }

  try {
    const eventResult = await pool.query('SELECT id FROM events WHERE public_id = $1', [publicId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Event not found.' });
    }
    const eventId = eventResult.rows[0].id;

    const registrationResult = await pool.query(
      `INSERT INTO registrations (event_id, full_name, email, contact_number) 
       VALUES ($1, $2, $3, $4)
       RETURNING ticket_id`,
      [eventId, fullName, email, contactNumber]
    );

    res.status(201).json({ 
      ok: true, 
      message: 'Registration successful!',
      ticketId: registrationResult.rows[0].ticket_id
    });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ ok: false, message: 'This email is already registered for this event.' });
    }
    console.error('Error during registration:', err.message);
    res.status(500).json({ ok: false, error: 'An unexpected error occurred.' });
  }
};

/**
 * Fetches all events and their corresponding registrations for the logged-in admin.
 */
exports.getAllRegistrationsData = async (req, res) => {
  const userId = req.user.id;

  try {
    const eventsQuery = pool.query(
      `SELECT id, title, start_datetime FROM events WHERE created_by = $1 ORDER BY start_datetime DESC`,
      [userId]
    );

    const registrationsQuery = pool.query(
      `SELECT r.id, r.event_id, r.full_name, r.email, r.contact_number, r.registered_at, r.status 
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE e.created_by = $1`,
      [userId]
    );

    const [eventsResult, registrationsResult] = await Promise.all([
      eventsQuery,
      registrationsQuery
    ]);

    res.status(200).json({
      ok: true,
      events: eventsResult.rows,
      registrations: registrationsResult.rows
    });

  } catch (err) {
    console.error('Error fetching registrations data:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch registrations data' });
  }
};

/**
 * ADD THIS FUNCTION
 * Deletes or cancels a specific registration.
 */
exports.deleteRegistration = async (req, res) => {
  try {
    // We should also verify that the registration belongs to an event created by the admin
    const deleted = await pool.query(
      `DELETE FROM registrations 
       WHERE id = $1 
       AND event_id IN (SELECT id FROM events WHERE created_by = $2)
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (deleted.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Registration not found or you are not authorized to delete it.' });
    }
    res.json({ ok: true, message: 'Registration cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling registration:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to cancel registration' });
  }
};
