const pool = require('../config/db');

/**
 * Creates a new event. (Your existing function)
 */
exports.createEvent = async (req, res) => {
  const { title, description, category, organizer_name, organizer_email, venue, capacity, registration_deadline, qr_checkin_enabled, start_datetime, end_datetime } = req.body;
  const created_by = req.user.id;
  try {
    const newEvent = await pool.query(
      `INSERT INTO events (created_by, title, description, category, organizer_name, organizer_email, venue, capacity, registration_deadline, qr_checkin_enabled, start_datetime, end_datetime)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING public_id`,
      [created_by, title, description, category, organizer_name, organizer_email, venue, capacity, registration_deadline, qr_checkin_enabled, start_datetime, end_datetime]
    );
    res.status(201).json({ ok: true, message: 'Event created successfully!', event: newEvent.rows[0] });
  } catch (err) {
    console.error('Error creating event:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to create event' });
  }
};

/**
 * UPDATED: Fetches all events for the logged-in user, including a live count of registrations for each.
 */
exports.getAllEvents = async (req, res) => {
  try {
    const query = `
      SELECT e.*, COUNT(r.id)::int AS registration_count
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE e.created_by = $1
      GROUP BY e.id
      ORDER BY e.start_datetime DESC
    `;
    const allEvents = await pool.query(query, [req.user.id]);
    res.status(200).json({ ok: true, events: allEvents.rows });
  } catch (err) {
    console.error('Error fetching events:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch events' });
  }
};

/**
 * NEW: Fetches a single event by its ID for the edit form.
 */
exports.getEventById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND created_by = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Event not found' });
    }
    res.status(200).json({ ok: true, event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch event' });
  }
};

/**
 * NEW: Updates an existing event.
 */
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, category, organizer_name, organizer_email, venue, capacity, registration_deadline, qr_checkin_enabled, start_datetime, end_datetime } = req.body;
  try {
    const result = await pool.query(
      `UPDATE events SET 
        title = $1, description = $2, category = $3, organizer_name = $4, organizer_email = $5, 
        venue = $6, capacity = $7, registration_deadline = $8, qr_checkin_enabled = $9, 
        start_datetime = $10, end_datetime = $11, updated_at = NOW()
       WHERE id = $12 AND created_by = $13 RETURNING *`,
      [title, description, category, organizer_name, organizer_email, venue, capacity, registration_deadline, qr_checkin_enabled, start_datetime, end_datetime, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Event not found or you are not authorized to edit it.' });
    }
    res.status(200).json({ ok: true, message: 'Event updated successfully!', event: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to update event' });
  }
};

/**
 * NEW: Deletes an event.
 */
exports.deleteEvent = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 AND created_by = $2',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: 'Event not found or you are not authorized to delete it.' });
    }
    res.status(200).json({ ok: true, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to delete event' });
  }
};

/**
 * NEW: Duplicates an event.
 */
exports.duplicateEvent = async (req, res) => {
  try {
    const originalEventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND created_by = $2',
      [req.params.id, req.user.id]
    );
    if (originalEventResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Event not found.' });
    }
    const event = originalEventResult.rows[0];
    const newTitle = `Copy of ${event.title}`;

    const newEventResult = await pool.query(
      `INSERT INTO events (created_by, title, description, category, organizer_name, organizer_email, venue, capacity, registration_deadline, qr_checkin_enabled, start_datetime, end_datetime)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.user.id, newTitle, event.description, event.category, event.organizer_name, event.organizer_email, event.venue, event.capacity, event.registration_deadline, event.qr_checkin_enabled, event.start_datetime, event.end_datetime]
    );
    res.status(201).json({ ok: true, message: 'Event duplicated successfully!', event: newEventResult.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to duplicate event' });
  }

  /**
 * UPDATED: Fetches a single event by its ID, and also fetches all of its registrations.
 */
  exports.getEventById = async (req, res) => {
    const eventId = req.params.id;
    const adminUserId = req.user.id;

    try {
      // Query 1: Get the event details, ensuring it belongs to the logged-in user
      const eventQuery = pool.query(
        'SELECT * FROM events WHERE id = $1 AND created_by = $2',
        [eventId, adminUserId]
      );

      // Query 2: Get all registrations for that event
      const registrationsQuery = pool.query(
        'SELECT * FROM registrations WHERE event_id = $1 ORDER BY registered_at DESC',
        [eventId]
      );

      // Run both queries in parallel for efficiency
      const [eventResult, registrationsResult] = await Promise.all([
        eventQuery,
        registrationsQuery
      ]);

      if (eventResult.rows.length === 0) {
        return res.status(404).json({ ok: false, message: 'Event not found or you are not authorized to view it.' });
      }

      const eventData = eventResult.rows[0];
      // This line is the crucial fix: it attaches the list of registrations to the event object
      eventData.registrations = registrationsResult.rows; 

      res.status(200).json({ ok: true, event: eventData });
    } catch (err) {
      console.error('Error fetching event details:', err.message);
      res.status(500).json({ ok: false, error: 'Failed to fetch event details' });
    }
  };
};
