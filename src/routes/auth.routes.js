const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = Router();

// ✅ Signup route
router.post('/signup', async (req, res) => {
  // 1. Expect 'password' from the client, not 'password_hash'
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ ok: false, message: 'Email already registered' });
    }

    // 2. Hash the plain-text 'password'
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      // 3. Use the correct 'hashedPassword' variable
      [name, email, hashedPassword, role || 'admin']
    );

    res.status(201).json({ ok: true, user: newUser.rows[0] });
  } catch (err) {
    console.error(err); // Log the actual error on the server
    res.status(500).json({ ok: false, error: 'An unexpected error occurred' });
  }
});

// ✅ Login route
router.post('/login', async (req, res) => {
  // 1. Expect 'password' from the client
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      // Generic error message for security
      return res.status(400).json({ ok: false, message: 'Invalid email or password' });
    }

    // 2. Compare the plain-text 'password' with the stored hash
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ ok: false, message: 'Invalid email or password' });
    }

    // 3. CORRECTED: Added the user's name to the token payload
    const token = jwt.sign(
      { 
        id: user.rows[0].id, 
        email: user.rows[0].email, 
        role: user.rows[0].role,
        name: user.rows[0].name // <-- This line is the fix
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ ok: true, token });
  } catch (err) {
    console.error(err); // Log the actual error on the server
    res.status(500).json({ ok: false, error: 'An unexpected error occurred' });
  }
});

module.exports = router;
