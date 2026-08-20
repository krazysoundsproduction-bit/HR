CREATE TABLE job_postings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  posted_by TEXT NOT NULL,
  closing_date DATE NOT NULL,
  salary NUMERIC NOT NULL
);

CREATE TABLE applicants (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  cover_letter TEXT,
  status TEXT NOT NULL,
  applied_at TIMESTAMP NOT NULL,
  notes TEXT,
  FOREIGN KEY (job_id) REFERENCES job_postings(id)
);

CREATE TABLE interviews (
  id TEXT PRIMARY KEY,
  applicant_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  interviewers TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  feedback TEXT,
  rating INTEGER,
  recommend_hire BOOLEAN,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id),
  FOREIGN KEY (job_id) REFERENCES job_postings(id)
);

CREATE TABLE offer_letters (
  id TEXT PRIMARY KEY,
  applicant_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  salary NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TIMESTAMP,
  responded_at TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id),
  FOREIGN KEY (job_id) REFERENCES job_postings(id)
);

CREATE TABLE recruitment_audits (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  payload TEXT NOT NULL
);
