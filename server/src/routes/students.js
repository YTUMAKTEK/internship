const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { serializeStudent } = require('../lib/serialize');

const router = express.Router();

const EDITABLE_FIELDS = ['name', 'phone', 'university', 'dept', 'year', 'experience'];

router.get('/me', requireAuth, (req, res) => {
  res.json({ student: serializeStudent(req.student) });
});

router.patch('/me', requireAuth, async (req, res) => {
  const updates = [];
  const values = [];
  let i = 1;

  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates.push(`${field} = $${i++}`);
      values.push(req.body[field]);
    }
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'tags')) {
    updates.push(`tags = $${i++}`);
    values.push(JSON.stringify(req.body.tags || []));
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'sektorler')) {
    updates.push(`sektorler = $${i++}`);
    values.push(JSON.stringify(req.body.sektorler || []));
  }

  if (updates.length === 0) {
    return res.json({ student: serializeStudent(req.student) });
  }

  updates.push('updated_at = now()');
  values.push(req.student.id);

  const { rows } = await query(
    `UPDATE students SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );

  res.json({ student: serializeStudent(rows[0]) });
});

module.exports = router;
