CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  phone text,
  university text NOT NULL,
  dept text NOT NULL,
  year text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]',
  sektorler jsonb NOT NULL DEFAULT '[]',
  experience text,
  cv_path text,
  cv_original_name text,
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The actual duplicate-account fix: one row per email, case-insensitive, at the DB layer.
CREATE UNIQUE INDEX students_email_lower_idx ON students (lower(email));
