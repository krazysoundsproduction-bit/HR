CREATE TABLE employees (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employment_contracts (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  position VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  renewal_dates TEXT,
  document_urls TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE leave_balances (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  year INTEGER NOT NULL,
  annual_leave DECIMAL(6,2) NOT NULL,
  sick_leave DECIMAL(6,2) NOT NULL,
  special_leave DECIMAL(6,2) NOT NULL,
  off_days DECIMAL(6,2) NOT NULL DEFAULT 0,
  carryover DECIMAL(6,2) NOT NULL DEFAULT 0,
  remaining DECIMAL(6,2) NOT NULL,
  used DECIMAL(6,2) NOT NULL DEFAULT 0,
  pending DECIMAL(6,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE leave_requests (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  type VARCHAR(32) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days DECIMAL(6,2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  approved_by VARCHAR(64),
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE leave_policies (
  id VARCHAR(64) PRIMARY KEY,
  contract_type VARCHAR(64) NOT NULL,
  leave_type VARCHAR(32) NOT NULL,
  days_per_year DECIMAL(6,2) NOT NULL,
  carryover_max DECIMAL(6,2) NOT NULL,
  accrual_method VARCHAR(32) NOT NULL
);

CREATE TABLE contract_renewals (
  id VARCHAR(64) PRIMARY KEY,
  contract_id VARCHAR(64) NOT NULL,
  renewal_date DATE NOT NULL,
  new_contract_id VARCHAR(64),
  status VARCHAR(32) NOT NULL,
  requested_by VARCHAR(64) NOT NULL,
  approved_by VARCHAR(64),
  FOREIGN KEY (contract_id) REFERENCES employment_contracts(id),
  FOREIGN KEY (new_contract_id) REFERENCES employment_contracts(id)
);

CREATE TABLE employment_history (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details TEXT NOT NULL,
  changed_by VARCHAR(64) NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  entity VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  changed_by VARCHAR(64) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payload TEXT
);
