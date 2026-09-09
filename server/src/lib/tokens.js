const jwt = require('jsonwebtoken');
const config = require('../config');

const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const EMAIL_TOKEN_TTL = '1d';

function signAuthToken(student) {
  return jwt.sign({ sub: student.id }, config.jwtSecret, { expiresIn: '7d' });
}

function verifyAuthToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function signEmailToken(studentId, email) {
  return jwt.sign({ sub: studentId, email, purpose: 'verify-email' }, config.emailTokenSecret, {
    expiresIn: EMAIL_TOKEN_TTL,
  });
}

function verifyEmailToken(token) {
  const payload = jwt.verify(token, config.emailTokenSecret);
  if (payload.purpose !== 'verify-email') throw new Error('Invalid token purpose');
  return payload;
}

module.exports = {
  AUTH_COOKIE_MAX_AGE_MS,
  signAuthToken,
  verifyAuthToken,
  signEmailToken,
  verifyEmailToken,
};
