const pool = require('../config/db');

// A default set of settings for new users.
const defaultSettings = {
  eventDefaults: {
    defaultCapacity: 100,
    defaultTicketPrice: 0,
    defaultCurrency: 'INR'
  },
  registrationSettings: {
    enableCustomQuestions: true,
    collectPhoneNumber: false,
    sendConfirmationEmail: true
  },
  emailTemplates: {
    confirmationSubject: 'Your registration is confirmed!',
    confirmationBody: 'Hi {attendeeName},\n\nThank you for registering for {eventName}.\n\nWe look forward to seeing you there!',
    reminderSubject: 'Reminder for your event',
    reminderBody: 'Hi {attendeeName},\n\nThis is a reminder that {eventName} is happening soon.'
  }
};

/**
 * Fetches the settings for the currently logged-in user.
 * If no settings exist, it returns the default settings.
 */
exports.getSettings = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query('SELECT settings FROM user_settings WHERE user_id = $1', [userId]);
    if (result.rows.length > 0) {
      // If settings are found, return them
      res.status(200).json({ ok: true, settings: result.rows[0].settings });
    } else {
      // If no settings are found, return the defaults
      res.status(200).json({ ok: true, settings: defaultSettings });
    }
  } catch (err) {
    console.error('Error fetching settings:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to fetch settings' });
  }
};

/**
 * Creates or updates the settings for the currently logged-in user.
 * This is an "UPSERT" operation.
 */
exports.updateSettings = async (req, res) => {
  const userId = req.user.id;
  const { settings } = req.body;

  if (!settings) {
    return res.status(400).json({ ok: false, message: 'Settings data is required.' });
  }

  try {
    const upsertQuery = `
      INSERT INTO user_settings (user_id, settings)
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()
      RETURNING settings;
    `;
    const result = await pool.query(upsertQuery, [userId, settings]);
    res.status(200).json({ ok: true, message: 'Settings saved successfully!', settings: result.rows[0].settings });
  } catch (err) {
    console.error('Error saving settings:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to save settings' });
  }
};
