const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  // Expect: Authorization: Bearer <token>
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) {
    return res.status(401).json({ ok: false, message: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded has: { id, email, role, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, message: 'Unauthenticated' });
    if (req.user.role !== role) {
      return res.status(403).json({ ok: false, message: 'Forbidden: requires ' + role });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
