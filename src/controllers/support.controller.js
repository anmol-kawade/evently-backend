const nodemailer = require('nodemailer');

/**
 * Creates an email transporter using credentials from environment variables.
 * For production, consider a more robust service like SendGrid.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Handles the submission of a support ticket.
 * It takes the ticket details and emails them to the developer.
 */
exports.submitSupportTicket = async (req, res) => {
  const { subject, message } = req.body;
  // The user's details are attached to the request by the requireAuth middleware
  const user = req.user;

  if (!subject || !message) {
    return res.status(400).json({ ok: false, message: 'Subject and message are required.' });
  }

  // Email options
  const mailOptions = {
    from: `"${user.name}" <${process.env.EMAIL_USER}>`, // Sender address (shows user's name)
    to: process.env.DEVELOPER_EMAIL, // Receiver (your developer email)
    subject: `Support Ticket: ${subject}`, // Subject line
    html: `
      <h3>New Support Ticket Received</h3>
      <p><strong>From:</strong> ${user.name} (${user.email})</p>
      <p><strong>User ID:</strong> ${user.id}</p>
      <hr>
      <h4>Message:</h4>
      <p>${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ ok: true, message: 'Support ticket submitted successfully!' });
  } catch (err) {
    console.error('Error sending support email:', err);
    res.status(500).json({ ok: false, error: 'Failed to send support ticket.' });
  }
};
