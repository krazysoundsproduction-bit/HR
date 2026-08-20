CREATE TABLE employees (
  id CHAR(36) PRIMARY KEY,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  job_title VARCHAR(150) NOT NULL,
  status VARCHAR(50) NOT NULL,
  hired_at DATETIME NOT NULL
);

CREATE TABLE employee_documents (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at DATETIME NOT NULL,
  CONSTRAINT fk_employee_documents_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE job_postings (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  posted_at DATETIME NOT NULL
);

CREATE TABLE applicants (
  id CHAR(36) PRIMARY KEY,
  job_posting_id CHAR(36) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  stage VARCHAR(50) NOT NULL,
  CONSTRAINT fk_applicants_job_posting FOREIGN KEY (job_posting_id) REFERENCES job_postings(id)
);

CREATE TABLE interviews (
  id CHAR(36) PRIMARY KEY,
  applicant_id CHAR(36) NOT NULL,
  scheduled_at DATETIME NOT NULL,
  interviewer VARCHAR(150) NOT NULL,
  outcome VARCHAR(100),
  CONSTRAINT fk_interviews_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(id)
);

CREATE TABLE salary_records (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  base_salary DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  effective_from DATE NOT NULL,
  CONSTRAINT fk_salary_records_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE payroll_runs (
  id CHAR(36) PRIMARY KEY,
  payroll_period VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  processed_at DATETIME NULL
);

CREATE TABLE benefits (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  benefit_type VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  CONSTRAINT fk_benefits_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE time_entries (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  work_date DATE NOT NULL,
  hours_worked DECIMAL(5, 2) NOT NULL,
  CONSTRAINT fk_time_entries_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE leave_requests (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  leave_type VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL,
  CONSTRAINT fk_leave_requests_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE performance_reviews (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  review_period VARCHAR(100) NOT NULL,
  rating INT NULL,
  completed_at DATETIME NULL,
  CONSTRAINT fk_performance_reviews_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE goals (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  title VARCHAR(150) NOT NULL,
  status VARCHAR(50) NOT NULL,
  due_date DATE NULL,
  CONSTRAINT fk_goals_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE feedback_entries (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  author_name VARCHAR(150) NOT NULL,
  submitted_at DATETIME NOT NULL,
  notes TEXT NOT NULL,
  CONSTRAINT fk_feedback_entries_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);
