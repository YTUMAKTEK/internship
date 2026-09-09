const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const CV_DIR = path.join(__dirname, '..', '..', 'uploads', 'cvs');
fs.mkdirSync(CV_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CV_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.pdf`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('ONLY_PDF_ALLOWED'));
  }
  cb(null, true);
}

const uploadCv = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { uploadCv, CV_DIR };
