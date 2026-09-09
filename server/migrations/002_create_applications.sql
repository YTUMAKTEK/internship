CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  internship_id text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, internship_id)
);
