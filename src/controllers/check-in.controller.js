const pool = require('../config/db');

/**
 * Fetches events and their registrations for the check-in page.
 */
exports.getCheckInData = async (req, res) => {
  const userId = req.user.id; // From requireAuth middleware

  try {
    // UPDATED QUERY: Selects 'end_datetime' and filters for events that have not ended yet.
    const eventsQuery = pool.query(
      `SELECT id, title, start_datetime, end_datetime FROM events 
       WHERE created_by = $1 AND end_datetime > NOW() - INTERVAL '1 day' -- Only get recent/future events
       ORDER BY start_datetime ASC`,
      [userId]
    );

    const registrationsQuery = pool.query(
      `SELECT r.id, r.event_id, r.full_name, r.email, r.status, r.ticket_id
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
      attendees: registrationsResult.rows
    });

  } catch (err) {
    console.error('Error fetching check-in data:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch check-in data' });
  }
};

/**
 * Processes a check-in by validating a ticket ID.
 */
exports.processCheckIn = async (req, res) => {
  const { ticketId } = req.body;
  const adminUserId = req.user.id;

  if (!ticketId) {
    return res.status(400).json({ ok: false, message: 'Ticket ID is required.' });
  }

  try {
    const result = await pool.query(
      `UPDATE registrations r
       SET status = 'Checked In'
       FROM events e
       WHERE r.event_id = e.id
         AND r.ticket_id = $1
         AND e.created_by = $2
       RETURNING r.id, r.full_name, r.email, r.status`,
      [ticketId, adminUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Invalid or unauthorized ticket ID.' });
    }

    res.status(200).json({
      ok: true,
      message: 'Check-in successful!',
      attendee: result.rows[0]
    });

  } catch (err) {
    console.error('Error processing check-in:', err.message);
    res.status(500).json({ ok: false, error: 'An unexpected error occurred during check-in.' });
  }
};
