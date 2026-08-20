CREATE TABLE payroll_employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  salary_type TEXT NOT NULL,
  base_salary NUMERIC NOT NULL,
  allowances NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0.30,
  super_rate NUMERIC NOT NULL DEFAULT 0.084
);

CREATE TABLE payroll_runs (
  id TEXT PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  locked_at TIMESTAMP,
  total_gross NUMERIC NOT NULL DEFAULT 0,
  total_net NUMERIC NOT NULL DEFAULT 0,
  total_tax NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE payroll_entries (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  gross_pay NUMERIC NOT NULL,
  base_pay NUMERIC NOT NULL,
  allowances NUMERIC NOT NULL,
  overtime_pay NUMERIC NOT NULL,
  deductions NUMERIC NOT NULL,
  tax_withheld NUMERIC NOT NULL,
  super_contribution NUMERIC NOT NULL,
  net_pay NUMERIC NOT NULL,
  notes TEXT,
  FOREIGN KEY (run_id) REFERENCES payroll_runs(id),
  FOREIGN KEY (employee_id) REFERENCES payroll_employees(id)
);

CREATE TABLE salary_adjustments (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  old_salary NUMERIC NOT NULL,
  new_salary NUMERIC NOT NULL,
  effective_date DATE NOT NULL,
  reason TEXT NOT NULL,
  approved_by TEXT,
  status TEXT NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES payroll_employees(id)
);

CREATE TABLE payroll_audits (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  payload TEXT NOT NULL
);
