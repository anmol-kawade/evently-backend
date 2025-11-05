// test.js
const pool = require('./db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('PostgreSQL connected! Current time:', res.rows[0]);
  }
  pool.end();
});
