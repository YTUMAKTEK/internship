const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { internshipId } = req.body;
  if (!internshipId) return res.status(400).json({ error: 'MISSING_INTERNSHIP_ID' });

  await query(
    `INSERT INTO applications (student_id, internship_id)
     VALUES ($1, $2)
     ON CONFLICT (student_id, internship_id) DO NOTHING`,
    [req.student.id, internshipId]
  );

  const { rows } = await query('SELECT internship_id FROM applications WHERE student_id = $1', [req.student.id]);
  res.json({ appliedTo: rows.map((r) => r.internship_id) });
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query('SELECT internship_id FROM applications WHERE student_id = $1', [req.student.id]);
  res.json({ appliedTo: rows.map((r) => r.internship_id) });
});

module.exports = router;
