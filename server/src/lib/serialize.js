function serializeStudent(student) {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    phone: student.phone,
    university: student.university,
    dept: student.dept,
    year: student.year,
    tags: student.tags,
    sektorler: student.sektorler,
    experience: student.experience,
    cvName: student.cv_original_name,
    emailVerified: student.email_verified,
  };
}

module.exports = { serializeStudent };
