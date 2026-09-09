const express = require('express');
const path = require('path');
const { query } = require('../db');
const { hashPassword, comparePassword } = require('../lib/password');
const { signAuthToken, verifyAuthToken, signEmailToken, verifyEmailToken, AUTH_COOKIE_MAX_AGE_MS } = require('../lib/tokens');
const { sendVerificationEmail } = require('../lib/email');
const { serializeStudent } = require('../lib/serialize');
const { uploadCv } = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');
const { signupLimiter, loginLimiter } = require('../middleware/rateLimit');
const config = require('../config');

const router = express.Router();

const AUTH_COOKIE = 'auth_token';
const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
};

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

router.post('/signup', signupLimiter, uploadCv.single('cv'), async (req, res) => {
  const { name, email, password, phone, university, dept, year, experience } = req.body;
  const tags = parseJsonArray(req.body.tags);
  const sektorler = parseJsonArray(req.body.sektorler);

  if (!name || !email || !password || !university || !dept || !year) {
    return res.status(400).json({ error: 'MISSING_FIELDS' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'WEAK_PASSWORD' });
  }
  if (tags.length === 0) {
    return res.status(400).json({ error: 'NO_TAGS' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'NO_CV' });
  }

  const existing = await query('SELECT id FROM students WHERE lower(email) = lower($1)', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'EMAIL_TAKEN' });
  }

  const passwordHash = await hashPassword(password);
  const cvRelativePath = path.join('cvs', req.file.filename);

  let student;
  try {
    const result = await query(
      `INSERT INTO students
        (email, password_hash, name, phone, university, dept, year, tags, sektorler, experience, cv_path, cv_original_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        email,
        passwordHash,
        name,
        phone || null,
        university,
        dept,
        year,
        JSON.stringify(tags),
        JSON.stringify(sektorler),
        experience || null,
        cvRelativePath,
        req.file.originalname,
      ]
    );
    student = result.rows[0];
  } catch (err) {
    if (err.code === '23505') { // unique_violation - race condition on concurrent signup
      return res.status(409).json({ error: 'EMAIL_TAKEN' });
    }
    throw err;
  }

  const emailToken = signEmailToken(student.id, student.email);
  await sendVerificationEmail(student.email, emailToken);

  res.status(201).json({ message: 'CHECK_YOUR_EMAIL' });
});

router.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Eksik doğrulama linki.');

  let payload;
  try {
    payload = verifyEmailToken(token);
  } catch {
    return res.status(400).send('Doğrulama linkinin süresi dolmuş veya geçersiz.');
  }

  await query('UPDATE students SET email_verified = true, updated_at = now() WHERE id = $1', [payload.sub]);

  res.redirect('/?verified=1');
});

router.post('/resend-verification', signupLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'MISSING_EMAIL' });

  const { rows } = await query('SELECT * FROM students WHERE lower(email) = lower($1)', [email]);
  const student = rows[0];

  // Always return the same generic response so this endpoint can't be used to
  // find out which emails are registered.
  if (student && !student.email_verified) {
    const emailToken = signEmailToken(student.id, student.email);
    await sendVerificationEmail(student.email, emailToken);
  }

  res.json({ message: 'IF_ACCOUNT_EXISTS_EMAIL_SENT' });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'MISSING_FIELDS' });

  const { rows } = await query('SELECT * FROM students WHERE lower(email) = lower($1)', [email]);
  const student = rows[0];
  if (!student) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const passwordOk = await comparePassword(password, student.password_hash);
  if (!passwordOk) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  if (!student.email_verified) {
    return res.status(403).json({ error: 'UNVERIFIED' });
  }

  const token = signAuthToken(student);
  res.cookie(AUTH_COOKIE, token, cookieOptions);
  res.json({ student: serializeStudent(student) });
});

router.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ student: serializeStudent(req.student) });
});

module.exports = router;
