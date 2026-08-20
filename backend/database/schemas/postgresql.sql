CREATE TABLE employees (
  id UUID PRIMARY KEY,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  job_title VARCHAR(150) NOT NULL,
  status VARCHAR(50) NOT NULL,
  hired_at TIMESTAMP NOT NULL
);

CREATE TABLE employee_documents (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees (id),
  document_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMP NOT NULL
);

CREATE TABLE job_postings (
  id UUID PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  posted_at TIMESTAMP NOT NULL
);

CREATE TABLE applicants (
  id UUID PRIMARY KEY,
  job_posting_id UUID NOT NULL REFERENCES job_postings (id),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  stage VARCHAR(50) NOT NULL
);

CREATE TABLE interviews (
  id UUID PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES applicants (id),
  scheduled_at TIMESTAMP NOT NULL,
  interviewer VARCHAR(150) NOT NULL,
  outcome VARCHAR(100)
);

CREATE TABLE salary_records (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees (id),
  base_salary NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  effective_from DATE NOT NULL
);

CREATE TABLE payroll_runs (
  id UUID PRIMARY KEY,
  payroll_period VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  processed_at TIMESTAMP
);

CREATE TABLE benefits (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees (id),
  benefit_type VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL
);

CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees (id),
  work_date DATE NOT NULL,
  hours_worked NUMERIC(5, 2) NOT NULL
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees (id),
  leave_type VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL
);

CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees (id),
  review_period VARCHAR(100) NOT NULL,
  rating INTEGER,
  completed_at TIMESTAMP
);

CREATE TABLE goals (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees (id),
  title VARCHAR(150) NOT NULL,
  status VARCHAR(50) NOT NULL,
  due_date DATE
);

CREATE TABLE feedback_entries (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees (id),
  author_name VARCHAR(150) NOT NULL,
  submitted_at TIMESTAMP NOT NULL,
  notes TEXT NOT NULL
);
