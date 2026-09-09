// NOTE: intentionally unauthenticated, matching the app's pre-existing behavior
// (there was never an employer login). See plan doc "Bilinen açık" section -
// this is flagged as a follow-up, not fixed here, since the task in scope was
// preventing duplicate STUDENT accounts, not adding employer auth.
const express = require('express');
const path = require('path');
const { query } = require('../db');
const { CV_DIR } = require('../middleware/upload');

const router = express.Router();

router.get('/applicants', async (req, res) => {
  const { rows: students } = await query('SELECT * FROM students WHERE email_verified = true ORDER BY created_at DESC');
  const { rows: applications } = await query('SELECT student_id, internship_id FROM applications');

  const appliedByStudent = new Map();
  for (const app of applications) {
    if (!appliedByStudent.has(app.student_id)) appliedByStudent.set(app.student_id, []);
    appliedByStudent.get(app.student_id).push(app.internship_id);
  }

  res.json({
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      university: s.university,
      dept: s.dept,
      year: s.year,
      tags: s.tags,
      sektorler: s.sektorler,
      experience: s.experience,
      cvName: s.cv_original_name,
      appliedTo: appliedByStudent.get(s.id) || [],
    })),
  });
});

router.get('/cv/:studentId', async (req, res) => {
  const { rows } = await query('SELECT cv_path, cv_original_name FROM students WHERE id = $1', [req.params.studentId]);
  const student = rows[0];
  if (!student || !student.cv_path) return res.status(404).json({ error: 'NOT_FOUND' });

  const filePath = path.join(CV_DIR, path.basename(student.cv_path));
  res.download(filePath, student.cv_original_name || 'cv.pdf');
});

module.exports = router;
