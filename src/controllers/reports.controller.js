const pool = require('../config/db');

/**
 * Generates a detailed performance report for a single, completed event.
 */
exports.getEventReport = async (req, res) => {
  const { eventId } = req.params;
  const adminUserId = req.user.id; // From requireAuth middleware

  try {
    // This complex query calculates all stats in one go for efficiency.
    // It uses Common Table Expressions (CTEs) to break down the logic.
    const reportQuery = `
      WITH EventRegistrations AS (
        SELECT
          id,
          status
        FROM registrations
        WHERE event_id = $1
      ),
      CheckedIn AS (
        SELECT COUNT(*) as count FROM EventRegistrations WHERE status = 'Checked In'
      ),
      TotalReg AS (
        SELECT COUNT(*) as count FROM EventRegistrations
      )
      SELECT
        (SELECT count FROM CheckedIn) AS checked_in_count,
        (SELECT count FROM TotalReg) AS total_registrations_count
    `;

    const result = await pool.query(reportQuery, [eventId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Could not generate report for this event.' });
    }

    const data = result.rows[0];
    const totalRegistrations = parseInt(data.total_registrations_count, 10);
    const checkedInCount = parseInt(data.checked_in_count, 10);
    const attendancePercentage = totalRegistrations > 0 ? (checkedInCount / totalRegistrations) * 100 : 0;

    // Construct the final report object
    const reportData = {
      totalRegistrations: totalRegistrations,
      checkedInCount: checkedInCount,
      attendancePercentage: attendancePercentage,
      // Placeholders for more complex data like revenue or demographics
      totalRevenue: 0, 
      ticketSales: [],
      demographics: []
    };

    res.status(200).json({ ok: true, report: reportData });

  } catch (err) {
    console.error('Error generating event report:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to generate report.' });
  }
};
