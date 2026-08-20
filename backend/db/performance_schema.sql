CREATE TABLE review_cycles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  review_year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  status TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by TEXT NOT NULL
);

CREATE TABLE performance_reviews (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  overall_rating INTEGER,
  strengths TEXT,
  improvements TEXT,
  comments TEXT,
  submitted_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  FOREIGN KEY (cycle_id) REFERENCES review_cycles(id)
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL,
  progress NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  created_by TEXT NOT NULL
);

CREATE TABLE feedback_entries (
  id TEXT PRIMARY KEY,
  from_employee_id TEXT NOT NULL,
  to_employee_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE development_plans (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  review_id TEXT NOT NULL,
  skills TEXT NOT NULL,
  actions TEXT NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (review_id) REFERENCES performance_reviews(id)
);

CREATE TABLE performance_audits (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  payload TEXT NOT NULL
);
