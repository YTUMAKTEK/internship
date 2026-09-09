const { verifyAuthToken } = require('../lib/tokens');
const { query } = require('../db');

async function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'NOT_AUTHENTICATED' });

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    return res.status(401).json({ error: 'NOT_AUTHENTICATED' });
  }

  const { rows } = await query('SELECT * FROM students WHERE id = $1', [payload.sub]);
  const student = rows[0];
  if (!student) return res.status(401).json({ error: 'NOT_AUTHENTICATED' });

  req.student = student;
  next();
}

module.exports = { requireAuth };
