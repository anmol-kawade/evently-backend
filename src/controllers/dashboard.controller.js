const pool = require('../config/db');

/**
 * Gathers all necessary data for the admin dashboard in a single query.
 */
exports.getDashboardData = async (req, res) => {
  const userId = req.user.id; // From requireAuth middleware

  try {
    // --- (Queries for KPIs and Recent Registrations remain the same) ---
    const upcomingEventsCountQuery = pool.query(
      `SELECT COUNT(*) FROM events WHERE created_by = $1 AND start_datetime > NOW()`,
      [userId]
    );
    const registrationsTodayCountQuery = pool.query(
      `SELECT COUNT(*) FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE e.created_by = $1 AND r.registered_at::date = CURRENT_DATE`,
      [userId]
    );
    const totalRegistrationsCountQuery = pool.query(
      `SELECT COUNT(*) FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE e.created_by = $1`,
      [userId]
    );
    const recentRegistrationsListQuery = pool.query(
      `SELECT r.full_name, e.title AS event_title, r.registered_at FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE e.created_by = $1
       ORDER BY r.registered_at DESC LIMIT 5`,
      [userId]
    );

    // --- UPDATED QUERY for Upcoming Events List ---
    const upcomingEventsListQuery = pool.query(
      `SELECT e.id, e.title, e.start_datetime, e.capacity, COUNT(r.id)::int AS registration_count
       FROM events e
       LEFT JOIN registrations r ON e.id = r.event_id
       WHERE e.created_by = $1 AND e.start_datetime > NOW()
       GROUP BY e.id
       ORDER BY e.start_datetime ASC 
       LIMIT 5`,
      [userId]
    );

    // Execute all queries in parallel
    const [
      upcomingEventsCountResult,
      registrationsTodayCountResult,
      totalRegistrationsCountResult,
      upcomingEventsListResult,
      recentRegistrationsListResult
    ] = await Promise.all([
      upcomingEventsCountQuery,
      registrationsTodayCountQuery,
      totalRegistrationsCountQuery,
      upcomingEventsListQuery,
      recentRegistrationsListQuery
    ]);

    // Construct the response object
    const dashboardData = {
      kpiStats: {
        upcomingEvents: parseInt(upcomingEventsCountResult.rows[0].count, 10),
        registrationsToday: parseInt(registrationsTodayCountResult.rows[0].count, 10),
        totalRegistrations: parseInt(totalRegistrationsCountResult.rows[0].count, 10),
      },
      upcomingEvents: upcomingEventsListResult.rows,
      recentRegistrations: recentRegistrationsListResult.rows,
      registrationTrends: [] // Placeholder
    };

    res.status(200).json({ ok: true, data: dashboardData });

  } catch (err) {
    console.error('Error fetching dashboard data:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch dashboard data' });
  }
};
