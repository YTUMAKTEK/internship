const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');
const { runMigrations } = require('./runMigrations');

const authRoutes = require('./routes/auth');
const studentsRoutes = require('./routes/students');
const applicationsRoutes = require('./routes/applications');
const companyRoutes = require('./routes/company');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/company', companyRoutes);

// Same-origin static frontend - avoids CORS/cross-site-cookie issues entirely.
const SITE_ROOT = path.join(__dirname, '..', '..');
app.use(express.static(SITE_ROOT, { index: 'index.html' }));

// Generic error handler (e.g. multer file-type/size rejections).
app.use((err, req, res, next) => {
  if (err && err.message === 'ONLY_PDF_ALLOWED') {
    return res.status(400).json({ error: 'ONLY_PDF_ALLOWED' });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'FILE_TOO_LARGE' });
  }
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR' });
});

async function start() {
  await runMigrations();
  app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
